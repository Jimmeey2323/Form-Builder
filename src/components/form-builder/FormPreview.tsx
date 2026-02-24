import { FormConfig } from '@/types/formField';
import { generateFormHtml } from '@/utils/htmlGenerator';
import { useMemo } from 'react';

interface FormPreviewProps {
  form: FormConfig;
}

export function FormPreview({ form }: FormPreviewProps) {
  const html = useMemo(() => generateFormHtml(form), [form]);

  return (
    <div className="w-full rounded-xl border border-border/50 overflow-hidden shadow-sm bg-muted/20">
      <div className="h-8 bg-card border-b border-border/50 flex items-center px-3 gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 text-[11px] text-muted-foreground font-medium select-none">Form Preview</span>
      </div>
      <iframe
        srcDoc={html}
        title="Form Preview"
        sandbox="allow-scripts"
        style={{ width: '100%', height: 'calc(100vh - 240px)', minHeight: '640px', border: 'none', display: 'block' }}
      />
    </div>
  );
}
