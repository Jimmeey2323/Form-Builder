import { FormConfig, WebhookConfig, PixelConfig, FormAnimations, FormTheme, EmailNotificationConfig } from '@/types/formField';
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
import { Plus, Trash2, ExternalLink, Loader2, Sheet, Webhook, Globe, Key, Palette, Type, Layers, BarChart3, MapPin, FileText, Calendar, AlignLeft, AlignCenter, AlignRight, Sparkles, Image, Columns, Monitor, PanelLeft, PanelRight, Maximize2, ChevronRight, Settings2, Code2, Zap, Eye, Mail, Upload } from 'lucide-react';
import { applyHeroImageForLayout } from '@/utils/layoutImageHelpers';
import { getHeroImageUrl, hasHeroImage, normalizeHeroImageValue } from '@/utils/heroImageConfig';
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

const defaultEmailConfig: import('@/types/formField').EmailNotificationConfig = {
  enabled: false,
  mailtrapToken: '',
  clientId: '',
  clientSecret: '',
  refreshToken: '',
  from: '',
  fromName: '',
  to: '',
  cc: '',
  bcc: '',
  subject: 'New Form Submission — {{formTitle}}',
};

interface FormSettingsPanelProps {
  form: FormConfig;
  onUpdate: (updates: Partial<FormConfig>) => void;
  onCreateSheet?: () => void;
  isCreatingSheet?: boolean;
  onUpdateSheetStructure?: () => void;
}

// ── Section wrapper for clean groups ──
function SettingsSection({ title, icon: Icon, children, badge, defaultOpen = true }: {
  title: React.ReactNode; // Updated to accept JSX
  icon: any;
  children: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="premium-surface soft-elevate rounded-2xl overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/35 transition-colors"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary/10 text-primary shrink-0 ring-1 ring-primary/20">
          <Icon className="h-4 w-4" />
        </div>
        <span className="flex-1 text-[13px] font-semibold text-foreground">{title}</span>
        {badge}
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-border/45 bg-white/35">{children}</div>
      )}
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

export function FormSettingsPanel({ form, onUpdate, onCreateSheet, isCreatingSheet, onUpdateSheetStructure }: FormSettingsPanelProps) {
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderVal, setNewHeaderVal] = useState('');
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showHeroPicker, setShowHeroPicker] = useState(false);
  const [heroPickerInitialPage, setHeroPickerInitialPage] = useState(0);
  const [settingsTab, setSettingsTab] = useState<'content' | 'design' | 'integrations' | 'publish'>('content');
  const [activeButtonPanel, setActiveButtonPanel] = useState<'shared' | 'submit' | 'next' | 'back'>('submit');
  const openHeroPicker = (page = 0) => { setHeroPickerInitialPage(page); setShowHeroPicker(true); };

  const pageCount = form.fields.filter(f => f.type === 'page-break').length + 1;
  const heroEntries = Object.entries(form.pageHeroImages ?? {}).filter(([, value]) => hasHeroImage(value));
  const heroCount = heroEntries.length;
  const currentUrlPreset = WEBHOOK_URL_PRESETS.find(p => p.value === form.webhookConfig.url)?.value ?? '__custom__';
  const currentTokenPreset = TOKEN_PRESETS.find(p => p.value === form.webhookConfig.token)?.value ?? '__custom__';

  const updateTheme = (updates: Partial<FormConfig['theme']>) => onUpdate({ theme: { ...form.theme, ...updates } });
  const handleSelectTheme = (theme: FormTheme) => updateTheme(theme);
  const updateAnimations = (updates: Partial<FormAnimations>) => onUpdate({ animations: { enabled: true, ...form.animations, ...updates } });
  const updateWebhook = (updates: Partial<WebhookConfig>) => onUpdate({ webhookConfig: { ...form.webhookConfig, ...updates } });
  const updatePixels = (updates: Partial<PixelConfig>) => onUpdate({ pixelConfig: { ...form.pixelConfig, ...updates } });
  const updateEmail = (updates: Partial<EmailNotificationConfig>) => onUpdate({ emailNotificationConfig: { ...defaultEmailConfig, ...form.emailNotificationConfig, ...updates } });
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
    <div className="premium-tabs flex gap-1 p-1 mb-4 rounded-xl">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setSettingsTab(tab.id)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all duration-150 ${
            settingsTab === tab.id
              ? 'bg-white shadow-sm text-foreground border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/55'
          }`}
        >
          <tab.Icon className="h-3.5 w-3.5" />
          {tab.label}
        </button>
      ))}
    </div>

    <ScrollArea className="h-[calc(100vh-300px)] md:h-[calc(100vh-280px)]">
    <div className="space-y-3 pr-2 pb-3">

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
          <div className="space-y-1.5">
            <FieldLabel>Redirect URL after submission</FieldLabel>
            <Input
              value={form.webhookConfig?.redirectUrl || ''}
              onChange={e => onUpdate({ webhookConfig: { ...form.webhookConfig, redirectUrl: e.target.value } })}
              placeholder="https://example.com/thank-you"
              className="rounded-xl border-border/50 bg-muted/20"
            />
            <p className="text-[10px] text-muted-foreground/60">Leave blank to show the success message in-place.</p>
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
          heroCount > 0 ? (
            <Badge variant="secondary" className="text-[10px] h-5 rounded-full">{heroCount} set</Badge>
          ) : undefined
        }>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Full-width banner images at the top of form pages.</p>
          {heroEntries.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {heroEntries.map(([pageIdx, value]) => {
                const hero = normalizeHeroImageValue(value);
                const url = getHeroImageUrl(value);
                if (!url) return null;
                return (
                <div key={pageIdx} className="relative rounded-xl overflow-hidden h-28 border border-border/40 group bg-muted/20">
                  <img
                    src={url}
                    alt={`Page ${+pageIdx + 1}`}
                    className="w-full h-full"
                    style={{
                      objectFit: 'cover',
                      objectPosition: `${hero?.cropX ?? 50}% ${hero?.cropY ?? 50}%`,
                    }}
                  />
                  <div className="absolute inset-0 bg-foreground/20 flex items-end px-2 py-1">
                    <span className="text-[10px] font-semibold text-card">
                      Page {+pageIdx + 1}
                      {hero ? ` · ${Math.round(hero.height)}px` : ''}
                    </span>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openHeroPicker(+pageIdx)} className="p-1 rounded bg-foreground/40 hover:bg-primary text-card"><Image className="h-2.5 w-2.5" /></button>
                    <button onClick={() => { const next = { ...(form.pageHeroImages ?? {}) }; delete next[+pageIdx]; onUpdate({ pageHeroImages: next }); }} className="p-1 rounded bg-foreground/40 hover:bg-destructive text-card"><Trash2 className="h-2.5 w-2.5" /></button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl" onClick={() => openHeroPicker(0)}>
            <Image className="h-3.5 w-3.5" />
            {heroCount > 0 ? 'Manage Hero Images' : 'Choose Hero Images'}
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
                  {['classic','card','split-left','split-right','editorial-left','editorial-right','banner-top','showcase-banner','floating','fullscreen'].map(l => (
                    <SelectItem key={l} value={l} className="text-[12px] capitalize">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Form Frame" icon={Maximize2}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Form Max Width</FieldLabel>
              <Input
                value={form.theme.formMaxWidth || '520px'}
                onChange={e => updateTheme({ formMaxWidth: e.target.value })}
                placeholder="520px or 100%"
                className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Form Min Height</FieldLabel>
              <Input
                value={form.theme.formMinHeight || '620px'}
                onChange={e => updateTheme({ formMinHeight: e.target.value })}
                placeholder="620px"
                className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Padding</FieldLabel>
              <Input
                value={form.theme.formPadding || '32px'}
                onChange={e => updateTheme({ formPadding: e.target.value })}
                placeholder="32px"
                className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Field Gap</FieldLabel>
              <Input
                value={form.theme.fieldGap || '16px'}
                onChange={e => updateTheme({ fieldGap: e.target.value })}
                placeholder="16px"
                className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Border Radius</FieldLabel>
              <Input
                value={form.theme.borderRadius || '12px'}
                onChange={e => updateTheme({ borderRadius: e.target.value })}
                placeholder="12px"
                className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Border Width</FieldLabel>
              <Input
                value={form.theme.formBorderWidth || '1px'}
                onChange={e => updateTheme({ formBorderWidth: e.target.value })}
                placeholder="1px"
                className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Form Border Color</FieldLabel>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={form.theme.formBorderColor || form.theme.inputBorderColor}
                  onChange={e => updateTheme({ formBorderColor: e.target.value })}
                  className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0"
                />
                <Input
                  value={form.theme.formBorderColor || form.theme.inputBorderColor}
                  onChange={e => updateTheme({ formBorderColor: e.target.value })}
                  className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Shadow</FieldLabel>
              <Select
                value={form.theme.formShadow || 'xl'}
                onValueChange={v => updateTheme({ formShadow: v as FormConfig['theme']['formShadow'] })}
              >
                <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['none', 'sm', 'md', 'lg', 'xl', '2xl'].map(v => (
                    <SelectItem key={v} value={v} className="text-[12px]">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Glassmorphism */}
          <div className="space-y-2 rounded-lg border border-blue-200/40 bg-blue-50/20 p-3">
            <div className="flex items-center justify-between">
              <FieldLabel>Glassmorphism</FieldLabel>
              <Switch checked={form.theme.formCardGlassmorphism ?? false} onCheckedChange={v => updateTheme({ formCardGlassmorphism: v })} />
            </div>
            {form.theme.formCardGlassmorphism && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Blur Amount</span>
                  <span className="font-mono">{form.theme.formCardBlurAmount || '20px'}</span>
                </div>
                <input type="range" min={0} max={40} step={1}
                  value={parseInt(form.theme.formCardBlurAmount || '20')}
                  onChange={e => updateTheme({ formCardBlurAmount: `${e.target.value}px` })}
                  className="w-full accent-primary" />
                <p className="text-[10px] text-muted-foreground/60">Works best with a vivid gradient or image page background.</p>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Inputs & Fields */}
        <SettingsSection title="Inputs & Fields" icon={Eye} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Input Height</FieldLabel>
              <Input value={form.theme.inputHeight || ''} onChange={e => updateTheme({ inputHeight: e.target.value })} placeholder="44px (auto)" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Input Text Color</FieldLabel>
              <div className="flex items-center gap-1.5">
                <input type="color" value={form.theme.inputTextColor || form.theme.textColor} onChange={e => updateTheme({ inputTextColor: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                <Input value={form.theme.inputTextColor || ''} onChange={e => updateTheme({ inputTextColor: e.target.value })} placeholder="Inherits text color" className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Placeholder Color</FieldLabel>
              <div className="flex items-center gap-1.5">
                <input type="color" value={form.theme.placeholderColor || '#94a3b8'} onChange={e => updateTheme({ placeholderColor: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                <Input value={form.theme.placeholderColor || ''} onChange={e => updateTheme({ placeholderColor: e.target.value })} placeholder="#94a3b8" className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Hover Border</FieldLabel>
              <div className="flex items-center gap-1.5">
                <input type="color" value={form.theme.inputHoverBorderColor || form.theme.primaryColor} onChange={e => updateTheme({ inputHoverBorderColor: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                <Input value={form.theme.inputHoverBorderColor || ''} onChange={e => updateTheme({ inputHoverBorderColor: e.target.value })} placeholder="Primary color" className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Focus Border</FieldLabel>
              <div className="flex items-center gap-1.5">
                <input type="color" value={form.theme.inputFocusBorderColor || form.theme.primaryColor} onChange={e => updateTheme({ inputFocusBorderColor: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                <Input value={form.theme.inputFocusBorderColor || ''} onChange={e => updateTheme({ inputFocusBorderColor: e.target.value })} placeholder="Primary color" className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Focus Glow</FieldLabel>
              <div className="flex items-center gap-1.5">
                <input type="color" value={form.theme.inputFocusGlowColor || form.theme.primaryColor} onChange={e => updateTheme({ inputFocusGlowColor: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                <Input value={form.theme.inputFocusGlowColor || ''} onChange={e => updateTheme({ inputFocusGlowColor: e.target.value })} placeholder="Primary + 20% opacity" className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Buttons */}
        <SettingsSection title="Buttons" icon={Zap}>
          {/* ── Tab strip ── */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted/30">
            {(['shared', 'submit', 'next', 'back'] as const).map(panel => (
              <button key={panel} type="button" onClick={() => setActiveButtonPanel(panel)}
                className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold capitalize transition-all ${activeButtonPanel === panel ? 'bg-white shadow-sm text-foreground border border-border/50 dark:bg-muted' : 'text-muted-foreground hover:text-foreground'}`}>
                {panel}
              </button>
            ))}
          </div>

          {/* ── SHARED ── */}
          {activeButtonPanel === 'shared' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><FieldLabel>Radius</FieldLabel><Input value={form.theme.buttonRadius || '8px'} onChange={e => updateTheme({ buttonRadius: e.target.value })} placeholder="8px" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Padding Y</FieldLabel><Input value={form.theme.buttonPaddingY || '12px'} onChange={e => updateTheme({ buttonPaddingY: e.target.value })} placeholder="12px" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Padding X</FieldLabel><Input value={form.theme.buttonPaddingX || '14px'} onChange={e => updateTheme({ buttonPaddingX: e.target.value })} placeholder="14px" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><FieldLabel>Box Shadow</FieldLabel><Input value={form.theme.buttonBoxShadow || ''} onChange={e => updateTheme({ buttonBoxShadow: e.target.value })} placeholder="0 4px 6px rgba(0,0,0,0.1)" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Text Shadow</FieldLabel><Input value={form.theme.buttonTextShadow || ''} onChange={e => updateTheme({ buttonTextShadow: e.target.value })} placeholder="0 1px 1px rgba(0,0,0,0.18)" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Hover Scale</FieldLabel><Input value={form.theme.buttonHoverScale || '1.02'} onChange={e => updateTheme({ buttonHoverScale: e.target.value })} placeholder="1.02" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Button Shape</FieldLabel>
                <div className="grid grid-cols-3 gap-1">
                  {(['rounded', 'pill', 'square'] as const).map(opt => (
                    <button key={opt} onClick={() => updateTheme({ buttonStyle: opt })}
                      className={`py-1.5 rounded-lg border-2 text-[10px] font-semibold capitalize transition-all ${(form.theme.buttonStyle ?? 'rounded') === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:border-primary/30'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SUBMIT ── */}
          {activeButtonPanel === 'submit' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><FieldLabel>Background</FieldLabel><Input value={form.theme.submitButtonBackground || ''} onChange={e => updateTheme({ submitButtonBackground: e.target.value })} placeholder="Gradient (default)" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Hover Background</FieldLabel><Input value={form.theme.submitButtonHoverBackground || ''} onChange={e => updateTheme({ submitButtonHoverBackground: e.target.value })} placeholder="Darker shade" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel>Text Color</FieldLabel>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={form.theme.submitButtonTextColor || form.theme.buttonTextColor || '#ffffff'} onChange={e => updateTheme({ submitButtonTextColor: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                    <Input value={form.theme.submitButtonTextColor || ''} onChange={e => updateTheme({ submitButtonTextColor: e.target.value })} placeholder="Global button text" className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
                  </div>
                </div>
                <div className="space-y-1.5"><FieldLabel>Hover Text Color</FieldLabel><Input value={form.theme.submitButtonHoverTextColor || ''} onChange={e => updateTheme({ submitButtonHoverTextColor: e.target.value })} placeholder="Inherits" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><FieldLabel>Border Color</FieldLabel><Input value={form.theme.submitButtonBorderColor || ''} onChange={e => updateTheme({ submitButtonBorderColor: e.target.value })} placeholder="transparent" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Box Shadow</FieldLabel><Input value={form.theme.submitButtonBoxShadow || ''} onChange={e => updateTheme({ submitButtonBoxShadow: e.target.value })} placeholder="Shared default" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><FieldLabel>Font Size</FieldLabel><Input value={form.theme.submitButtonFontSize || '15px'} onChange={e => updateTheme({ submitButtonFontSize: e.target.value })} placeholder="15px" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Font Weight</FieldLabel><Input value={form.theme.submitButtonFontWeight || '600'} onChange={e => updateTheme({ submitButtonFontWeight: e.target.value })} placeholder="600" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Width</FieldLabel><Input value={form.theme.submitButtonWidth || '100%'} onChange={e => updateTheme({ submitButtonWidth: e.target.value })} placeholder="100%" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><FieldLabel>Letter Spacing</FieldLabel><Input value={form.theme.submitButtonLetterSpacing || ''} onChange={e => updateTheme({ submitButtonLetterSpacing: e.target.value })} placeholder="normal" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5">
                  <FieldLabel>Text Transform</FieldLabel>
                  <Select value={form.theme.submitButtonTextTransform || 'none'} onValueChange={v => updateTheme({ submitButtonTextTransform: v as any })}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="uppercase">UPPERCASE</SelectItem><SelectItem value="capitalize">Capitalize</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Alignment</FieldLabel>
                <div className="grid grid-cols-3 gap-1">
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button key={a} onClick={() => updateTheme({ submitButtonAlign: a })}
                      className={`py-1.5 rounded-lg border-2 text-[10px] font-semibold capitalize transition-all ${(form.theme.submitButtonAlign ?? 'center') === a ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:border-primary/30'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel>Hover Animation</FieldLabel>
                  <Select value={form.theme.submitButtonHoverAnimation || 'lift'} onValueChange={v => updateTheme({ submitButtonHoverAnimation: v as any })}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lift">Lift Up</SelectItem>
                      <SelectItem value="scale">Scale Up</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                      <SelectItem value="pulse">Pulse</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(form.theme.submitButtonHoverAnimation === 'scale') && (
                  <div className="space-y-1.5"><FieldLabel>Scale Amount</FieldLabel><Input value={form.theme.submitButtonHoverScale || '1.03'} onChange={e => updateTheme({ submitButtonHoverScale: e.target.value })} placeholder="1.03" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                )}
              </div>
            </div>
          )}

          {/* ── NEXT ── */}
          {activeButtonPanel === 'next' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><FieldLabel>Background</FieldLabel><Input value={form.theme.nextButtonBackground || ''} onChange={e => updateTheme({ nextButtonBackground: e.target.value })} placeholder="Same as submit" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Hover Background</FieldLabel><Input value={form.theme.nextButtonHoverBackground || ''} onChange={e => updateTheme({ nextButtonHoverBackground: e.target.value })} placeholder="Auto" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel>Text Color</FieldLabel>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={form.theme.nextButtonTextColor || form.theme.buttonTextColor || '#ffffff'} onChange={e => updateTheme({ nextButtonTextColor: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                    <Input value={form.theme.nextButtonTextColor || ''} onChange={e => updateTheme({ nextButtonTextColor: e.target.value })} placeholder="#ffffff" className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
                  </div>
                </div>
                <div className="space-y-1.5"><FieldLabel>Border Color</FieldLabel><Input value={form.theme.nextButtonBorderColor || ''} onChange={e => updateTheme({ nextButtonBorderColor: e.target.value })} placeholder="transparent" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><FieldLabel>Font Size</FieldLabel><Input value={form.theme.nextButtonFontSize || '14px'} onChange={e => updateTheme({ nextButtonFontSize: e.target.value })} placeholder="14px" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Font Weight</FieldLabel><Input value={form.theme.nextButtonFontWeight || '600'} onChange={e => updateTheme({ nextButtonFontWeight: e.target.value })} placeholder="600" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Box Shadow</FieldLabel><Input value={form.theme.nextButtonBoxShadow || ''} onChange={e => updateTheme({ nextButtonBoxShadow: e.target.value })} placeholder="Shared default" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><FieldLabel>Letter Spacing</FieldLabel><Input value={form.theme.nextButtonLetterSpacing || ''} onChange={e => updateTheme({ nextButtonLetterSpacing: e.target.value })} placeholder="normal" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5">
                  <FieldLabel>Text Transform</FieldLabel>
                  <Select value={form.theme.nextButtonTextTransform || 'none'} onValueChange={v => updateTheme({ nextButtonTextTransform: v as any })}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="uppercase">UPPERCASE</SelectItem><SelectItem value="capitalize">Capitalize</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel>Hover Animation</FieldLabel>
                  <Select value={form.theme.nextButtonHoverAnimation || 'lift'} onValueChange={v => updateTheme({ nextButtonHoverAnimation: v as any })}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lift">Lift Up</SelectItem>
                      <SelectItem value="scale">Scale Up</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                      <SelectItem value="pulse">Pulse</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(form.theme.nextButtonHoverAnimation === 'scale') && (
                  <div className="space-y-1.5"><FieldLabel>Scale Amount</FieldLabel><Input value={form.theme.nextButtonHoverScale || '1.03'} onChange={e => updateTheme({ nextButtonHoverScale: e.target.value })} placeholder="1.03" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                )}
              </div>
            </div>
          )}

          {/* ── BACK ── */}
          {activeButtonPanel === 'back' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><FieldLabel>Background</FieldLabel><Input value={form.theme.backButtonBackground || ''} onChange={e => updateTheme({ backButtonBackground: e.target.value })} placeholder={form.theme.navButtonBackground || '#ffffff'} className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Hover Background</FieldLabel><Input value={form.theme.backButtonHoverBackground || ''} onChange={e => updateTheme({ backButtonHoverBackground: e.target.value })} placeholder="Auto" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel>Text Color</FieldLabel>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={form.theme.backButtonTextColor || form.theme.textColor || '#1e293b'} onChange={e => updateTheme({ backButtonTextColor: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                    <Input value={form.theme.backButtonTextColor || ''} onChange={e => updateTheme({ backButtonTextColor: e.target.value })} placeholder={form.theme.navButtonTextColor || '#1e293b'} className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
                  </div>
                </div>
                <div className="space-y-1.5"><FieldLabel>Border Color</FieldLabel><Input value={form.theme.backButtonBorderColor || ''} onChange={e => updateTheme({ backButtonBorderColor: e.target.value })} placeholder={form.theme.navButtonBorderColor || '#e2e8f0'} className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><FieldLabel>Font Size</FieldLabel><Input value={form.theme.backButtonFontSize || '14px'} onChange={e => updateTheme({ backButtonFontSize: e.target.value })} placeholder="14px" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Font Weight</FieldLabel><Input value={form.theme.backButtonFontWeight || '600'} onChange={e => updateTheme({ backButtonFontWeight: e.target.value })} placeholder="600" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5"><FieldLabel>Box Shadow</FieldLabel><Input value={form.theme.backButtonBoxShadow || ''} onChange={e => updateTheme({ backButtonBoxShadow: e.target.value })} placeholder="none" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><FieldLabel>Letter Spacing</FieldLabel><Input value={form.theme.backButtonLetterSpacing || ''} onChange={e => updateTheme({ backButtonLetterSpacing: e.target.value })} placeholder="normal" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                <div className="space-y-1.5">
                  <FieldLabel>Text Transform</FieldLabel>
                  <Select value={form.theme.backButtonTextTransform || 'none'} onValueChange={v => updateTheme({ backButtonTextTransform: v as any })}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="uppercase">UPPERCASE</SelectItem><SelectItem value="capitalize">Capitalize</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel>Hover Animation</FieldLabel>
                  <Select value={form.theme.backButtonHoverAnimation || 'lift'} onValueChange={v => updateTheme({ backButtonHoverAnimation: v as any })}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lift">Lift Up</SelectItem>
                      <SelectItem value="scale">Scale Up</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                      <SelectItem value="pulse">Pulse</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(form.theme.backButtonHoverAnimation === 'scale') && (
                  <div className="space-y-1.5"><FieldLabel>Scale Amount</FieldLabel><Input value={form.theme.backButtonHoverScale || '1.03'} onChange={e => updateTheme({ backButtonHoverScale: e.target.value })} placeholder="1.03" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
                )}
              </div>
            </div>
          )}
        </SettingsSection>

        {/* Progress Bar */}
        <SettingsSection title="Progress Bar" icon={BarChart3} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Color</FieldLabel>
              <div className="flex items-center gap-1.5">
                <input type="color" value={form.theme.progressBarColor || form.theme.primaryColor} onChange={e => updateTheme({ progressBarColor: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                <Input value={form.theme.progressBarColor || ''} onChange={e => updateTheme({ progressBarColor: e.target.value })} placeholder="Primary color" className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
              </div>
            </div>
            <div className="space-y-1.5"><FieldLabel>Height</FieldLabel><Input value={form.theme.progressBarHeight || '4px'} onChange={e => updateTheme({ progressBarHeight: e.target.value })} placeholder="4px" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" /></div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Style</FieldLabel>
            <div className="grid grid-cols-3 gap-1">
              {(['bar', 'dots', 'line'] as const).map(s => (
                <button key={s} onClick={() => updateTheme({ progressBarStyle: s })}
                  className={`py-1.5 rounded-lg border-2 text-[10px] font-semibold capitalize transition-all ${(form.theme.progressBarStyle ?? 'dots') === s ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:border-primary/30'}`}>
                  {s}
                </button>
              ))}
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
          {/* Page background gradient */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>BG Gradient End</FieldLabel>
              <div className="flex items-center gap-1.5">
                <input type="color" value={form.theme.pageBackgroundGradientEnd || form.theme.backgroundColor} onChange={e => updateTheme({ pageBackgroundGradientEnd: e.target.value })} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer shrink-0" />
                <Input value={form.theme.pageBackgroundGradientEnd || ''} onChange={e => updateTheme({ pageBackgroundGradientEnd: e.target.value })} placeholder="None (flat)" className="font-mono text-[10px] h-8 rounded-lg border-border/40 bg-muted/20 px-2" />
              </div>
            </div>
            {form.theme.pageBackgroundGradientEnd && (
              <div className="space-y-1.5 col-span-2">
                <FieldLabel>Gradient Angle</FieldLabel>
                <Input value={form.theme.pageBackgroundGradientAngle || '135deg'} onChange={e => updateTheme({ pageBackgroundGradientAngle: e.target.value })} placeholder="135deg" className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono" />
              </div>
            )}
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
          {/* Cursive Header */}
          <div className="space-y-2 rounded-lg border border-violet-200/50 bg-violet-50/30 p-3">
            <div className="flex items-center justify-between">
              <FieldLabel>Cursive Header</FieldLabel>
              <Switch checked={form.theme.headerCursiveEnabled ?? false} onCheckedChange={v => updateTheme({ headerCursiveEnabled: v })} />
            </div>
            {form.theme.headerCursiveEnabled && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <FieldLabel>Cursive Font</FieldLabel>
                  <Select value={form.theme.headerCursiveFont || 'Great Vibes'} onValueChange={v => updateTheme({ headerCursiveFont: v })}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Great Vibes','Brush Script MT','Cursive','Satisfy','Dancing Script','Pacifico'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <FieldLabel>Apply To</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {(['left','right','all'] as const).map(part => (
                      <button key={part} type="button" onClick={() => updateTheme({ headerCursivePart: part })}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                          (form.theme.headerCursivePart ?? 'all') === part ? 'border-violet-500 bg-violet-100 text-violet-900' : 'border-violet-200 bg-white text-violet-700 hover:bg-violet-50'
                        }`}
                      >{part === 'left' ? 'Left Half' : part === 'right' ? 'Right Half' : 'All Text'}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
          <div className="space-y-1.5">
            <FieldLabel>Label Font Weight</FieldLabel>
            <Select value={form.theme.labelFontWeight || '500'} onValueChange={v => updateTheme({ labelFontWeight: v })}>
              <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="300">300 — Light</SelectItem>
                <SelectItem value="400">400 — Normal</SelectItem>
                <SelectItem value="500">500 — Medium</SelectItem>
                <SelectItem value="600">600 — Semibold</SelectItem>
                <SelectItem value="700">700 — Bold</SelectItem>
                <SelectItem value="800">800 — Extrabold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Input Style</FieldLabel>
            <div className="grid grid-cols-3 gap-1">
              {([
                { v: 'solid',       label: 'Solid' },
                { v: 'bottom-only', label: 'Underline' },
                { v: 'none',        label: 'None' },
              ] as const).map(opt => (
                <button key={opt.v} onClick={() => updateTheme({ inputBorderStyle: opt.v })}
                  className={`py-1.5 rounded-lg border-2 text-[10px] font-semibold transition-all ${
                    (form.theme.inputBorderStyle ?? 'solid') === opt.v
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/40 text-muted-foreground hover:border-primary/30'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Button Shape</FieldLabel>
            <div className="grid grid-cols-3 gap-1">
              {([
                { v: 'rounded', label: 'Rounded' },
                { v: 'pill',    label: 'Pill' },
                { v: 'square',  label: 'Square' },
              ] as const).map(opt => (
                <button key={opt.v} onClick={() => updateTheme({ buttonStyle: opt.v })}
                  className={`py-1.5 rounded-lg border-2 text-[10px] font-semibold transition-all ${
                    (form.theme.buttonStyle ?? 'rounded') === opt.v
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/40 text-muted-foreground hover:border-primary/30'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Form Layout */}
        <SettingsSection title="Page Layout" icon={Monitor} badge={
          <Badge
            variant="secondary"
            className="text-[10px] h-5 rounded-full capitalize"
          >
            {form.layout ?? 'classic'}
          </Badge>
        }>
          <div className="grid grid-cols-5 gap-2">
            {[
              { value: 'classic', label: 'Classic' },
              { value: 'card', label: 'Card' },
              { value: 'split-left', label: 'Split L' },
              { value: 'split-right', label: 'Split R' },
              { value: 'editorial-left', label: 'Edit L' },
              { value: 'editorial-right', label: 'Edit R' },
              { value: 'banner-top', label: 'Banner' },
              { value: 'showcase-banner', label: 'Hero' },
              { value: 'floating', label: 'Float' },
              { value: 'fullscreen', label: 'Full' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  handleLayoutChange(opt.value as FormConfig['layout'])
                }
                className={`py-2 rounded-xl border-2 text-[10px] font-semibold transition-all ${
                  (form.layout ?? 'classic') === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/40 text-muted-foreground hover:border-primary/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {['split-left', 'split-right', 'editorial-left', 'editorial-right', 'banner-top', 'showcase-banner', 'floating'].includes(
            form.layout ?? ''
          ) && (
            <>
              <div className="space-y-2">
                <FieldLabel>Panel Split</FieldLabel>
                <Slider
                  value={[form.layoutImagePanelWidth ?? 45]}
                  min={15}
                  max={80}
                  step={1}
                  onValueChange={([v]) =>
                    onUpdate({ layoutImagePanelWidth: v })
                  }
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Form {100 - (form.layoutImagePanelWidth ?? 45)}%</span>
                  <span>Image {form.layoutImagePanelWidth ?? 45}%</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Image URL</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    value={form.layoutImageUrl || ''}
                    onChange={(e) =>
                      onUpdate({ layoutImageUrl: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/…"
                    className="rounded-xl border-border/50 bg-muted/20 text-[12px] flex-1"
                  />
                  <label
                    className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 text-[11px] font-medium text-muted-foreground whitespace-nowrap transition-colors"
                    title="Upload from device"
                  >
                    <Upload className="h-3 w-3" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => onUpdate({ layoutImageUrl: ev.target?.result as string });
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Image Fit</FieldLabel>
                <Select
                  value={form.layoutImageFit || 'cover'}
                  onValueChange={(v) =>
                    onUpdate({ layoutImageFit: v as any })
                  }
                >
                  <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'cover',
                      'contain',
                      'fill',
                      'natural',
                      'zoom-in',
                      'zoom-out',
                      'tile',
                    ].map((f) => (
                      <SelectItem
                        key={f}
                        value={f}
                        className="text-[12px]"
                      >
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Image Position</FieldLabel>
                <p className="text-[11px] text-muted-foreground">
                  Click the preview to set focus point
                </p>
                <div
                  className="relative w-full h-64 rounded-lg border-2 border-border/60 overflow-hidden cursor-crosshair"
                  style={{
                    backgroundImage: form.layoutImageUrl
                      ? `url(${form.layoutImageUrl})`
                      : undefined,
                    backgroundSize:
                      form.layoutImageFit === 'cover'
                        ? 'cover'
                        : form.layoutImageFit === 'contain'
                        ? 'contain'
                        : 'cover',
                    backgroundPosition: `${
                      form.layoutImagePositionX ?? '50'
                    }% ${form.layoutImagePositionY ?? '50'}%`,
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: form.layoutImageUrl
                      ? undefined
                      : 'var(--muted)',
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    onUpdate({
                      layoutImagePositionX: Math.round(
                        Math.max(0, Math.min(100, x))
                      ).toString(),
                      layoutImagePositionY: Math.round(
                        Math.max(0, Math.min(100, y))
                      ).toString(),
                    });
                  }}
                >
                  <div
                    className="absolute w-5 h-5 border-2 border-white rounded-full shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${form.layoutImagePositionX ?? '50'}%`,
                      top: `${form.layoutImagePositionY ?? '50'}%`,
                      boxShadow: '0 0 0 2px #000',
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center font-mono">
                  {form.layoutImagePositionX ?? '50'}% H ·{' '}
                  {form.layoutImagePositionY ?? '50'}% V
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <FieldLabel>Horizontal Focus</FieldLabel>
                    <Slider
                      value={[Number(form.layoutImagePositionX ?? 50)]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => onUpdate({ layoutImagePositionX: String(v) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Vertical Focus</FieldLabel>
                    <Slider
                      value={[Number(form.layoutImagePositionY ?? 50)]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => onUpdate({ layoutImagePositionY: String(v) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { x: '0', y: '0', t: '↖' },
                    { x: '50', y: '0', t: '↑' },
                    { x: '100', y: '0', t: '↗' },
                    { x: '0', y: '50', t: '←' },
                    { x: '50', y: '50', t: '•' },
                    { x: '100', y: '50', t: '→' },
                    { x: '0', y: '100', t: '↙' },
                    { x: '50', y: '100', t: '↓' },
                    { x: '100', y: '100', t: '↘' },
                  ].map((pos) => {
                    const active =
                      (form.layoutImagePositionX ?? '50') === pos.x &&
                      (form.layoutImagePositionY ?? '50') === pos.y;
                    return (
                      <button
                        key={`${pos.x}-${pos.y}`}
                        type="button"
                        onClick={() =>
                          onUpdate({
                            layoutImagePositionX: pos.x,
                            layoutImagePositionY: pos.y,
                          })
                        }
                        className={`h-7 rounded-md text-[12px] transition-all ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        {pos.t}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { x: '18', y: '18', t: 'Top Left' },
                    { x: '50', y: '18', t: 'Top Focus' },
                    { x: '82', y: '18', t: 'Top Right' },
                    { x: '18', y: '50', t: 'Left Focus' },
                    { x: '50', y: '50', t: 'Center' },
                    { x: '82', y: '50', t: 'Right Focus' },
                    { x: '18', y: '82', t: 'Bottom Left' },
                    { x: '50', y: '82', t: 'Bottom Focus' },
                    { x: '82', y: '82', t: 'Bottom Right' },
                  ].map((pos) => (
                    <button
                      key={`${pos.t}-${pos.x}-${pos.y}`}
                      type="button"
                      onClick={() => onUpdate({ layoutImagePositionX: pos.x, layoutImagePositionY: pos.y })}
                      className="rounded-md border border-border/40 bg-muted/20 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      {pos.t}
                    </button>
                  ))}
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
                  <Select value={currentTokenPreset} onValueChange={v => { if (v !== '__custom__') { updateWebhook({ token: v, headers: { ...form.webhookConfig.headers, Authorization: `Bearer ${v}` } }); }
                    else { updateWebhook({ token: '' }); }
                  }}>
                    <SelectTrigger className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"><SelectValue placeholder="Select token…" /></SelectTrigger>
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
                <div className="space-y-1.5">
                  {Object.entries(form.webhookConfig.headers).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-sm rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                    >
                      <code className="text-xs font-semibold text-primary flex-1 truncate">
                        {key}
                      </code>
                      <code className="text-xs text-muted-foreground flex-1 truncate">
                        {val}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive shrink-0"
                        onClick={() => removeHeader(key)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newHeaderKey}
                    onChange={(e) => setNewHeaderKey(e.target.value)}
                    placeholder="Key"
                    className="flex-1 rounded-lg border-border/40 bg-muted/20 h-7 text-[11px]"
                  />
                  <Input
                    value={newHeaderVal}
                    onChange={(e) => setNewHeaderVal(e.target.value)}
                    placeholder="Value"
                    className="flex-1 rounded-lg border-border/40 bg-muted/20 h-7 text-[11px]"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-lg"
                    onClick={addHeader}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
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
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-amber-800">Setup Required</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">Add the following three secrets to Supabase → Project Settings → Edge Functions → Secrets:</p>
            <ul className="text-[11px] text-amber-700 space-y-0.5 pl-3 list-disc">
              <li><code className="bg-amber-100 px-1 rounded text-[10px] font-mono">GOOGLE_CLIENT_ID</code></li>
              <li><code className="bg-amber-100 px-1 rounded text-[10px] font-mono">GOOGLE_CLIENT_SECRET</code></li>
              <li><code className="bg-amber-100 px-1 rounded text-[10px] font-mono">GOOGLE_REFRESH_TOKEN</code></li>
            </ul>
            <p className="text-[11px] text-amber-700 leading-relaxed">Get these from Google Cloud Console → OAuth 2.0 credentials. Use the OAuth Playground or your app's auth flow to obtain a refresh token with the Sheets and Drive scopes.</p>
          </div>
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

        {/* ── Email Notifications ── */}
        {(() => {
          const emailCfg = form.emailNotificationConfig ?? defaultEmailConfig;
          return (
            <SettingsSection title="Email Notifications" icon={Mail} badge={
              <Badge variant={emailCfg.enabled ? 'default' : 'secondary'} className="text-[10px] h-5 rounded-full">{emailCfg.enabled ? 'Active' : 'Off'}</Badge>
            } defaultOpen={false}>
              <SettingsRow label="Send email on submission">
                <Switch checked={emailCfg.enabled} onCheckedChange={v => updateEmail({ enabled: v })} />
              </SettingsRow>
              {emailCfg.enabled && (
                <div className="space-y-3">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Emails are sent via the <strong>Mailtrap Sending API</strong>. Use <code className="bg-muted px-1 rounded">{'{{fieldName}}'}</code> in Subject / To fields to insert form values.
                  </p>

                  {/* Mailtrap credentials */}
                  <div className="rounded-xl border border-border/40 bg-muted/10 p-3 space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">API Credentials</p>
                    <div className="space-y-1">
                      <FieldLabel>Mailtrap API Token</FieldLabel>
                      <Input
                        type="password"
                        value={emailCfg.mailtrapToken}
                        onChange={e => updateEmail({ mailtrapToken: e.target.value })}
                        placeholder="Enter your Mailtrap API token"
                        className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <FieldLabel>Client ID</FieldLabel>
                        <Input
                          value={emailCfg.clientId ?? ''}
                          onChange={e => updateEmail({ clientId: e.target.value })}
                          placeholder="OAuth Client ID"
                          className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Client Secret</FieldLabel>
                        <Input
                          type="password"
                          value={emailCfg.clientSecret ?? ''}
                          onChange={e => updateEmail({ clientSecret: e.target.value })}
                          placeholder="OAuth Client Secret"
                          className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Refresh Token</FieldLabel>
                      <Input
                        type="password"
                        value={emailCfg.refreshToken ?? ''}
                        onChange={e => updateEmail({ refreshToken: e.target.value })}
                        placeholder="OAuth Refresh Token"
                        className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px] font-mono"
                      />
                    </div>
                  </div>

                  {/* From */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <FieldLabel>From Name</FieldLabel>
                      <Input
                        value={emailCfg.fromName ?? ''}
                        onChange={e => updateEmail({ fromName: e.target.value })}
                        placeholder="Your Company"
                        className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>From Email</FieldLabel>
                      <Input
                        type="email"
                        value={emailCfg.from}
                        onChange={e => updateEmail({ from: e.target.value })}
                        placeholder="hello@example.com"
                        className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"
                      />
                    </div>
                  </div>

                  {/* To / Subject */}
                  <div className="space-y-1">
                    <FieldLabel>To</FieldLabel>
                    <Input
                      value={emailCfg.to}
                      onChange={e => updateEmail({ to: e.target.value })}
                      placeholder="admin@example.com or {{email}}"
                      className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>Subject</FieldLabel>
                    <Input
                      value={emailCfg.subject}
                      onChange={e => updateEmail({ subject: e.target.value })}
                      placeholder="New submission from {{name}}"
                      className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"
                    />
                  </div>

                  {/* CC / BCC */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <FieldLabel>CC</FieldLabel>
                      <Input
                        value={emailCfg.cc ?? ''}
                        onChange={e => updateEmail({ cc: e.target.value })}
                        placeholder="cc@example.com"
                        className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>BCC</FieldLabel>
                      <Input
                        value={emailCfg.bcc ?? ''}
                        onChange={e => updateEmail({ bcc: e.target.value })}
                        placeholder="bcc@example.com"
                        className="rounded-lg border-border/40 bg-muted/20 h-8 text-[12px]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </SettingsSection>
          );
        })()}
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
          {form.publicationState === 'published' && form.deployedUrl && (
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
