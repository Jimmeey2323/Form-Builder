import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_FIELD_TYPES = [
  'text', 'email', 'tel', 'number', 'url', 'password', 'textarea',
  'select', 'radio', 'checkbox', 'date', 'time', 'datetime-local',
  'file', 'range', 'color', 'hidden', 'lookup', 'formula',
  'conditional', 'dependent', 'rating', 'signature', 'section-break',
  'page-break', 'heading', 'paragraph', 'banner', 'picture-choice',
  'multiselect', 'switch', 'multiple-choice', 'checkboxes',
  'choice-matrix', 'date-range', 'ranking', 'star-rating',
  'opinion-scale', 'rich-text', 'address', 'currency',
  'voice-recording', 'subform', 'section-collapse',
  'divider', 'html-snippet', 'image', 'video', 'pdf-viewer',
  'social-links', 'member-search', 'momence-sessions',
];

// ─── Robust CSV parser (handles quoted fields, \r\n) ─────────────────────────
function parseCSV(raw: string): Record<string, string>[] {
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const lines = splitLines(text);
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(h =>
    h.trim().toUpperCase().replace(/\s+/g, '_')
  );

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.every(v => !v.trim())) continue; // skip blank rows
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitLines(text: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Helper: slugify a string ────────────────────────────────────────────────
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Build the prompt ─────────────────────────────────────────────────────────
function buildSystemPrompt(): string {
  return `You are a JSON-only form-builder assistant. You MUST return a single valid JSON object — no markdown, no explanation.

Convert CSV rows into form template JSON. Group rows by FORM_NAME to produce separate templates.

=== VALID FIELD TYPES ===
${VALID_FIELD_TYPES.join(', ')}

=== FIELD TYPE MAPPING RULES ===
- text, string, short text, first name, last name → "text"
- email, e-mail → "email"
- phone, mobile, tel, telephone, contact number → "tel"
- number, numeric, integer, age, quantity → "number"
- url, link, website → "url"
- password → "password"
- textarea, long text, multiline, paragraph text, comments, notes, message → "textarea"
- select, dropdown, single select, single-select → "select"
- radio, radio button, single choice → "radio"
- checkbox, boolean, yes/no, agree, consent, tick → "checkbox"
- checkboxes, multi check → "checkboxes"
- multiselect, multi select, multi-select → "multiselect"
- multiple choice → "multiple-choice"
- date → "date"
- time → "time"
- datetime, date time, date & time → "datetime-local"
- file, upload, file upload, attachment, document → "file"
- hidden, hidden field → "hidden"
- heading, header, title, section title → "heading"
- paragraph, text block, description block, rich text → "paragraph"
- divider, separator, hr, line → "divider"
- section break, section, section header → "section-break"
- switch, toggle → "switch"
- rating, star → "rating"
- star rating → "star-rating"
- signature → "signature"
- address, location, home address → "address"
- currency, money, price, cost, amount → "currency"
- date range → "date-range"
- ranking, rank, order → "ranking"
- opinion scale, likert scale, scale, satisfaction → "opinion-scale"
- range, slider → "range"
- color, colour → "color"
- Unrecognized type → default to "text"

=== OPTIONS PARSING ===
The OPTIONS column may contain comma-separated values like: "Option A, Option B, Option C"
Or pipe-separated: "Option A | Option B | Option C"
Parse them into: [{"label": "Option A", "value": "option_a"}, ...]
where value = lowercase snake_case of label.
Only include options for types: select, radio, checkbox, checkboxes, multiselect, multiple-choice, picture-choice, choice-matrix, ranking

=== BOOLEAN PARSING ===
IS_REQUIRED and IS_HIDDEN: treat "yes", "true", "1", "y", "required", "hidden" (case-insensitive) as true; all else as false.

=== ICON SELECTION ===
Pick an emoji icon that best represents the form's purpose based on its name, category, and fields.
Examples: contact → 📞, event registration → 🎟️, survey → 📊, medical → 🏥, order → 🛒, feedback → 💬, job application → 💼, profile → 👤, booking → 📅

=== DESCRIPTION INFERENCE ===
If the DESCRIPTION column for a field is present, use it as both placeholder and helpText.
Infer a concise form-level description from the category, subcategory, and field names.

=== FIELD NAME RULES ===
- id: unique snake_case string, e.g. "field_first_name"
- name: camelCase, e.g. "firstName"
- label: exact FIELD_LABEL value from CSV

=== OUTPUT FORMAT ===
Return exactly this JSON structure:
{
  "templates": [
    {
      "id": "slugified-form-name",
      "name": "Form Name",
      "description": "Brief description of what this form is for",
      "category": "Category value (capitalize)",
      "subCategory": "SubCategory value or empty string",
      "icon": "emoji",
      "isUserCreated": true,
      "fields": [
        {
          "id": "field_unique_snake",
          "name": "camelCaseName",
          "label": "Field Label",
          "type": "mapped_type",
          "placeholder": "inferred placeholder",
          "helpText": "from DESCRIPTION column",
          "isRequired": false,
          "isHidden": false,
          "isReadOnly": false,
          "isDisabled": false,
          "width": "100",
          "order": 0,
          "options": []
        }
      ],
      "config": {
        "title": "Form Name",
        "description": "Brief description",
        "submitButtonText": "Submit",
        "successMessage": "Thank you for your submission!"
      }
    }
  ]
}`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY secret is not configured in Supabase. Run: npx supabase secrets set OPENAI_API_KEY=sk-...');
    }

    const { csv } = await req.json();
    if (!csv || typeof csv !== 'string') {
      throw new Error('Request body must contain a "csv" string field');
    }

    // Parse CSV into rows first so we can do basic validation
    const rows = parseCSV(csv);
    if (rows.length === 0) {
      throw new Error('No data rows found in CSV. Make sure the file has a header row and at least one data row.');
    }

    // Detect column names to give AI better context
    const columnNames = Object.keys(rows[0]);
    const formNames = [...new Set(rows.map(r => r['FORM_NAME'] || r['FORM NAME'] || 'Untitled Form').filter(Boolean))];

    console.log(`Processing ${rows.length} rows across ${formNames.length} form(s): ${formNames.join(', ')}`);

    const userMessage = `Convert these ${rows.length} CSV rows into form templates. Detected columns: ${columnNames.join(', ')}.

Form names found: ${formNames.join(', ')}

Row data:
${JSON.stringify(rows, null, 2)}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`OpenAI API error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    let result: { templates: any[] };
    try {
      result = JSON.parse(content);
    } catch {
      throw new Error('OpenAI returned invalid JSON. Please try again.');
    }

    if (!result.templates || !Array.isArray(result.templates)) {
      throw new Error('AI response missing "templates" array');
    }

    // Post-process: ensure each template has stable IDs + timestamps
    const now = new Date().toISOString();
    result.templates = result.templates.map((t: any) => ({
      ...t,
      id: t.id || slugify(t.name || 'template'),
      isUserCreated: true,
      createdAt: now,
      fields: (t.fields || []).map((f: any, idx: number) => ({
        isReadOnly: false,
        isDisabled: false,
        width: '100',
        ...f,
        id: f.id || `field_${slugify(f.name || f.label || 'field')}_${idx}`,
        order: idx,
        options: (f.options || []).filter((o: any) => o && o.label),
      })),
    }));

    console.log(`Returning ${result.templates.length} template(s)`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('csv-to-template error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
