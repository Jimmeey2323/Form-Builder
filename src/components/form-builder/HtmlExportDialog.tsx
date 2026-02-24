import { useState } from 'react';
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
import { generateFormHtml } from '@/utils/htmlGenerator';
import { Copy, Download, Check } from 'lucide-react';
import { toast } from 'sonner';

interface HtmlExportDialogProps {
  form: FormConfig;
  open: boolean;
  onClose: () => void;
}

export function HtmlExportDialog({ form, open, onClose }: HtmlExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const html = generateFormHtml(form);

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
          <DialogDescription>Copy or download the generated HTML form code.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={html}
          readOnly
          className="font-mono text-xs h-[400px] resize-none"
        />
        <DialogFooter>
          <Button variant="outline" onClick={copyToClipboard}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy HTML'}
          </Button>
          <Button onClick={downloadHtml}>
            <Download className="h-4 w-4 mr-2" />
            Download .html
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
