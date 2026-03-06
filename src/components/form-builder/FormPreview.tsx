import { FormConfig } from '@/types/formField';
import { generateFormHtml } from '@/utils/htmlGenerator';
import { useMemo } from 'react';

interface FormPreviewProps {
  form: FormConfig;
}

export function FormPreview({ form }: FormPreviewProps) {
  const html = useMemo(() => generateFormHtml(form, { previewMode: true }), [form]);

  return (
    <div className="w-full overflow-hidden rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.16),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,245,249,0.85))] shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
      <div className="border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <div className="ml-2 min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">Live Preview</p>
            <p className="truncate text-[11px] text-muted-foreground">Matches the generated form layout, page flow, and hero treatment.</p>
          </div>
        </div>
      </div>
      <iframe
        srcDoc={html}
        title="Form Preview"
        sandbox="allow-scripts allow-forms allow-same-origin"
        style={{ width: '100%', height: 'calc(100vh - 228px)', minHeight: '720px', border: 'none', display: 'block', background: 'transparent' }}
      />
    </div>
  );
}
