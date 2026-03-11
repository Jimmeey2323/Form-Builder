import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonRecord = Record<string, any>;

const PAGE_KEYS = ["pages", "steps", "screens", "groups", "slides", "pageGroups", "questionGroups"];
const CHILD_KEYS = [
  "pages",
  "steps",
  "screens",
  "sections",
  "groups",
  "fieldGroups",
  "rows",
  "columns",
  "blocks",
  "elements",
  "fields",
  "questions",
  "items",
  "children",
  "components",
];

const OPTION_KEYS = ["options", "choices", "answers", "items", "values"];
const OPTION_FIELD_TYPES = new Set([
  "select",
  "radio",
  "checkbox",
  "checkboxes",
  "multiselect",
  "multiple-choice",
  "picture-choice",
  "choice-matrix",
  "ranking",
  "submission-picker",
  "dependent",
]);

interface ImportedFormResponse {
  source: "fillout";
  sourceUrl: string;
  formId: string;
  title: string;
  description: string;
  submitButtonText: string;
  pageCount: number;
  sectionCount: number;
  themeHints: {
    formLayout: "single" | "custom";
  };
  fields: JsonRecord[];
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDeepString(value: unknown, depth = 0): string {
  if (depth > 6 || value === null || value === undefined) return "";
  if (typeof value === "string") return stripHtml(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractDeepString(item, depth + 1);
      if (found) return found;
    }
    return "";
  }
  if (typeof value !== "object") return "";

  const obj = value as JsonRecord;
  const keyOrder = [
    "value",
    "label",
    "text",
    "title",
    "name",
    "content",
    "caption",
    "html",
    "prompt",
    "placeholder",
    "logic",
    "pickerStringTemplate",
  ];

  for (const key of keyOrder) {
    if (obj[key] !== undefined) {
      const found = extractDeepString(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return "";
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return /^(1|true|yes|required|y)$/i.test(v.trim());
  return false;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function toCamelCase(input: string): string {
  const s = slugify(input);
  return s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function dedupeByLabelValue(options: JsonRecord[]): JsonRecord[] {
  const seen = new Set<string>();
  const out: JsonRecord[] = [];
  for (const opt of options) {
    const key = `${opt.label}::${opt.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(opt);
  }
  return out;
}

function normalizeType(raw: unknown): string {
  return asString(raw)
    // Split camelCase/PascalCase: "ShortAnswer" → "Short_Answer", "EmailInput" → "Email_Input"
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function getRawType(node: JsonRecord): string {
  return normalizeType(
    node.type ??
      node.questionType ??
      node.fieldType ??
      node.inputType ??
      node.kind ??
      node.widget ??
      node.component,
  );
}

function getLabel(node: JsonRecord): string {
  const fromPrimary = extractDeepString(
    node.label ??
      node.title ??
      node.name ??
      node.question ??
      node.text ??
      node.prompt ??
      node.heading ??
      node.template?.label ??
      node.template?.title ??
      node.template?.text ??
      node.template?.richTitleText,
  );
  if (fromPrimary) return fromPrimary;
  if (typeof node.content === "string") return stripHtml(node.content);
  return "";
}

function getHelpText(node: JsonRecord): string {
  return extractDeepString(
    node.helpText ??
      node.description ??
      node.hint ??
      node.subtitle ??
      node.subLabel ??
      node.template?.caption ??
      node.template?.subtitle ??
      node.template?.richSubtitleText,
  );
}

function getPlaceholder(node: JsonRecord): string {
  return extractDeepString(
    node.placeholder ??
      node.inputPlaceholder ??
      node.example ??
      node.sample ??
      node.template?.placeholder ??
      node.template?.example,
  );
}

function normalizeWidth(node: JsonRecord): "25" | "33" | "50" | "66" | "75" | "100" {
  const numeric =
    Number(node.width) ||
    Number(node.colSpan) ||
    Number(node.columnSpan) ||
    Number(node.layout?.span) ||
    Number(node.layout?.columns) ||
    Number(node.size?.columns);

  if (Number.isFinite(numeric) && numeric > 0) {
    if (numeric <= 3) return "25";
    if (numeric <= 4) return "33";
    if (numeric <= 6) return "50";
    if (numeric <= 8) return "66";
    if (numeric <= 9) return "75";
  }

  const widthText = asString(node.width ?? node.layout?.width);
  if (widthText.endsWith("%")) {
    const pct = Number(widthText.replace("%", ""));
    if (pct <= 25) return "25";
    if (pct <= 33) return "33";
    if (pct <= 50) return "50";
    if (pct <= 66) return "66";
    if (pct <= 75) return "75";
  }

  return "100";
}

function extractOptions(node: JsonRecord): JsonRecord[] {
  let rawOptions: unknown = null;
  for (const key of OPTION_KEYS) {
    if (Array.isArray(node[key])) {
      rawOptions = node[key];
      break;
    }
  }
  if (!Array.isArray(rawOptions) && Array.isArray(node.template?.options?.staticOptions)) {
    rawOptions = node.template.options.staticOptions;
  }
  if (!Array.isArray(rawOptions) && Array.isArray(node.template?.options)) {
    rawOptions = node.template.options;
  }

  if (!Array.isArray(rawOptions)) return [];
  const parsed = rawOptions
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        const label = String(item).trim();
        if (!label) return null;
        return { label, value: slugify(label) || label };
      }
      if (!item || typeof item !== "object") return null;
      const rec = item as JsonRecord;
      const label = extractDeepString(
        rec.label ?? rec.name ?? rec.title ?? rec.text ?? rec.value ?? rec.logic,
      );
      if (!label) return null;
      const value =
        extractDeepString(rec.value ?? rec.id ?? rec.key ?? rec.slug) ||
        slugify(label) ||
        label;
      const imageUrl = extractDeepString(
        rec.imageUrl ??
          rec.image ??
          rec.icon ??
          rec.media?.url ??
          rec.asset?.url,
      );
      return imageUrl ? { label, value, imageUrl } : { label, value };
    })
    .filter((x): x is JsonRecord => !!x);

  return dedupeByLabelValue(parsed);
}

function isContainerLike(rawType: string): boolean {
  return [
    "page",
    "step",
    "screen",
    "section",
    "group",
    "fieldset",
    "layout",
    "container",
    "row",
    "column",
    "columns",
    "grid",
    "panel",
  ].includes(rawType);
}

function isPageLike(node: JsonRecord): boolean {
  const rawType = getRawType(node);
  if (["page", "step", "screen"].includes(rawType)) return true;
  for (const key of PAGE_KEYS) {
    if (Array.isArray(node[key])) return true;
  }
  return false;
}

function isSectionLike(node: JsonRecord): boolean {
  const rawType = getRawType(node);
  if (["section", "group", "fieldset", "panel"].includes(rawType)) return true;
  return (
    (Array.isArray(node.fields) || Array.isArray(node.questions) || Array.isArray(node.children)) &&
    !!getLabel(node) &&
    !isPageLike(node)
  );
}

function isLikelyFieldNode(node: JsonRecord): boolean {
  const rawType = getRawType(node);
  if (isContainerLike(rawType)) return false;

  const hasLabel = !!getLabel(node);
  const hasTypeHint = !!rawType;
  const hasOptions = OPTION_KEYS.some((k) => Array.isArray(node[k]) && node[k].length > 0);
  const hasValidationHint =
    node.required !== undefined ||
    node.isRequired !== undefined ||
    node.validation !== undefined ||
    node.validations !== undefined;

  if (hasOptions && hasLabel) return true;
  if (hasTypeHint && hasLabel) return true;
  return hasTypeHint && hasValidationHint;
}

function mapFilloutType(node: JsonRecord): string {
  const rawType = getRawType(node);
  const hasOptions = extractOptions(node).length > 0;

  const baseMap: Record<string, string> = {
    // ── Text ──────────────────────────────────────────────────────────────
    short_text: "text",
    short_answer: "text",       // Fillout "ShortAnswer"
    shortanswer: "text",
    shorttext: "text",
    textinput: "text",
    text: "text",
    input: "text",
    // ── Textarea ──────────────────────────────────────────────────────────
    long_text: "textarea",
    long_answer: "textarea",    // Fillout "LongAnswer"
    longanswer: "textarea",
    longtext: "textarea",
    paragraph: "textarea",
    textarea: "textarea",
    // ── Email ─────────────────────────────────────────────────────────────
    email: "email",
    email_input: "email",       // Fillout "EmailInput"
    emailinput: "email",
    email_address: "email",
    // ── Phone ─────────────────────────────────────────────────────────────
    phone: "tel",
    phone_number: "tel",
    phonenumber: "tel",
    phone_input: "tel",
    phoneinput: "tel",
    // ── Number ────────────────────────────────────────────────────────────
    number: "number",
    number_input: "number",     // Fillout "NumberInput"
    numberinput: "number",
    integer: "number",
    decimal: "number",
    // ── URL ───────────────────────────────────────────────────────────────
    url: "url",
    website: "url",
    url_input: "url",
    urlinput: "url",
    // ── Password ──────────────────────────────────────────────────────────
    password: "password",
    // ── Select / Dropdown ─────────────────────────────────────────────────
    dropdown: "select",
    dropdown_select: "select",
    select: "select",
    // ── Radio / Single choice ─────────────────────────────────────────────
    radio: "radio",
    multiple_choice: "radio",
    multiplechoice: "radio",
    single_choice: "radio",
    singlechoice: "radio",
    single_select: "radio",
    // ── Checkboxes ────────────────────────────────────────────────────────
    checkbox: "checkbox",
    checkboxes: "checkboxes",
    // ── Multiselect ───────────────────────────────────────────────────────
    multi_select: "multiselect",
    multiselect: "multiselect",
    // ── Switch / Yes-No ───────────────────────────────────────────────────
    yes_no: "switch",
    yesno: "switch",
    toggle: "switch",
    // ── Date / Time ───────────────────────────────────────────────────────
    date: "date",
    date_picker: "date",        // Fillout "DatePicker"
    datepicker: "date",
    time: "time",
    time_picker: "time",        // Fillout "TimePicker"
    timepicker: "time",
    datetime: "datetime-local",
    date_time: "datetime-local",
    date_time_picker: "datetime-local",
    datetimepicker: "datetime-local",
    // ── File ──────────────────────────────────────────────────────────────
    file: "file",
    file_upload: "file",
    fileupload: "file",
    upload: "file",
    // ── Rating / Scale ────────────────────────────────────────────────────
    rating: "rating",
    star_rating: "star-rating",
    linear_scale: "opinion-scale",
    opinion_scale: "opinion-scale",
    // ── Slider ────────────────────────────────────────────────────────────
    slider: "range",
    range: "range",
    // ── Other input types ─────────────────────────────────────────────────
    signature: "signature",
    address: "address",
    address_input: "address",
    payment: "currency",
    currency: "currency",
    legal: "checkbox",
    consent: "checkbox",
    // ── Media / Display ───────────────────────────────────────────────────
    image: "image",
    video: "video",
    pdf: "pdf-viewer",
    heading: "heading",
    title: "heading",
    statement: "paragraph",
    description: "paragraph",
    text_block: "paragraph",
    rich_text: "rich-text",
    html: "html-snippet",
    button: "button",
    sendresponse: "button",
    submit: "button",
    checkout: "button",
    ending: "button",
  };

  let mapped = baseMap[rawType] ?? "";
  if (!mapped) {
    if (hasOptions) mapped = "select";
    else if (node.min !== undefined && node.max !== undefined) mapped = "range";
    else mapped = "text";
  }

  const multi =
    toBool(node.multiple) ||
    toBool(node.allowMultiple) ||
    toBool(node.multiSelect);

  if (mapped === "radio" && multi) mapped = "checkboxes";
  if (mapped === "select" && multi) mapped = "multiselect";

  const hasImageOptions = extractOptions(node).some((opt) => asString(opt.imageUrl));
  if (hasImageOptions && OPTION_FIELD_TYPES.has(mapped)) {
    mapped = "picture-choice";
  }

  return mapped;
}

function makeField(node: JsonRecord, order: number): JsonRecord | null {
  const type = mapFilloutType(node);
  if (type === "button") return null;
  const label = getLabel(node) || `Field ${order + 1}`;
  const slug = slugify(label) || `field_${order + 1}`;
  const name = toCamelCase(slug) || `field${order + 1}`;
  const id = `fillout_${slug}_${order}`;
  const placeholder = getPlaceholder(node);
  const helpText = getHelpText(node);
  const width = normalizeWidth(node);

  const required =
    toBool(node.required) ||
    toBool(node.isRequired) ||
    toBool(node.template?.required) ||
    toBool(node.template?.required?.logic) ||
    toBool(node.validation?.required) ||
    toBool(node.validations?.required);

  const field: JsonRecord = {
    id,
    name,
    label,
    type,
    isRequired: required,
    isHidden: false,
    isReadOnly: false,
    isDisabled: false,
    width,
    order,
  };

  if (placeholder) field.placeholder = placeholder;
  if (helpText) field.helpText = helpText;

  const options = extractOptions(node);
  if (OPTION_FIELD_TYPES.has(type) && options.length > 0) {
    field.options = options;
  }

  const min = Number(
    node.min ??
      node.minimum ??
      node.validation?.min ??
      node.template?.min ??
      node.template?.minLength?.logic ??
      node.template?.minLength?.value,
  );
  const max = Number(
    node.max ??
      node.maximum ??
      node.validation?.max ??
      node.template?.max ??
      node.template?.maxLength?.logic ??
      node.template?.maxLength?.value,
  );
  const step = Number(node.step ?? node.validation?.step ?? node.template?.step);
  if (Number.isFinite(min)) field.min = min;
  if (Number.isFinite(max)) field.max = max;
  if (Number.isFinite(step) && step > 0) field.step = step;

  if (type === "rating" || type === "star-rating") {
    if (!Number.isFinite(field.max)) field.max = 5;
    field.min = 1;
    field.ratingIcon = "star";
  }
  if (type === "range" || type === "opinion-scale") {
    if (!Number.isFinite(field.min)) field.min = 0;
    if (!Number.isFinite(field.max)) field.max = 10;
    if (!Number.isFinite(field.step)) field.step = 1;
    field.rangeShowValue = true;
  }

  return field;
}

function makeBreakField(
  kind: "page-break" | "section-break",
  label: string,
  order: number,
): JsonRecord {
  const slug = slugify(label || kind) || kind;
  return {
    id: `${kind}_${slug}_${order}`,
    name: `${kind.replace("-", "_")}_${slug}`,
    label: label || (kind === "page-break" ? "Page Break" : "Section"),
    type: kind,
    isRequired: false,
    isHidden: false,
    isReadOnly: false,
    isDisabled: false,
    width: "100",
    order,
  };
}

function findFirstArrayByKeys(root: unknown, keys: string[]): unknown[] | null {
  const queue: unknown[] = [root];
  const seen = new WeakSet<object>();

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node as object)) continue;
    seen.add(node as object);

    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }

    const obj = node as JsonRecord;
    for (const key of keys) {
      if (Array.isArray(obj[key]) && obj[key].length > 0) return obj[key];
    }

    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") queue.push(value);
    }
  }
  return null;
}

function estimateFieldCount(root: unknown): number {
  let count = 0;
  const queue: unknown[] = [root];
  const seen = new WeakSet<object>();

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node as object)) continue;
    seen.add(node as object);

    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }

    const obj = node as JsonRecord;
    if (isLikelyFieldNode(obj)) count++;
    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") queue.push(value);
    }
  }
  return count;
}

function extractJsonScripts(html: string): JsonRecord[] {
  const out: JsonRecord[] = [];

  const scriptRegex = /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") out.push(parsed as JsonRecord);
    } catch {
      // ignore invalid JSON script blocks
    }
  }

  const nextDataRegex = /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i;
  const nextMatch = nextDataRegex.exec(html);
  if (nextMatch?.[1]) {
    try {
      const parsed = JSON.parse(nextMatch[1]);
      if (parsed && typeof parsed === "object") out.push(parsed as JsonRecord);
    } catch {
      // ignore
    }
  }

  return out;
}

function pushIdCandidate(target: Set<string>, value: unknown): void {
  const id = asString(value);
  if (!id) return;
  if (!/^[A-Za-z0-9_-]{4,}$/.test(id)) return;
  target.add(id);
}

function parseFilloutUrl(inputUrl: string): { sourceUrl: string; formIdCandidates: string[] } {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    throw new Error("Please enter a valid Fillout form URL.");
  }

  const idCandidates = new Set<string>();
  const path = parsed.pathname;
  const explicitMatch = path.match(/\/(?:t|f|form)\/([A-Za-z0-9_-]+)/i);
  if (explicitMatch?.[1]) {
    idCandidates.add(explicitMatch[1]);
  }

  const qpKeys = ["id", "formId", "form_id", "flowPublicIdentifier", "publicIdentifier", "slug"];
  for (const key of qpKeys) {
    pushIdCandidate(idCandidates, parsed.searchParams.get(key));
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 1) {
    if (segments[0] && !["t", "f", "form"].includes(segments[0].toLowerCase())) {
      pushIdCandidate(idCandidates, segments[0]);
    }
    if (segments.length >= 2 && ["t", "f", "form"].includes(segments[0].toLowerCase())) {
      pushIdCandidate(idCandidates, segments[1]);
    }
  }

  return {
    sourceUrl: parsed.toString(),
    formIdCandidates: [...idCandidates],
  };
}

function extractFormIdCandidatesFromHtml(html: string): string[] {
  const out = new Set<string>();
  const patterns = [
    /data-fillout-id=["']([A-Za-z0-9_-]{4,})["']/gi,
    /"flowPublicIdentifier"\s*:\s*"([A-Za-z0-9_-]{4,})"/gi,
    /"publicIdentifier"\s*:\s*"([A-Za-z0-9_-]{4,})"/gi,
    /\/(?:t|f|form)\/([A-Za-z0-9_-]{4,})/gi,
  ];

  for (const regex of patterns) {
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(html)) !== null) {
      if (match[1]) out.add(match[1]);
    }
  }

  return [...out];
}

function collectFormIdCandidatesFromPayload(root: unknown): string[] {
  const out = new Set<string>();
  const queue: unknown[] = [root];
  const seen = new WeakSet<object>();
  const idKeys = new Set([
    "id",
    "formId",
    "form_id",
    "publicIdentifier",
    "flowPublicIdentifier",
    "slug",
  ]);

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node as object)) continue;
    seen.add(node as object);

    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }

    const obj = node as JsonRecord;
    for (const [key, value] of Object.entries(obj)) {
      if (idKeys.has(key)) pushIdCandidate(out, value);
      if (value && typeof value === "object") queue.push(value);
    }
  }
  return [...out];
}

function pickFirstString(root: unknown, keys: string[]): string {
  const queue: unknown[] = [root];
  const seen = new WeakSet<object>();

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node as object)) continue;
    seen.add(node as object);

    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }

    const obj = node as JsonRecord;
    for (const key of keys) {
      const value = extractDeepString(obj[key]);
      if (value) return value;
    }
    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") queue.push(value);
    }
  }
  return "";
}

function unwrapCandidate(payload: JsonRecord): JsonRecord {
  const candidates = [
    payload.form,
    payload.data?.form,
    payload.data,
    payload.result?.form,
    payload.result,
    payload.props?.pageProps,
    payload.pageProps,
    payload,
  ];
  for (const c of candidates) {
    if (c && typeof c === "object") return c as JsonRecord;
  }
  return payload;
}

function extractFromFlowSnapshot(root: JsonRecord): {
  fields: JsonRecord[];
  sectionCount: number;
  hasCustomWidths: boolean;
} | null {
  const stepMapCandidates = [
    root.flowSnapshot?.template?.steps,
    root.template?.steps,
    root.data?.flowSnapshot?.template?.steps,
    root.props?.pageProps?.flowSnapshot?.template?.steps,
    root.pageProps?.flowSnapshot?.template?.steps,
  ];

  let stepsMap: JsonRecord | null = null;
  for (const candidate of stepMapCandidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      stepsMap = candidate as JsonRecord;
      break;
    }
  }
  if (!stepsMap) return null;

  const stepValues = Object.values(stepsMap).filter(
    (step): step is JsonRecord => !!step && typeof step === "object" && !Array.isArray(step),
  );
  if (stepValues.length === 0) return null;

  const skipStepTypes = new Set(["ending", "checkout", "payment", "logic", "result", "results"]);
  const pageStepTypes = new Set(["form", "page", "step", "screen", "quiz"]);

  const orderedPageSteps = stepValues
    .filter((step) => {
      const stepType = getRawType(step);
      const hasWidgets = !!(step.template?.widgets && typeof step.template.widgets === "object");
      if (skipStepTypes.has(stepType)) return false;
      if (pageStepTypes.has(stepType)) return true;
      return hasWidgets;
    })
    .sort((a, b) => {
      const ax = Number(a.position?.x ?? 0);
      const bx = Number(b.position?.x ?? 0);
      if (ax !== bx) return ax - bx;
      const ay = Number(a.position?.y ?? 0);
      const by = Number(b.position?.y ?? 0);
      return ay - by;
    });

  if (orderedPageSteps.length === 0) return null;

  const fields: JsonRecord[] = [];
  let sectionCount = 0;
  let hasCustomWidths = false;

  const addField = (field: JsonRecord) => {
    field.order = fields.length;
    if (field.width && field.width !== "100") hasCustomWidths = true;
    fields.push(field);
  };

  const skipWidgetTypes = new Set(["button", "submit", "sendresponse", "thankyou", "ending", "payment"]);

  orderedPageSteps.forEach((step, pageIdx) => {
    if (pageIdx > 0) {
      const pageLabel = getLabel(step) || `Page ${pageIdx + 1}`;
      addField(makeBreakField("page-break", pageLabel, fields.length));
    }

    const widgetsRaw = step.template?.widgets ?? step.widgets;
    if (!widgetsRaw || typeof widgetsRaw !== "object" || Array.isArray(widgetsRaw)) return;

    const widgets = Object.values(widgetsRaw as JsonRecord).filter(
      (w): w is JsonRecord => !!w && typeof w === "object" && !Array.isArray(w),
    );

    widgets
      .sort((a, b) => {
        const ar = Number(a.position?.row ?? 0);
        const br = Number(b.position?.row ?? 0);
        if (ar !== br) return ar - br;
        const ac = Number(a.position?.column ?? 0);
        const bc = Number(b.position?.column ?? 0);
        return ac - bc;
      })
      .forEach((widget) => {
        const widgetType = getRawType(widget);
        if (skipWidgetTypes.has(widgetType)) return;

        if (isSectionLike(widget)) {
          const sectionLabel = getLabel(widget);
          if (sectionLabel) {
            addField(makeBreakField("section-break", sectionLabel, fields.length));
            sectionCount += 1;
          }
        }

        const mapped = makeField(widget, fields.length);
        if (mapped) addField(mapped);
      });
  });

  if (fields.length === 0) return null;
  return { fields, sectionCount, hasCustomWidths };
}

function normalizeImportedForm(
  sourceUrl: string,
  formId: string,
  rawPayload: JsonRecord,
): ImportedFormResponse {
  const root = unwrapCandidate(rawPayload);

  const snapshotExtracted = extractFromFlowSnapshot(root);
  if (snapshotExtracted && snapshotExtracted.fields.length > 0) {
    const title =
      pickFirstString(root, ["title", "name", "formTitle", "formName"]) ||
      `Imported Fillout ${formId}`;
    const description = pickFirstString(root, ["description", "subtitle", "subTitle"]);
    const submitButtonText =
      pickFirstString(root, ["submitButtonText", "submitLabel", "buttonText"]) || "Submit";
    const pageCount = snapshotExtracted.fields.filter((f) => f.type === "page-break").length + 1;

    return {
      source: "fillout",
      sourceUrl,
      formId,
      title,
      description,
      submitButtonText,
      pageCount,
      sectionCount: snapshotExtracted.sectionCount,
      themeHints: {
        formLayout: snapshotExtracted.hasCustomWidths ? "custom" : "single",
      },
      fields: snapshotExtracted.fields,
    };
  }

  const fields: JsonRecord[] = [];
  const visited = new WeakSet<object>();
  let sectionCount = 0;
  let hasCustomWidths = false;

  const addField = (field: JsonRecord) => {
    field.order = fields.length;
    if (field.width && field.width !== "100") hasCustomWidths = true;
    fields.push(field);
  };

  const INLINE_PAGE_TYPES = new Set(["page", "step", "screen"]);

  const walkNode = (node: unknown, depth = 0) => {
    if (!node || typeof node !== "object") return;
    if (visited.has(node as object)) return;
    visited.add(node as object);

    if (Array.isArray(node)) {
      for (const item of node) walkNode(item, depth);
      return;
    }

    const obj = node as JsonRecord;
    const rawType = getRawType(obj);
    const isInlinePage = depth > 0 && INLINE_PAGE_TYPES.has(rawType);

    if (isInlinePage) {
      // An explicit page/step/screen node found mid-traversal → page break
      if (fields.length > 0) {
        const pageLabel = getLabel(obj);
        addField(makeBreakField("page-break", pageLabel, fields.length));
      }
    } else if (isSectionLike(obj)) {
      const sectionLabel = getLabel(obj);
      if (sectionLabel) {
        addField(makeBreakField("section-break", sectionLabel, fields.length));
        sectionCount += 1;
      }
    }

    if (!isInlinePage && isLikelyFieldNode(obj)) {
      const mapped = makeField(obj, fields.length);
      if (mapped) addField(mapped);
    }

    let traversed = false;
    for (const key of CHILD_KEYS) {
      const value = obj[key];
      if (Array.isArray(value) || (value && typeof value === "object")) {
        traversed = true;
        walkNode(value, depth + 1);
      }
    }

    if (!traversed) {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith("_")) continue;
        if (!value || typeof value !== "object") continue;
        if (Array.isArray(value) && value.length > 0 && typeof value[0] !== "object") continue;
        walkNode(value, depth + 1);
      }
    }
  };

  const pageNodes = findFirstArrayByKeys(root, PAGE_KEYS);
  if (pageNodes && pageNodes.length > 0) {
    pageNodes.forEach((page, idx) => {
      if (idx > 0) {
        const label = (page && typeof page === "object" && getLabel(page as JsonRecord)) || `Page ${idx + 1}`;
        addField(makeBreakField("page-break", label, fields.length));
      }
      // Walk children of the page container directly — avoids the page node
      // itself triggering a spurious section-break (it has a name + fields array).
      if (page && typeof page === "object" && !Array.isArray(page)) {
        const pageObj = page as JsonRecord;
        let hasChildren = false;
        for (const key of CHILD_KEYS) {
          const val = pageObj[key];
          if (Array.isArray(val) || (val && typeof val === "object")) {
            hasChildren = true;
            walkNode(val, 1);
          }
        }
        if (!hasChildren) walkNode(page, 1);
      } else {
        walkNode(page, 1);
      }
    });
  } else {
    walkNode(root);
  }

  const cleanedFields = fields.filter((field) => {
    const type = asString(field.type);
    if (type === "section-break" || type === "page-break") return true;
    return !!asString(field.label);
  });

  if (cleanedFields.length === 0) {
    throw new Error("No importable fields were found in this Fillout form.");
  }

  cleanedFields.forEach((f, idx) => {
    f.order = idx;
  });

  const title =
    pickFirstString(root, ["title", "name", "formTitle", "formName"]) ||
    `Imported Fillout ${formId}`;
  const description = pickFirstString(root, ["description", "subtitle", "subTitle"]);
  const submitButtonText =
    pickFirstString(root, ["submitButtonText", "submitLabel", "buttonText"]) || "Submit";

  const pageCount = cleanedFields.filter((f) => f.type === "page-break").length + 1;

  return {
    source: "fillout",
    sourceUrl,
    formId,
    title,
    description,
    submitButtonText,
    pageCount,
    sectionCount,
    themeHints: {
      formLayout: hasCustomWidths ? "custom" : "single",
    },
    fields: cleanedFields,
  };
}

async function fetchJson(url: string, headers: HeadersInit): Promise<JsonRecord | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") || "";
    if (!ctype.toLowerCase().includes("application/json")) return null;
    const parsed = await res.json();
    if (parsed && typeof parsed === "object") return parsed as JsonRecord;
    return null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const sourceUrl = asString(body?.url);
    if (!sourceUrl) {
      throw new Error('Missing "url" in request body.');
    }

    const { sourceUrl: normalizedSourceUrl, formIdCandidates: parsedFormIds } = parseFilloutUrl(sourceUrl);
    const formIdCandidates = new Set(parsedFormIds);

    const authToken = Deno.env.get("FILLOUT_API_KEY");
    const baseHeaders: HeadersInit = {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; JFormsImporter/1.0)",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const payloadCandidates: JsonRecord[] = [];
    const triedApiIds = new Set<string>();
    const pullApiPayloadsFor = async (candidateId: string) => {
      if (!candidateId || triedApiIds.has(candidateId)) return;
      triedApiIds.add(candidateId);

      const endpoints = [
        `https://api.fillout.com/v1/forms/${candidateId}`,
        `https://api.fillout.com/v1/api/forms/${candidateId}`,
        `https://api.fillout.com/v1/public/forms/${candidateId}`,
      ];

      for (const endpoint of endpoints) {
        const payload = await fetchJson(endpoint, baseHeaders);
        if (payload) payloadCandidates.push(payload);
      }
    };

    for (const candidateId of formIdCandidates) {
      await pullApiPayloadsFor(candidateId);
    }

    try {
      const htmlRes = await fetch(normalizedSourceUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "Mozilla/5.0 (compatible; JFormsImporter/1.0)",
        },
      });
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        extractFormIdCandidatesFromHtml(html).forEach((id) => formIdCandidates.add(id));
        for (const candidateId of formIdCandidates) {
          await pullApiPayloadsFor(candidateId);
        }
        payloadCandidates.push(...extractJsonScripts(html));
      }
    } catch {
      // HTML fallback is best effort only
    }

    if (payloadCandidates.length === 0) {
      throw new Error(
        "Could not fetch Fillout metadata. Please verify the URL is public and accessible.",
      );
    }

    const ranked = payloadCandidates
      .map((candidate) => {
        const unwrapped = unwrapCandidate(candidate);
        collectFormIdCandidatesFromPayload(unwrapped).forEach((id) => formIdCandidates.add(id));
        const fieldCount = estimateFieldCount(unwrapped);
        const pageCount = (findFirstArrayByKeys(unwrapped, PAGE_KEYS) || []).length;
        return {
          candidate,
          score: fieldCount * 10 + pageCount * 2,
        };
      })
      .sort((a, b) => b.score - a.score);

    const best = ranked[0]?.candidate;
    if (!best) {
      throw new Error("Unable to parse this Fillout form structure.");
    }

    const resolvedFormId =
      [...formIdCandidates][0] ||
      pickFirstString(best, ["flowPublicIdentifier", "publicIdentifier", "formId", "id"]) ||
      `fillout_${Date.now()}`;

    const imported = normalizeImportedForm(normalizedSourceUrl, resolvedFormId, best);
    return new Response(JSON.stringify({ form: imported }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown import error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
