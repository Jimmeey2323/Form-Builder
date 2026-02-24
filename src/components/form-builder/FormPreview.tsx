import { FormConfig } from '@/types/formField';
import { generateFormHtml } from '@/utils/htmlGenerator';
import { useMemo } from 'react';

interface FormPreviewProps {
  form: FormConfig;
}

export function FormPreview({ form }: FormPreviewProps) {
  const html = useMemo(() => generateFormHtml(form), [form]);

  return (
    <div className="w-full h-full rounded-lg border overflow-hidden bg-muted">
      <iframe
        srcDoc={html}
        className="w-full h-full min-h-[500px]"
        title="Form Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
}
