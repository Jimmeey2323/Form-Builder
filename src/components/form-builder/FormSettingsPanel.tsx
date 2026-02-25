import { FormConfig, WebhookConfig, PixelConfig, FormAnimations, FormTheme } from '@/types/formField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ThemeSelectionDialog } from '@/components/ThemeSelectionDialog';
import { HeroImagePickerDialog } from '@/components/form-builder/HeroImagePickerDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, ExternalLink, Loader2, Sheet, Webhook, Globe, Key, Palette, Type, Layers, BarChart3, MapPin, FileText, Calendar, AlignLeft, AlignCenter, AlignRight, Sparkles, Image, Columns, Monitor, PanelLeft, PanelRight, Maximize2, ChevronRight, Settings2, Code2, Zap, Eye } from 'lucide-react';
import { applyHeroImageForLayout } from '@/utils/layoutImageHelpers';
import { useState } from 'react';

// Preset Webhook URLs
const WEBHOOK_URL_PRESETS = [
  { label: 'Momence — Bengaluru (33905)', value: 'https://api.momence.com/integrations/customer-leads/33905/collect' },
  { label: 'Momence — Custom (13752)', value: 'https://api.momence.com/integrations/customer-leads/13752/collect' },
  { label: 'Custom URL…', value: '__custom__' },
];

const TOKEN_PRESETS = [
  { label: 'qy71rOk8en (Bengaluru)', value: 'qy71rOk8en' },
  { label: 'DOjMVL37Q5 (Alt)', value: 'DOjMVL37Q5' },
  { label: 'Custom Token…', value: '__custom__' },
];

interface FormSettingsPanelProps {
  form: FormConfig;
  onUpdate: (updates: Partial<FormConfig>) => void;
  onCreateSheet?: () => void;
  isCreatingSheet?: boolean;
}

// ── Section wrapper for clean groups ──
function SettingsSection({ title, icon: Icon, children, badge, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; badge?: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary/8 text-primary shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-foreground">{title}</span>
        {badge}
        <ChevronRight className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-4 border-t border-border/30">{children}</div>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-widest block mb-1.5">{children}</Label>;
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
      <Label className="text-[13px] font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function FormSettingsPanel({ form, onUpdate, onCreateSheet, isCreatingSheet }: FormSettingsPanelProps) {
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderVal, setNewHeaderVal] = useState('');
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showHeroPicker, setShowHeroPicker] = useState(false);
  const [heroPickerInitialPage, setHeroPickerInitialPage] = useState(0);
  const [settingsTab, setSettingsTab] = useState<'content' | 'design' | 'integrations' | 'publish'>('content');
  const openHeroPicker = (page = 0) => { setHeroPickerInitialPage(page); setShowHeroPicker(true); };

  const pageCount = form.fields.filter(f => f.type === 'page-break').length + 1;
  const currentUrlPreset = WEBHOOK_URL_PRESETS.find(p => p.value === form.webhookConfig.url)?.value ?? '__custom__';
  const currentTokenPreset = TOKEN_PRESETS.find(p => p.value === form.webhookConfig.token)?.value ?? '__custom__';

  const updateTheme = (updates: Partial<FormConfig['theme']>) => onUpdate({ theme: { ...form.theme, ...updates } });
  const handleSelectTheme = (theme: FormTheme) => updateTheme(theme);
  const updateAnimations = (updates: Partial<FormAnimations>) => onUpdate({ animations: { enabled: true, ...form.animations, ...updates } });
  const updateWebhook = (updates: Partial<WebhookConfig>) => onUpdate({ webhookConfig: { ...form.webhookConfig, ...updates } });
  const updatePixels = (updates: Partial<PixelConfig>) => onUpdate({ pixelConfig: { ...form.pixelConfig, ...updates } });
  const updateUtmDefaults = (key: string, value: string) => updateWebhook({ utmParamDefaults: { ...form.webhookConfig.utmParamDefaults, [key]: value } });
  const handleLayoutChange = (layout: FormConfig['layout']) => onUpdate(applyHeroImageForLayout(form, { layout }));

  const addHeader = () => {
    if (!newHeaderKey) return;
    updateWebhook({ headers: { ...form.webhookConfig.headers, [newHeaderKey]: newHeaderVal } });
    setNewHeaderKey(''); setNewHeaderVal('');
  };
  const removeHeader = (key: string) => {
    const headers = { ...form.webhookConfig.headers }; delete headers[key]; updateWebhook({ headers });
  };

  const sheetUrl = form.googleSheetsConfig.spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${form.googleSheetsConfig.spreadsheetId}` : null;

  // Tab buttons config
  const tabs = [
    { id: 'content' as const, label: 'Content', Icon: FileText },
    { id: 'design' as const, label: 'Design', Icon: Palette },
    { id: 'integrations' as const, label: 'Connect', Icon: Zap },
    { id: 'publish' as const, label: 'Publish', Icon: Globe },
  ];

  return (
    <>
    {/* Tab Navigation - Fillout-style pill tabs */}
    <div className="flex gap-1 p-1 mb-4 rounded-xl bg-muted/50 border border-border/30">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setSettingsTab(tab.id)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all duration-150 ${
            settingsTab === tab.id
              ? 'bg-card shadow-sm text-foreground border border-border/40'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <tab.Icon className="h-3.5 w-3.5" />
          {tab.label}
        </button>
      ))}
    </div>

    <ScrollArea className="h-[calc(100vh-280px)]">
    <div className="space-y-3 pr-2">

    {/* ══════════════════ CONTENT TAB ══════════════════ */}
    {settingsTab === 'content' && (
      <div className="space-y-3">
        <SettingsSection title="General" icon={Layers}>
          <div className="space-y-1.5">
            <FieldLabel>Form Title</FieldLabel>
            <Input value={form.title} onChange={e => onUpdate({ title: e.target.value })} className="rounded-xl border-border/50 bg-muted/20 focus:bg-card" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Description</FieldLabel>
            <Textarea value={form.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={2} className="rounded-xl border-border/50 bg-muted/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Submit Button</FieldLabel>
              <Input value={form.submitButtonText} onChange={e => onUpdate({ submitButtonText: e.target.value })} className="rounded-xl border-border/50 bg-muted/20" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Success Message</FieldLabel>
              <Input value={form.successMessage} onChange={e => onUpdate({ successMessage: e.target.value })} className="rounded-xl border-border/50 bg-muted/20" />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Form Elements" icon={FileText}>
          {[
            { label: 'Sub-Header', key: 'subHeader', ph: 'e.g. Your first class is on us!', desc: 'Shown below the form title.' },
            { label: 'Venue', key: 'venue', ph: 'e.g. Kenkere House, Vittal Mallya Road', desc: 'Displayed as a venue chip.' },
            { label: 'Date & Time', key: 'dateTimeStamp', ph: 'e.g. Saturday, 1 Mar 2026 · 9:00 AM', desc: 'Free-text date label.' },
          ].map(({ label, key, ph, desc }) => (
            <div key={key} className="space-y-1.5">
              <FieldLabel>{label}</FieldLabel>
              <Input value={(form as any)[key] || ''} onChange={e => onUpdate({ [key]: e.target.value })} placeholder={ph} className="rounded-xl border-border/50 bg-muted/20" />
              <p className="text-[10px] text-muted-foreground/60">{desc}</p>
            </div>
          ))}
          <div className="space-y-1.5">
            <FieldLabel>Footer</FieldLabel>
            <Textarea value={form.footer || ''} onChange={e => onUpdate({ footer: e.target.value })} rows={2} className="rounded-xl border-border/50 bg-muted/20" placeholder="© 2026 · Terms & conditions." />
          </div>
        </SettingsSection>

        <SettingsSection title="Hero Images" icon={Image} badge={
          Object.keys(form.pageHeroImages ?? {}).filter(k => (form.pageHeroImages ?? {})[+k]).length > 0 ? (
            <Badge variant="secondary" className="text-[10px] h-5 rounded-full">{Object.keys(form.pageHeroImages ?? {}).filter(k => (form.pageHeroImages ?? {})[+k]).length} set</Badge>
          ) : undefined
        }>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Full-width banner images at the top of form pages.</p>
          {Object.entries(form.pageHeroImages ?? {}).filter(([, v]) => v).length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(form.pageHeroImages ?? {}).filter(([, v]) => v).map(([pageIdx, url]) => (
                <div key={pageIdx} className="relative rounded-xl overflow-hidden h-16 border border-border/40 group bg-muted/20">
                  <img src={url} alt={`Page ${+pageIdx + 1}`} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-foreground/20 flex items-end px-2 py-1">
                    <span className="text-[10px] font-semibold text-card">Page {+pageIdx + 1}</span>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openHeroPicker(+pageIdx)} className="p-1 rounded bg-foreground/40 hover:bg-primary text-card"><Image className="h-2.5 w-2.5" /></button>
                    <button onClick={() => { const next = { ...(form.pageHeroImages ?? {}) }; delete next[+pageIdx]; onUpdate({ pageHeroImages: next }); }} className="p-1 rounded bg-foreground/40 hover:bg-destructive text-card"><Trash2 className="h-2.5 w-2.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl" onClick={() => openHeroPicker(0)}>
            <Image className="h-3.5 w-3.5" />
            {Object.keys(form.pageHeroImages ?? {}).filter(k => (form.pageHeroImages ?? {})[+k]).length > 0 ? 'Manage Hero Images' : 'Choose Hero Images'}
          </Button>
        </SettingsSection>
      </div>
    )}

    {/* ══════════════════ DESIGN TAB ══════════════════ */}
    {settingsTab === 'design' && (
      <div className="space-y-3">
        {/* Quick Controls */}
        <SettingsSection title="Quick Controls" icon={Settings2}>
          <div className="grid gap-2 md:grid-cols-3">
            <SettingsRow label="Animations"><Switch checked={form.animations?.enabled ?? false} onCheckedChange={v => updateAnimations({ enabled: v })} /></SettingsRow>
            <SettingsRow label="Deep Shadow"><Switch checked={form.theme.formShadow === 'xl'} onCheckedChange={() => updateTheme({ formShadow: form.theme.formShadow === 'xl' ? 'md' : 'xl' })} /></SettingsRow>
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-widest">Layout</Label>
              <Select value={form.layout ?? 'classic'} onValueChange={value => handleLayoutChange(value as FormConfig['layout'])}>
                <SelectTrigger className="h-8 rounded-lg text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['classic','card','split-left','split-right','banner-top','floating','fullscreen'].map(l => (
                    <SelectItem key={l} value={l} className="text-[12px] capitalize">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsSection>

        {/* Colors & Branding */}
        <SettingsSection title="Colors & Branding" icon={Palette}>
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div>
              <p className="text-[12px] font-semibold text-foreground">Theme Gallery</p>
              <p className="text-[10px] text-muted-foreground">Apply polished color schemes</p>
            </div>
            <Button size="sm" onClick={() => setShowThemeDialog(true)} className="h-8 rounded-lg text-[11px] font-semibold gap-1.5">
              <Sparkles className="h-3 w-3" />Browse
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Primary', key: 'primaryColor' as const },
              { label: 'Secondary', key: 'secondaryColor' as const },
              { label: 'Background', key: 'backgroundColor' as const },
              { label: 'Form BG', key: 'formBackgroundColor' as const },
              { label: 'Text', key: 'textColor' as const },
              { label: 'Labels', key: 'labelColor' as const },
              { label: 'Input Border', key: 'inputBorderColor' as const },
              { label: 'Input BG', key: 'inputBackgroundColor' as const },
              { label: 'Button Text', key: 'buttonTextColor' as const },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1">
                <Label className="text-[9px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{label}</Label>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={form.theme[key]} onChange={e => updateTheme({ [key]: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                  <Input value={form.theme[key]} onChange={e => updateTheme({ [key]: e.target.value })} className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
                </div>
              </div>
            ))}
          </div>
          <SettingsRow label="Show Logo"><Switch checked={form.theme.showLogo} onCheckedChange={v => updateTheme({ showLogo: v })} /></SettingsRow>
          {form.theme.showLogo && (
            <div className="space-y-3 pl-1">
              <div className="space-y-1.5">
                <FieldLabel>Logo URL</FieldLabel>
                <Input value={form.theme.logoUrl || ''} onChange={e => updateTheme({ logoUrl: e.target.value })} placeholder="https://…" className="rounded-xl border-border/50 bg-muted/20" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Size', key: 'logoMaxWidth' as const, ph: '72px' },
                  { label: 'Top Pad', key: 'logoTopPadding' as const, ph: '16px' },
                  { label: 'Side Pad', key: 'logoSidePadding' as const, ph: '32px' },
                ].map(({ label, key, ph }) => (
                  <div key={key} className="space-y-1"><FieldLabel>{label}</FieldLabel><Input value={form.theme[key] || ph} onChange={e => updateTheme({ [key]: e.target.value })} className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" /></div>
                ))}
              </div>
            </div>
          )}
        </SettingsSection>

        {/* Dimensions */}
        <SettingsSection title="Dimensions & Spacing" icon={Columns}>
          <div className="space-y-1.5">
            <FieldLabel>Field Grid Layout</FieldLabel>
            <Select value={form.theme.formLayout || 'single'} onValueChange={v => updateTheme({ formLayout: v as any })}>
              <SelectTrigger className="rounded-xl border-border/50 bg-muted/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Column</SelectItem>
                <SelectItem value="two-column">Two Columns</SelectItem>
                <SelectItem value="three-column">Three Columns</SelectItem>
                <SelectItem value="custom">Custom Per-field</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Form Width', key: 'formWidth' as const, ph: '100%' },
              { label: 'Max Width', key: 'formMaxWidth' as const, ph: '520px' },
              { label: 'Padding', key: 'formPadding' as const, ph: '32px' },
              { label: 'Input Padding', key: 'inputPadding' as const, ph: '14px 16px' },
              { label: 'Radius', key: 'borderRadius' as const, ph: '12px' },
              { label: 'Field Gap', key: 'fieldGap' as const, ph: '16px' },
              { label: 'Line Height', key: 'lineHeight' as const, ph: '1.6' },
            ].map(({ label, key, ph }) => (
              <div key={key} className="space-y-1"><FieldLabel>{label}</FieldLabel><Input value={form.theme[key]} onChange={e => updateTheme({ [key]: e.target.value })} placeholder={ph} className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" /></div>
            ))}
            <div className="space-y-1">
              <FieldLabel>Shadow</FieldLabel>
              <Select value={form.theme.formShadow} onValueChange={v => updateTheme({ formShadow: v as any })}>
                <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['none','sm','md','lg','xl','2xl'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsSection>

        {/* Typography */}
        <SettingsSection title="Typography" icon={Type}>
          <div className="space-y-1.5">
            <FieldLabel>Font Family</FieldLabel>
            <Input value={form.theme.fontFamily} onChange={e => updateTheme({ fontFamily: e.target.value })} className="font-mono text-[12px] rounded-xl border-border/50 bg-muted/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><FieldLabel>Label Size</FieldLabel><Input value={form.theme.labelFontSize} onChange={e => updateTheme({ labelFontSize: e.target.value })} className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" /></div>
            <div className="space-y-1"><FieldLabel>Input Size</FieldLabel><Input value={form.theme.inputFontSize} onChange={e => updateTheme({ inputFontSize: e.target.value })} className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><FieldLabel>Header Size</FieldLabel><Input value={form.theme.headerFontSize || '22px'} onChange={e => updateTheme({ headerFontSize: e.target.value })} className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" /></div>
            <div className="space-y-1">
              <FieldLabel>Weight</FieldLabel>
              <Select value={form.theme.headerFontWeight || '700'} onValueChange={v => updateTheme({ headerFontWeight: v })}>
                <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>{['300','400','500','600','700','800','900'].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <FieldLabel>Style</FieldLabel>
              <Select value={form.theme.headerFontStyle || 'normal'} onValueChange={v => updateTheme({ headerFontStyle: v as any })}>
                <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="italic">Italic</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          {/* Alignments */}
          <div className="space-y-1.5">
            <FieldLabel>Header Alignment</FieldLabel>
            <div className="flex gap-1">
              {(['left','center','right'] as const).map(a => (
                <button key={a} onClick={() => updateTheme({ headerAlign: a })}
                  className={`flex-1 h-8 rounded-lg border-2 flex items-center justify-center transition-all text-[11px] ${(form.theme.headerAlign ?? 'center') === a ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:border-primary/30'}`}
                >
                  {a === 'left' && <AlignLeft className="h-3.5 w-3.5" />}{a === 'center' && <AlignCenter className="h-3.5 w-3.5" />}{a === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Label Alignment</FieldLabel>
            <div className="flex gap-1">
              {(['left','center','right'] as const).map(a => (
                <button key={a} onClick={() => updateTheme({ labelAlign: a })}
                  className={`flex-1 h-8 rounded-lg border-2 flex items-center justify-center transition-all text-[11px] ${(form.theme.labelAlign ?? 'left') === a ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:border-primary/30'}`}
                >
                  {a === 'left' && <AlignLeft className="h-3.5 w-3.5" />}{a === 'center' && <AlignCenter className="h-3.5 w-3.5" />}{a === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Form Layout */}
        <SettingsSection title="Page Layout" icon={Monitor} badge={<Badge variant="secondary" className="text-[10px] h-5 rounded-full capitalize">{form.layout ?? 'classic'}</Badge>}>
          <div className="grid grid-cols-4 gap-2">
            {([
              { value: 'classic', label: 'Classic' },
              { value: 'card', label: 'Card' },
              { value: 'split-left', label: 'Split L' },
              { value: 'split-right', label: 'Split R' },
              { value: 'banner-top', label: 'Banner' },
              { value: 'floating', label: 'Float' },
              { value: 'fullscreen', label: 'Full' },
            ] as const).map(opt => (
              <button key={opt.value} onClick={() => handleLayoutChange(opt.value as FormConfig['layout'])}
                className={`py-2 rounded-xl border-2 text-[10px] font-semibold transition-all ${(form.layout ?? 'classic') === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:border-primary/30'}`}
              >{opt.label}</button>
            ))}
          </div>

          {['split-left','split-right','banner-top','floating'].includes(form.layout ?? '') && (
            <>
              <div className="space-y-2">
                <FieldLabel>Panel Split</FieldLabel>
                <Slider value={[form.layoutImagePanelWidth ?? 45]} min={15} max={80} step={1} onValueChange={([v]) => onUpdate({ layoutImagePanelWidth: v })} />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>Form {100 - (form.layoutImagePanelWidth ?? 45)}%</span><span>Image {form.layoutImagePanelWidth ?? 45}%</span></div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Image URL</FieldLabel>
                <Input value={form.layoutImageUrl || ''} onChange={e => onUpdate({ layoutImageUrl: e.target.value })} placeholder="https://images.unsplash.com/…" className="rounded-xl border-border/50 bg-muted/20 text-[12px]" />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Image Fit</FieldLabel>
                <Select value={form.layoutImageFit || 'cover'} onValueChange={v => onUpdate({ layoutImageFit: v as any })}>
                  <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['cover','contain','fill','natural','zoom-in','zoom-out','tile'].map(f => <SelectItem key={f} value={f} className="text-[12px]">{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Image Position</FieldLabel>
                <div className="grid grid-cols-3 gap-1">
                  {([
                    { x:'0',y:'0',t:'↖' },{ x:'50',y:'0',t:'↑' },{ x:'100',y:'0',t:'↗' },
                    { x:'0',y:'50',t:'←' },{ x:'50',y:'50',t:'•' },{ x:'100',y:'50',t:'→' },
                    { x:'0',y:'100',t:'↙' },{ x:'50',y:'100',t:'↓' },{ x:'100',y:'100',t:'↘' },
                  ]).map(pos => {
                    const active = (form.layoutImagePositionX ?? '50') === pos.x && (form.layoutImagePositionY ?? '50') === pos.y;
                    return <button key={`${pos.x}-${pos.y}`} onClick={() => onUpdate({ layoutImagePositionX: pos.x, layoutImagePositionY: pos.y })}
                      className={`h-7 rounded-md text-[12px] transition-all ${active ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'}`}
                    >{pos.t}</button>;
                  })}
                </div>
              </div>
            </>
          )}
        </SettingsSection>

        {/* Animations */}
        <SettingsSection title="Animations" icon={Sparkles} defaultOpen={false}>
          <SettingsRow label="Enable Animations"><Switch checked={form.animations?.enabled ?? false} onCheckedChange={v => updateAnimations({ enabled: v })} /></SettingsRow>
          {form.animations?.enabled && (
            <div className="space-y-3">
              {([
                { label: 'Logo', key: 'logo', options: ['none','fadeIn','zoomIn','spinIn','floatIn','glowPulse','revealClip'] },
                { label: 'Title', key: 'title', options: ['none','fadeIn','slideDown','bounceIn','typewriter','splitReveal','glitchIn','perspectiveFlip'] },
                { label: 'Header', key: 'header', options: ['none','fadeIn','slideDown','expandIn','blurIn'] },
                { label: 'Fields', key: 'fields', options: ['none','fadeIn','slideUp','stagger','cascadeIn','flipIn','springIn'] },
                { label: 'Footer', key: 'footer', options: ['none','fadeIn','slideUp','expandIn'] },
              ] as const).map(({ label, key, options }) => (
                <div key={key} className="space-y-1">
                  <FieldLabel>{label}</FieldLabel>
                  <Select value={(form.animations as any)?.[key] || 'none'} onValueChange={v => updateAnimations({ [key]: v } as any)}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{options.map(o => <SelectItem key={o} value={o} className="text-[12px]">{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-1">
                <FieldLabel>Easing</FieldLabel>
                <Select value={form.animations?.easing || 'spring'} onValueChange={v => updateAnimations({ easing: v as any })}>
                  <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{['ease','ease-out','ease-in-out','spring','bounce'].map(e => <SelectItem key={e} value={e} className="text-[12px]">{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><FieldLabel>Duration</FieldLabel><span className="text-[11px] font-mono text-primary">{form.animations?.duration ?? 500}ms</span></div>
                <Slider min={150} max={1500} step={50} value={[form.animations?.duration ?? 500]} onValueChange={([v]) => updateAnimations({ duration: v })} />
              </div>
              {form.animations?.fields === 'stagger' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between"><FieldLabel>Stagger Delay</FieldLabel><span className="text-[11px] font-mono text-primary">{form.animations?.staggerDelay ?? 80}ms</span></div>
                  <Slider min={20} max={400} step={20} value={[form.animations?.staggerDelay ?? 80]} onValueChange={([v]) => updateAnimations({ staggerDelay: v })} />
                </div>
              )}
            </div>
          )}
        </SettingsSection>
      </div>
    )}

    {/* ══════════════════ INTEGRATIONS TAB ══════════════════ */}
    {settingsTab === 'integrations' && (
      <div className="space-y-3">
        <SettingsSection title="Webhook" icon={Webhook} badge={
          <Badge variant={form.webhookConfig.enabled ? 'default' : 'secondary'} className="text-[10px] h-5 rounded-full">{form.webhookConfig.enabled ? 'Active' : 'Off'}</Badge>
        }>
          <SettingsRow label="Enable Webhook"><Switch checked={form.webhookConfig.enabled} onCheckedChange={v => updateWebhook({ enabled: v })} /></SettingsRow>
          {form.webhookConfig.enabled && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Endpoint</FieldLabel>
                <Select value={currentUrlPreset} onValueChange={v => { if (v !== '__custom__') updateWebhook({ url: v }); else updateWebhook({ url: '' }); }}>
                  <SelectTrigger className="rounded-xl border-border/50 bg-muted/20"><SelectValue placeholder="Select endpoint…" /></SelectTrigger>
                  <SelectContent>{WEBHOOK_URL_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
                {currentUrlPreset === '__custom__' && <Input value={form.webhookConfig.url} onChange={e => updateWebhook({ url: e.target.value })} placeholder="https://…" className="mt-2 rounded-xl border-border/50 bg-muted/20" />}
                {currentUrlPreset !== '__custom__' && <p className="text-[10px] text-muted-foreground font-mono truncate px-1">{form.webhookConfig.url}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <FieldLabel>Method</FieldLabel>
                  <Select value={form.webhookConfig.method} onValueChange={v => updateWebhook({ method: v as any })}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="POST">POST</SelectItem><SelectItem value="PUT">PUT</SelectItem><SelectItem value="PATCH">PATCH</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <FieldLabel>Auth Token</FieldLabel>
                  <Select value={currentTokenPreset} onValueChange={v => { if (v !== '__custom__') updateWebhook({ token: v, headers: { ...form.webhookConfig.headers, Authorization: `Bearer ${v}` } }); else updateWebhook({ token: '' }); }}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{TOKEN_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                  {currentTokenPreset === '__custom__' && <Input value={form.webhookConfig.token || ''} onChange={e => updateWebhook({ token: e.target.value, headers: { ...form.webhookConfig.headers, Authorization: `Bearer ${e.target.value}` } })} placeholder="Token" className="mt-1 rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" />}
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Source ID</FieldLabel>
                <Input value={form.webhookConfig.sourceId || ''} onChange={e => updateWebhook({ sourceId: e.target.value })} className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Redirect URL</FieldLabel>
                <Input value={form.webhookConfig.redirectUrl || ''} onChange={e => updateWebhook({ redirectUrl: e.target.value })} placeholder="https://…" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" />
              </div>
              <SettingsRow label="Capture UTM Params"><Switch checked={form.webhookConfig.includeUtmParams} onCheckedChange={v => updateWebhook({ includeUtmParams: v })} /></SettingsRow>
              <div className="space-y-2">
                <FieldLabel>Custom Headers</FieldLabel>
                {Object.entries(form.webhookConfig.headers).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 text-[11px] rounded-lg border border-border/40 bg-muted/10 px-3 py-1.5">
                    <code className="font-semibold text-primary flex-1 truncate">{key}</code>
                    <code className="text-muted-foreground flex-1 truncate">{val}</code>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive shrink-0" onClick={() => removeHeader(key)}><Trash2 className="h-2.5 w-2.5" /></Button>
                  </div>
                ))}
                <div className="flex gap-1.5">
                  <Input value={newHeaderKey} onChange={e => setNewHeaderKey(e.target.value)} placeholder="Key" className="flex-1 rounded-lg border-border/40 bg-muted/20 h-7 text-[11px]" />
                  <Input value={newHeaderVal} onChange={e => setNewHeaderVal(e.target.value)} placeholder="Value" className="flex-1 rounded-lg border-border/40 bg-muted/20 h-7 text-[11px]" />
                  <Button variant="outline" size="icon" className="h-7 w-7 shrink-0 rounded-lg" onClick={addHeader}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          )}
        </SettingsSection>

        <SettingsSection title="UTM Parameters" icon={MapPin} defaultOpen={false}>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Default UTM values sent with every submission.</p>
          {['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].map(key => (
            <div key={key} className="space-y-1">
              <FieldLabel>{key}</FieldLabel>
              <Input value={(form.webhookConfig.utmParamDefaults as any)?.[key] || ''} onChange={e => updateUtmDefaults(key, e.target.value)} className="font-mono rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" />
            </div>
          ))}
        </SettingsSection>

        <SettingsSection title="Tracking Pixels" icon={BarChart3} defaultOpen={false}>
          {[
            { label: 'Snap Pixel ID', key: 'snapPixelId' as const },
            { label: 'Meta Pixel ID', key: 'metaPixelId' as const },
            { label: 'Google Ads ID', key: 'googleAdsId' as const },
            { label: 'Conversion Label', key: 'googleAdsConversionLabel' as const },
          ].map(({ label, key }) => (
            <div key={key} className="space-y-1"><FieldLabel>{label}</FieldLabel><Input value={form.pixelConfig[key] || ''} onChange={e => updatePixels({ [key]: e.target.value })} className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]" /></div>
          ))}
          <div className="space-y-1"><FieldLabel>Custom Scripts</FieldLabel><Textarea value={form.pixelConfig.customScripts || ''} onChange={e => updatePixels({ customScripts: e.target.value })} rows={3} className="font-mono text-[11px] rounded-xl border-border/40 bg-muted/20" /></div>
        </SettingsSection>

        <SettingsSection title="Google Sheets" icon={Sheet} badge={
          <Badge variant={form.googleSheetsConfig.enabled ? 'default' : 'secondary'} className="text-[10px] h-5 rounded-full">{form.googleSheetsConfig.spreadsheetId ? 'Connected' : form.googleSheetsConfig.enabled ? 'Pending' : 'Off'}</Badge>
        }>
          <SettingsRow label="Record to Sheets"><Switch checked={form.googleSheetsConfig.enabled} onCheckedChange={v => onUpdate({ googleSheetsConfig: { ...form.googleSheetsConfig, enabled: v } })} /></SettingsRow>
          {form.googleSheetsConfig.enabled && (
            sheetUrl ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sheet className="h-4 w-4 text-primary" />
                  <span className="text-[12px] font-semibold text-foreground">Connected</span>
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-primary">● Live</span>
                </div>
                <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-primary hover:underline flex items-center gap-1">Open Sheet <ExternalLink className="h-3 w-3" /></a>
              </div>
            ) : (
              <Button onClick={onCreateSheet} disabled={isCreatingSheet} className="w-full rounded-xl gap-2">
                {isCreatingSheet ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sheet className="h-4 w-4" />}
                {isCreatingSheet ? 'Creating…' : 'Create Spreadsheet & Connect'}
              </Button>
            )
          )}
        </SettingsSection>
      </div>
    )}

    {/* ══════════════════ PUBLISH TAB ══════════════════ */}
    {settingsTab === 'publish' && (
      <div className="space-y-3">
        <SettingsSection title="Deployment" icon={Globe}>
          <div className="space-y-1.5">
            <FieldLabel>Vercel Project Domain</FieldLabel>
            <p className="text-[10px] text-muted-foreground">Enter existing domain to deploy there instead of creating new.</p>
            <Input value={form.vercelProjectDomain || ''} onChange={e => onUpdate({ vercelProjectDomain: e.target.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') })} placeholder="mysite.vercel.app" className="font-mono rounded-xl border-border/50 bg-muted/20 text-[12px]" />
          </div>
          {form.deployedUrl && (
            <div className="space-y-1.5">
              <FieldLabel>Live URL</FieldLabel>
              <a href={form.deployedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-primary underline underline-offset-2 break-all"><ExternalLink className="h-3 w-3 shrink-0" />{form.deployedUrl}</a>
            </div>
          )}
        </SettingsSection>

        <SettingsSection title="Custom CSS" icon={Code2} defaultOpen={false}>
          <Textarea value={form.theme.customCss || ''} onChange={e => updateTheme({ customCss: e.target.value })} rows={6} placeholder=".form-container { /* your styles */ }" className="font-mono text-[11px] rounded-xl border-border/40 bg-muted/20" />
        </SettingsSection>
      </div>
    )}

    </div>
    </ScrollArea>

    <ThemeSelectionDialog open={showThemeDialog} onClose={() => setShowThemeDialog(false)} onSelectTheme={handleSelectTheme} currentTheme={form.theme} />
    <HeroImagePickerDialog open={showHeroPicker} onOpenChange={setShowHeroPicker} initialPage={heroPickerInitialPage} pageCount={pageCount} pageHeroImages={form.pageHeroImages ?? {}} onSave={(updated) => onUpdate({ pageHeroImages: updated })} />
    </>
  );
}
