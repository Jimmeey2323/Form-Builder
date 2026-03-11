import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FormField } from '@/types/formField';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-100 text-blue-700',
  textarea: 'bg-yellow-100 text-yellow-700',
  email: 'bg-purple-100 text-purple-700',
  tel: 'bg-green-100 text-green-700',
  select: 'bg-cyan-100 text-cyan-700',
  radio: 'bg-pink-100 text-pink-700',
  checkbox: 'bg-teal-100 text-teal-700',
  checkboxes: 'bg-teal-100 text-teal-700',
  'section-break': 'bg-slate-100 text-slate-700',
  'page-break': 'bg-indigo-100 text-indigo-700',
  rating: 'bg-amber-100 text-amber-700',
  range: 'bg-orange-100 text-orange-700',
};

export interface ImportedFilloutForm {
  source: 'fillout';
  sourceUrl: string;
  formId: string;
  title: string;
  description: string;
  submitButtonText: string;
  pageCount: number;
  sectionCount: number;
  themeHints?: {
    formLayout?: 'single' | 'custom';
  };
  fields: FormField[];
}

interface FilloutImportDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateForm: (payload: ImportedFilloutForm) => void;
}

export function FilloutImportDialog({ open, onClose, onCreateForm }: FilloutImportDialogProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<ImportedFilloutForm | null>(null);

  const resetState = () => {
    setUrl('');
    setLoading(false);
    setError(null);
    setImported(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleImport = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a Fillout form URL.');
      return;
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError('Please enter a full URL starting with http:// or https://.');
      return;
    }

    setLoading(true);
    setError(null);
    setImported(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('import-fillout-form', {
        body: { url: trimmedUrl },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.form?.fields || !Array.isArray(data.form.fields) || data.form.fields.length === 0) {
        throw new Error('No fields were detected in this Fillout form.');
      }
      setImported(data.form as ImportedFilloutForm);
      toast.success('Fillout form imported. Review and create your JForm.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to import this Fillout URL.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const visibleFields = useMemo(() => imported?.fields.slice(0, 18) ?? [], [imported]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-sky-700 flex items-center justify-center">
              <Upload className="h-4 w-4 text-white" />
            </div>
            Import Fillout Form
          </DialogTitle>
          <DialogDescription>
            Paste a Fillout form URL. JForms will recreate pages, sections, and fields automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fillout URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://forms.fillout.com/t/your-form-id"
                  className="pl-9"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !loading) {
                      e.preventDefault();
                      handleImport();
                    }
                  }}
                />
              </div>
              <Button onClick={handleImport} disabled={loading} className="bg-gradient-to-r from-cyan-600 to-sky-700 hover:opacity-90">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {imported && (
            <div className="space-y-3">
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-green-800 truncate">{imported.title}</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {imported.pageCount} page{imported.pageCount !== 1 ? 's' : ''} · {imported.sectionCount} section{imported.sectionCount !== 1 ? 's' : ''} · {imported.fields.length} field{imported.fields.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Parsed Structure Preview
                </div>
                <div className="p-3 space-y-1 max-h-[320px] overflow-y-auto">
                  {visibleFields.map((field, idx) => (
                    <div key={`${field.id}_${idx}`} className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[field.type] ?? 'bg-muted text-muted-foreground'}`}>
                        {field.type}
                      </span>
                      <span className="font-medium text-foreground truncate">{field.label}</span>
                      {field.isRequired && (
                        <Badge variant="outline" className="ml-auto text-[10px] text-rose-600 border-rose-300 bg-rose-50">
                          required
                        </Badge>
                      )}
                    </div>
                  ))}
                  {imported.fields.length > visibleFields.length && (
                    <p className="text-[11px] text-muted-foreground px-1 pt-1">
                      +{imported.fields.length - visibleFields.length} more fields
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-muted-foreground">
            Import currently supports Fillout URLs first. More platforms can be added next.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
            <Button
              size="sm"
              disabled={!imported}
              onClick={() => {
                if (!imported) return;
                onCreateForm(imported);
                handleClose();
              }}
              className="bg-gradient-to-r from-cyan-600 to-sky-700 hover:opacity-90"
            >
              Create Form
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
