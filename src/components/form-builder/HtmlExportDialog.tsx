import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormConfig } from '@/types/formField';
import { generateFormHtml, convertImageToBase64 } from '@/utils/htmlGenerator';
import { Copy, Download, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface HtmlExportDialogProps {
  form: FormConfig;
  open: boolean;
  onClose: () => void;
}

export function HtmlExportDialog({ form, open, onClose }: HtmlExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      let logoBase64: string | undefined;
      if (form.theme.showLogo && form.theme.logoUrl) {
        try {
          logoBase64 = await convertImageToBase64(form.theme.logoUrl);
        } catch {}
      }
      setHtml(generateFormHtml(form, { logoBase64 }));
      setLoading(false);
    })();
  }, [open, form]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success('HTML copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML file downloaded!');
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Export HTML</DialogTitle>
          <DialogDescription>Copy or download the generated HTML form code. Logo is embedded as base64.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Textarea
            value={html}
            readOnly
            className="font-mono text-xs h-[400px] resize-none"
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={copyToClipboard} disabled={loading}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy HTML'}
          </Button>
          <Button onClick={downloadHtml} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Download .html
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
