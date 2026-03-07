import { FormConfig } from '@/types/formField';
import { generateFormHtml } from '@/utils/htmlGenerator';
import { useMemo, useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

interface FormPreviewProps {
  form: FormConfig;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_CONFIG: Record<DeviceMode, { label: string; icon: React.ReactNode; maxWidth: string; frameClass: string }> = {
  desktop: {
    label: 'Desktop',
    icon: <Monitor className="h-3.5 w-3.5" />,
    maxWidth: '100%',
    frameClass: '',
  },
  tablet: {
    label: 'Tablet',
    icon: <Tablet className="h-3.5 w-3.5" />,
    maxWidth: '768px',
    frameClass: 'rounded-2xl shadow-[0_8px_40px_rgba(15,23,42,0.16)]',
  },
  mobile: {
    label: 'Mobile',
    icon: <Smartphone className="h-3.5 w-3.5" />,
    maxWidth: '390px',
    frameClass: 'rounded-3xl shadow-[0_8px_40px_rgba(15,23,42,0.18)]',
  },
};

export function FormPreview({ form }: FormPreviewProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const html = useMemo(() => generateFormHtml(form, { previewMode: true }), [form]);

  const pageCount = useMemo(
    () => form.fields.filter(f => f.type === 'page-break').length + 1,
    [form.fields],
  );
  const fieldCount = useMemo(
    () => form.fields.filter(f => f.type !== 'page-break' && f.type !== 'section-break').length,
    [form.fields],
  );

  const deviceCfg = DEVICE_CONFIG[device];

  return (
    <div className="h-[calc(100vh-168px)] flex flex-col overflow-hidden rounded-xl border border-border/60 bg-slate-50/60 shadow-sm">
      {/* ── Chrome bar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-white/90 backdrop-blur">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200/70 px-3 py-1.5 min-w-0">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" title="Live preview" />
          <span className="text-[11px] font-medium text-slate-500 truncate">{form.title || 'Untitled form'}</span>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono shrink-0">
          <span>{fieldCount} field{fieldCount !== 1 ? 's' : ''}</span>
          {pageCount > 1 && (
            <>
              <span className="text-border">·</span>
              <span>{pageCount} pages</span>
            </>
          )}
        </div>

        {/* Device toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shrink-0">
          {(Object.keys(DEVICE_CONFIG) as DeviceMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setDevice(mode)}
              title={DEVICE_CONFIG[mode].label}
              className={`flex items-center justify-center h-6 w-7 rounded-md transition-all ${
                device === mode
                  ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/80'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {DEVICE_CONFIG[mode].icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Preview area ────────────────────────────────────────────────────── */}
      <div className={`flex-1 overflow-auto flex ${device === 'desktop' ? 'items-stretch' : 'items-start justify-center py-6'}`}>
        <div
          className={`transition-all duration-300 ${device === 'desktop' ? 'w-full h-full' : `overflow-hidden border border-slate-200 bg-white ${deviceCfg.frameClass}`}`}
          style={device === 'desktop' ? undefined : { width: deviceCfg.maxWidth, maxWidth: '100%', minHeight: '600px' }}
        >
          {/* Mobile notch bar */}
          {device === 'mobile' && (
            <div className="flex items-center justify-center py-2.5 border-b border-slate-100">
              <div className="h-1.5 w-12 rounded-full bg-slate-300" />
            </div>
          )}
          <iframe
            srcDoc={html}
            title="Form Preview"
            sandbox="allow-scripts allow-forms allow-same-origin"
            style={{
              width: '100%',
              height: device === 'desktop' ? '100%' : '680px',
              minHeight: device === 'desktop' ? '600px' : undefined,
              border: 'none',
              display: 'block',
              background: 'transparent',
            }}
          />
        </div>
      </div>
    </div>
  );
}
