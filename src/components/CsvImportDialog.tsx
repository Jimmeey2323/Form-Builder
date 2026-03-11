import React, { useState, useCallback, useRef, DragEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Wand2,
  FolderOpen,
  Loader2,
  BookMarked,
  LayoutDashboard,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Template } from '@/data/templates';
import { FieldType } from '@/types/formField';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Step = 'upload' | 'processing' | 'preview' | 'done' | 'error';

interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with parsed templates when user saves them */
  onSaveTemplates: (templates: Template[]) => void;
  /** Called when user wants to create forms immediately from the templates */
  onCreateForms: (templates: Template[]) => void;
}

// ─── Tiny field-type badge colour map ──────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-100 text-blue-700',
  email: 'bg-purple-100 text-purple-700',
  tel: 'bg-green-100 text-green-700',
  number: 'bg-orange-100 text-orange-700',
  textarea: 'bg-yellow-100 text-yellow-700',
  select: 'bg-blue-100 text-blue-700',
  radio: 'bg-rose-100 text-rose-700',
  checkbox: 'bg-blue-100 text-blue-700',
  date: 'bg-indigo-100 text-indigo-700',
  hidden: 'bg-gray-100 text-gray-500',
  heading: 'bg-slate-100 text-slate-700',
};

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? 'bg-muted text-muted-foreground';
}

// ─── Template Preview Card ──────────────────────────────────────────────────
function TemplatePreviewCard({ template }: { template: Template }) {
  const [expanded, setExpanded] = useState(false);
  const visibleFields = template.fields.slice(0, expanded ? template.fields.length : 5);
  const extra = template.fields.length - 5;

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className="text-2xl leading-none mt-0.5">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-foreground truncate">{template.name}</h3>
            {template.category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                {template.category}
              </Badge>
            )}
            {template.subCategory && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 text-muted-foreground">
                {template.subCategory}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-xs font-semibold text-primary">{template.fields.length}</span>
          <span className="text-xs text-muted-foreground"> fields</span>
        </div>
      </div>

      {/* Field list */}
      <div className="px-4 pb-2 space-y-1">
        {visibleFields.map((field, i) => (
          <div
            key={i}
            className="flex items-center gap-2 py-1 px-2 rounded-md bg-muted/40 text-xs"
          >
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${typeColor(field.type)}`}>
              {field.type}
            </span>
            <span className="truncate text-foreground font-medium">{field.label}</span>
            {field.isRequired && (
              <span className="ml-auto shrink-0 text-[10px] font-semibold text-rose-500">required</span>
            )}
            {field.isHidden && (
              <EyeOff className="ml-auto h-2.5 w-2.5 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
        {template.fields.length > 5 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="h-3 w-3" /> Show less</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> +{extra} more fields</>
            )}
          </button>
        )}
      </div>

      {/* Options count for fields that have them */}
      {(() => {
        const withOpts = template.fields.filter(f => f.options && f.options.length > 0).length;
        return withOpts > 0 ? (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-muted-foreground">
              {withOpts} field{withOpts > 1 ? 's' : ''} with dropdown/choice options
            </p>
          </div>
        ) : null;
      })()}
    </div>
  );
}

// ─── Download sample CSV helper ─────────────────────────────────────────────
function downloadSampleCsv() {
  const sample = [
    'FIELD LABEL,FIELD TYPE,DESCRIPTION,OPTIONS,IS REQUIRED,IS HIDDEN,FORM NAME,CATEGORY,SUB CATEGORY',
    'First Name,text,Enter your first name,,yes,no,Contact Form,Marketing,Lead Capture',
    'Last Name,text,Enter your last name,,yes,no,Contact Form,Marketing,Lead Capture',
    'Email Address,email,Your business email,,yes,no,Contact Form,Marketing,Lead Capture',
    'Phone Number,tel,Mobile number with country code,,no,no,Contact Form,Marketing,Lead Capture',
    'Company,text,Your organisation name,,no,no,Contact Form,Marketing,Lead Capture',
    'Enquiry Type,select,What is your enquiry about?,"Sales, Support, Partnership, Other",yes,no,Contact Form,Marketing,Lead Capture',
    'Message,textarea,Tell us how we can help,,yes,no,Contact Form,Marketing,Lead Capture',
    'Full Name,text,Your complete name,,yes,no,Event Registration,Events,Workshop',
    'Email,email,Email for event confirmation,,yes,no,Event Registration,Events,Workshop',
    'Session,select,Which session would you like to attend?,"Morning (9am), Afternoon (2pm), Evening (6pm)",yes,no,Event Registration,Events,Workshop',
    'Dietary Requirements,multiselect,Select all that apply,"Vegetarian, Vegan, Gluten Free, Nut Allergy",no,no,Event Registration,Events,Workshop',
    'UTM Source,hidden,,,,yes,Event Registration,Events,Workshop',
  ].join('\n');

  const blob = new Blob([sample], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'form-template-sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Local CSV parser (fallback when edge function is unavailable) ────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseCsvText(raw: string): Record<string, string>[] {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toUpperCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    // simple CSV split respecting double-quoted fields
    const values: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line + ',') {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  }).filter(r => Object.values(r).some(v => v.trim()));
}

const TYPE_MAP: Record<string, string> = {
  'text': 'text', 'string': 'text', 'short text': 'text',
  'email': 'email', 'e-mail': 'email',
  'phone': 'tel', 'mobile': 'tel', 'tel': 'tel', 'telephone': 'tel',
  'number': 'number', 'numeric': 'number', 'integer': 'number', 'age': 'number',
  'url': 'url', 'link': 'url', 'website': 'url',
  'password': 'password',
  'textarea': 'textarea', 'long text': 'textarea', 'multiline': 'textarea', 'paragraph': 'textarea', 'message': 'textarea', 'notes': 'textarea',
  'select': 'select', 'dropdown': 'select', 'single select': 'select',
  'radio': 'radio', 'radio button': 'radio',
  'checkbox': 'checkbox', 'boolean': 'checkbox', 'yes/no': 'checkbox',
  'checkboxes': 'checkboxes', 'multi check': 'checkboxes',
  'multiselect': 'multiselect', 'multi select': 'multiselect', 'multiple select': 'multiselect',
  'date': 'date', 'time': 'time',
  'file': 'file', 'upload': 'file', 'attachment': 'file',
  'hidden': 'hidden',
  'heading': 'heading', 'header': 'heading', 'section title': 'heading',
  'switch': 'switch', 'toggle': 'switch',
  'rating': 'rating', 'star': 'star-rating', 'star-rating': 'star-rating',
  'signature': 'signature',
  'address': 'address',
  'currency': 'currency',
  'range': 'range', 'slider': 'range', 'range slider': 'range',
  'opinion scale': 'opinion-scale', 'likert': 'opinion-scale', 'likert scale': 'opinion-scale',
  'picture choice': 'picture-choice', 'image choice': 'picture-choice', 'photo choice': 'picture-choice',
  'choice matrix': 'choice-matrix', 'matrix': 'choice-matrix',
  'ranking': 'ranking', 'rank': 'ranking',
  'submission picker': 'submission-picker', 'submissions picker': 'submission-picker', 'submission': 'submission-picker',
  'subform': 'subform', 'sub form': 'subform', 'nested form': 'subform',
  'html': 'html-snippet', 'html snippet': 'html-snippet', 'embed': 'html-snippet',
  'section collapse': 'section-collapse', 'collapsible section': 'section-collapse', 'accordion': 'section-collapse',
  'divider': 'divider', 'separator': 'divider', 'line': 'divider',
  'spacer': 'spacer', 'space': 'spacer',
  'page break': 'page-break', 'pagebreak': 'page-break',
  'section break': 'section-break',
  'lookup': 'lookup', 'lookup field': 'lookup', 'reference': 'lookup',
  'formula': 'formula', 'calc': 'formula', 'calculation': 'formula', 'computed': 'formula',
  'conditional': 'conditional', 'condition': 'conditional', 'logic': 'conditional',
  'dependent': 'dependent', 'dependent dropdown': 'dependent', 'cascading': 'dependent',
  'image': 'image', 'photo': 'image',
  'video': 'video',
  'pdf': 'pdf-viewer', 'pdf viewer': 'pdf-viewer', 'pdf-viewer': 'pdf-viewer',
  'rich text': 'rich-text', 'richtext': 'rich-text',
  'color': 'color', 'colour': 'color',
};

function mapFieldType(raw: string): string {
  const normalized = (raw || 'text').toLowerCase().trim();
  return TYPE_MAP[normalized] ?? 'text';
}

function parseBool(v: string): boolean {
  return /^(yes|true|1|y|required|hidden)$/i.test((v || '').trim());
}

function parseOptions(raw: string) {
  if (!raw?.trim()) return [];
  const sep = raw.includes('|') ? '|' : ',';
  return raw.split(sep).map(o => o.trim()).filter(Boolean).map(label => ({
    label,
    value: slugify(label),
  }));
}

function localParseCsvToTemplates(csvText: string): Template[] {
  const rows = parseCsvText(csvText);
  if (!rows.length) return [];

  const formGroups: Record<string, typeof rows> = {};
  for (const row of rows) {
    const name = row['FORM_NAME'] || row['FORM NAME'] || 'Imported Form';
    if (!formGroups[name]) formGroups[name] = [];
    formGroups[name].push(row);
  }

  const now = new Date().toISOString();
  return Object.entries(formGroups).map(([formName, fieldRows]) => {
    const firstRow = fieldRows[0];
    const category = firstRow['CATEGORY'] || 'General';
    const subCategory = firstRow['SUB_CATEGORY'] || firstRow['SUB CATEGORY'] || '';
    const fields = fieldRows.map((row, idx) => {
      const label = row['FIELD_LABEL'] || row['FIELD LABEL'] || `Field ${idx + 1}`;
      const rawType = row['FIELD_TYPE'] || row['FIELD TYPE'] || 'text';
      const type = mapFieldType(rawType);
      const optionsRaw = row['OPTIONS'] || '';
      const withOpts = ['select','radio','checkbox','checkboxes','multiselect','multiple-choice','picture-choice','choice-matrix','ranking','submission-picker','dependent'].includes(type);
      return {
        id: `field_${slugify(label)}_${idx}`,
        name: label.replace(/\s+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c: string) => c.toLowerCase()),
        label,
        type: type as FieldType,
        placeholder: row['DESCRIPTION'] || '',
        helpText: row['DESCRIPTION'] || '',
        isRequired: parseBool(row['IS_REQUIRED'] || row['IS REQUIRED'] || ''),
        isHidden: parseBool(row['IS_HIDDEN'] || row['IS HIDDEN'] || ''),
        isReadOnly: false,
        isDisabled: false,
        width: '100',
        order: idx,
        options: withOpts ? parseOptions(optionsRaw) : [],
      } as Template['fields'][number];
    });

    return {
      id: slugify(formName),
      name: formName,
      description: `Imported from CSV — ${category}`,
      category,
      subCategory,
      icon: '📋',
      isUserCreated: true,
      createdAt: now,
      fields,
      config: {
        title: formName,
        description: `Imported from CSV`,
        submitButtonText: 'Submit',
        successMessage: 'Thank you for your submission!',
      },
    } as Template;
  });
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────
export function CsvImportDialog({
  open,
  onClose,
  onSaveTemplates,
  onCreateForms,
}: CsvImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingMsg, setProcessingMsg] = useState('Sending to AI…');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setFileName(null);
    setCsvText(null);
    setTemplates([]);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── File reading ──
  const readFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && !file.type.includes('comma')) {
      setError('Please upload a .csv file');
      setStep('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text?.trim()) {
        setError('The file appears to be empty');
        setStep('error');
        return;
      }
      setFileName(file.name);
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  // ── AI processing ──
  const handleGenerate = async () => {
    if (!csvText) return;
    setStep('processing');
    setError(null);

    const messages = [
      'Sending to AI…',
      'Parsing field types…',
      'Mapping options and rules…',
      'Building template structure…',
      'Almost there…',
    ];
    let msgIdx = 0;
    setProcessingMsg(messages[0]);
    const ticker = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, messages.length - 1);
      setProcessingMsg(messages[msgIdx]);
    }, 1800);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('csv-to-template', {
        body: { csv: csvText },
      });

      clearInterval(ticker);

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.templates?.length) throw new Error('No templates were generated. Check that your CSV has valid columns.');

      setTemplates(data.templates as Template[]);
      setStep('preview');
    } catch (err: any) {
      clearInterval(ticker);
      // ── Fallback: local parsing (no AI required) ──────────────────────────
      try {
        setProcessingMsg('Parsing locally (AI unavailable)…');
        const localTemplates = localParseCsvToTemplates(csvText);
        if (localTemplates.length === 0 || localTemplates.every(t => t.fields.length === 0)) {
          throw new Error('No fields found. Make sure your CSV has FIELD LABEL and FIELD TYPE columns.');
        }
        setTemplates(localTemplates);
        setStep('preview');
        toast.info('Parsed locally — AI was unavailable. Field types may need review.');
      } catch (localErr: any) {
        setError((err.message || 'An unexpected error occurred') + '\n\nLocal fallback: ' + localErr.message);
        setStep('error');
      }
    }
  };

  // ── Actions ──
  const handleSaveTemplates = () => {
    onSaveTemplates(templates);
    toast.success(`${templates.length} template${templates.length > 1 ? 's' : ''} saved`);
    setStep('done');
  };

  const handleCreateForms = () => {
    onCreateForms(templates);
    toast.success(`${templates.length} form${templates.length > 1 ? 's' : ''} created from templates`);
    handleClose();
  };

  const handleSaveAndCreate = () => {
    onSaveTemplates(templates);
    onCreateForms(templates);
    toast.success(`${templates.length} template${templates.length > 1 ? 's' : ''} saved and forms created`);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-white" />
            </div>
            Import Forms from CSV
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload a CSV with your field definitions and AI will build accurate form templates automatically.
          </DialogDescription>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ── STEP: upload ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Required columns reference */}
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Required CSV columns:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['FIELD LABEL', 'FIELD TYPE', 'DESCRIPTION', 'OPTIONS', 'IS REQUIRED', 'IS HIDDEN', 'FORM NAME', 'CATEGORY', 'SUB CATEGORY'].map(col => (
                    <code key={col} className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 font-mono">
                      {col}
                    </code>
                  ))}
                </div>
                <button
                  onClick={downloadSampleCsv}
                  className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" /> Download sample CSV
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center gap-3 cursor-pointer
                  rounded-2xl border-2 border-dashed transition-all duration-200 py-12
                  ${dragging
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : csvText
                      ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                      : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {csvText ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm text-green-700 dark:text-green-400">{fileName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Click to change file</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                      ${dragging ? 'bg-primary/15' : 'bg-muted'}`}>
                      <Upload className={`h-7 w-7 transition-colors ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-semibold text-sm">
                        {dragging ? 'Drop it here!' : 'Drop your CSV here'}
                      </p>
                      <p className="text-xs text-muted-foreground">or click to browse &nbsp;·&nbsp; .csv files only</p>
                    </div>
                  </>
                )}
              </div>

              {/* AI note */}
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">Powered by GPT-4o.</span> AI will intelligently map your field types,
                  parse option lists, and build complete form templates — with no manual configuration needed.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP: processing ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-9 w-9 text-white" />
                </div>
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-blue-400/30 to-blue-500/30 -z-10 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-base">{processingMsg}</p>
                <p className="text-sm text-muted-foreground">GPT-4o is building your form templates</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{ animationDelay: `${i * 0.2}s` }}
                    className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: preview ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {templates.length} template{templates.length > 1 ? 's' : ''} generated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Review your templates below before saving
                  </p>
                </div>
                <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-300 bg-green-50">
                  <CheckCircle2 className="h-3 w-3" /> AI Complete
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {templates.map(template => (
                  <TemplatePreviewCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: done ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-base">Templates Saved!</p>
                <p className="text-sm text-muted-foreground">
                  {templates.length} template{templates.length > 1 ? 's' : ''} are now available in the Template Library.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP: error ── */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">Something went wrong</p>
                <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              </div>
              {error?.includes('OPENAI_API_KEY') && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-left max-w-sm">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Setup required:</p>
                  <code className="text-[11px] text-amber-800 dark:text-amber-200 block bg-amber-100 dark:bg-amber-900/30 rounded p-2">
                    npx supabase secrets set OPENAI_API_KEY=sk-...
                  </code>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={reset}>
                Try again
              </Button>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 shrink-0 bg-muted/30">
          {/* Left */}
          <div className="text-xs text-muted-foreground">
            {step === 'upload' && csvText && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" /> {fileName}
              </span>
            )}
            {step === 'preview' && (
              <span>{templates.reduce((n, t) => n + t.fields.length, 0)} total fields across {templates.length} template{templates.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            {step === 'upload' && (
              <>
                <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={!csvText}
                  onClick={handleGenerate}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white gap-1.5 hover:opacity-90"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Generate with AI
                </Button>
              </>
            )}

            {step === 'processing' && (
              <Button variant="ghost" size="sm" disabled>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing…
              </Button>
            )}

            {step === 'preview' && (
              <>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="h-3.5 w-3.5 mr-1" /> Start over
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveTemplates}
                  className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  Save as Templates
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAndCreate}
                  className="gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Save &amp; Create Forms
                </Button>
              </>
            )}

            {step === 'done' && (
              <>
                <Button variant="ghost" size="sm" onClick={reset}>Import another</Button>
                <Button size="sm" onClick={handleClose}>Done</Button>
              </>
            )}

            {step === 'error' && (
              <Button variant="ghost" size="sm" onClick={handleClose}>Close</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
