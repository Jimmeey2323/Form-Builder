import { FormConfig, WebhookConfig, PixelConfig, FormAnimations, FormTheme } from '@/types/formField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ThemeSelectionDialog } from '@/components/ThemeSelectionDialog';
import { HeroImagePickerDialog } from '@/components/form-builder/HeroImagePickerDialog';
import { Plus, Trash2, ExternalLink, Loader2, Sheet, Webhook, Globe, Key, Palette, Type, Layers, BarChart3, MapPin, FileText, Calendar, AlignLeft, AlignCenter, AlignRight, Sparkles, Image, Columns, Monitor, PanelLeft, PanelRight, Maximize2 } from 'lucide-react';
import { applyHeroImageForLayout } from '@/utils/layoutImageHelpers';
import { useState } from 'react';

// Preset Webhook URLs
const WEBHOOK_URL_PRESETS = [
  { label: 'Momence — Bengaluru (33905)', value: 'https://api.momence.com/integrations/customer-leads/33905/collect' },
  { label: 'Momence — Custom (13752)', value: 'https://api.momence.com/integrations/customer-leads/13752/collect' },
  { label: 'Custom URL…', value: '__custom__' },
];

// Preset Tokens
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
  onUpdateSheetStructure?: () => void;
}

export function FormSettingsPanel({ form, onUpdate, onCreateSheet, isCreatingSheet, onUpdateSheetStructure }: FormSettingsPanelProps) {
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderVal, setNewHeaderVal] = useState('');
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showHeroPicker, setShowHeroPicker] = useState(false);
  const [heroPickerInitialPage, setHeroPickerInitialPage] = useState(0);
  const [settingsTab, setSettingsTab] = useState<'content' | 'design' | 'integrations' | 'publish'>('content');
  const openHeroPicker = (page = 0) => { setHeroPickerInitialPage(page); setShowHeroPicker(true); };

  // Compute page count from form fields (number of page-break fields + 1)
  const pageCount = form.fields.filter(f => f.type === 'page-break').length + 1;

  // Determine if current URL matches a preset or is custom
  const currentUrlPreset = WEBHOOK_URL_PRESETS.find(p => p.value === form.webhookConfig.url)?.value ?? '__custom__';
  const currentTokenPreset = TOKEN_PRESETS.find(p => p.value === form.webhookConfig.token)?.value ?? '__custom__';

  const updateTheme = (updates: Partial<FormConfig['theme']>) => {
    onUpdate({ theme: { ...form.theme, ...updates } });
  };

  const toggleProShadow = () => {
    const nextShadow = form.theme.formShadow === 'xl' ? 'md' : 'xl';
    updateTheme({ formShadow: nextShadow });
  };

  const handleSelectTheme = (theme: FormTheme) => {
    updateTheme(theme);
  };

  const updateAnimations = (updates: Partial<FormAnimations>) => {
    onUpdate({ animations: { enabled: true, ...form.animations, ...updates } });
  };

  const updateWebhook = (updates: Partial<WebhookConfig>) => {
    onUpdate({ webhookConfig: { ...form.webhookConfig, ...updates } });
  };

  const updatePixels = (updates: Partial<PixelConfig>) => {
    onUpdate({ pixelConfig: { ...form.pixelConfig, ...updates } });
  };

  const updateUtmDefaults = (key: string, value: string) => {
    updateWebhook({
      utmParamDefaults: {
        ...form.webhookConfig.utmParamDefaults,
        [key]: value,
      },
    });
  };

  const handleLayoutChange = (layout: FormConfig['layout']) => {
    onUpdate(applyHeroImageForLayout(form, { layout }));
  };

  const addHeader = () => {
    if (!newHeaderKey) return;
    const headers = { ...form.webhookConfig.headers, [newHeaderKey]: newHeaderVal };
    updateWebhook({ headers });
    setNewHeaderKey('');
    setNewHeaderVal('');
  };

  const removeHeader = (key: string) => {
    const headers = { ...form.webhookConfig.headers };
    delete headers[key];
    updateWebhook({ headers });
  };

  const sheetUrl = form.googleSheetsConfig.spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${form.googleSheetsConfig.spreadsheetId}`
    : null;

  return (
    <>
    {/* ── Settings Tab Navigation ── */}
    <div className="flex gap-1 p-1 mb-5 rounded-xl bg-slate-100/70 border border-border/40">
      {([
        { id: 'content'      as const, label: 'Content',      Icon: FileText },
        { id: 'design'       as const, label: 'Design',       Icon: Palette  },
        { id: 'integrations' as const, label: 'Integrations', Icon: Webhook  },
        { id: 'publish'      as const, label: 'Publish',      Icon: Globe    },
      ]).map(tab => (
        <button
          key={tab.id}
          onClick={() => setSettingsTab(tab.id)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-semibold transition-all ${
            settingsTab === tab.id
              ? 'bg-white shadow-sm text-indigo-700'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <tab.Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>

    <Accordion type="multiple" defaultValue={['general', 'form-elements', 'hero-images', 'layout', 'webhook', 'utm', 'pixels', 'google-sheets', 'advanced', 'theme-basic', 'theme-dimensions', 'theme-typography', 'animations', 'deployment', 'custom-css']} className="space-y-3">

      {/* ── CONTENT TAB ── */}
      <div className={settingsTab === 'content' ? 'space-y-3' : 'hidden'}>

      {/* ── General ── */}
      <AccordionItem value="general" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Layers className="h-3.5 w-3.5" /></span>
            General Settings
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <div className="space-y-2">
            <Label className="settings-label">Form Title</Label>
            <Input value={form.title} onChange={e => onUpdate({ title: e.target.value })} className="settings-input" />
          </div>
          <div className="space-y-2">
            <Label className="settings-label">Description</Label>
            <Textarea value={form.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={2} className="settings-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="settings-label">Submit Button Text</Label>
              <Input value={form.submitButtonText} onChange={e => onUpdate({ submitButtonText: e.target.value })} className="settings-input" />
            </div>
            <div className="space-y-2">
              <Label className="settings-label">Success Message</Label>
              <Input value={form.successMessage} onChange={e => onUpdate({ successMessage: e.target.value })} className="settings-input" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Form Elements ── */}
      <AccordionItem value="form-elements" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><FileText className="h-3.5 w-3.5" /></span>
            Form Elements
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <div className="space-y-2">
            <Label className="settings-label flex items-center gap-1.5"><AlignLeft className="h-3 w-3" /> Sub-Header</Label>
            <Input
              value={form.subHeader || ''}
              onChange={e => onUpdate({ subHeader: e.target.value })}
              placeholder="e.g. Your first class is on us!"
              className="settings-input"
            />
            <p className="text-[11px] text-muted-foreground">Shown below the form title in a smaller accent style.</p>
          </div>
          <div className="space-y-2">
            <Label className="settings-label flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Venue</Label>
            <Input
              value={form.venue || ''}
              onChange={e => onUpdate({ venue: e.target.value })}
              placeholder="e.g. Kenkere House, Vittal Mallya Road"
              className="settings-input"
            />
            <p className="text-[11px] text-muted-foreground">Displayed as a venue badge/chip at the top of the form.</p>
          </div>
          <div className="space-y-2">
            <Label className="settings-label flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Date & Time Stamp</Label>
            <Input
              value={form.dateTimeStamp || ''}
              onChange={e => onUpdate({ dateTimeStamp: e.target.value })}
              placeholder="e.g. Saturday, 1 Mar 2026 · 9:00 AM"
              className="settings-input"
            />
            <p className="text-[11px] text-muted-foreground">Free-text date/time label shown alongside the venue.</p>
          </div>
          <div className="space-y-2">
            <Label className="settings-label flex items-center gap-1.5"><Type className="h-3 w-3" /> Footer</Label>
            <Textarea
              value={form.footer || ''}
              onChange={e => onUpdate({ footer: e.target.value })}
              placeholder="e.g. © 2026 Physique 57 · By submitting you agree to our Terms."
              rows={2}
              className="settings-input"
            />
            <p className="text-[11px] text-muted-foreground">Small text shown at the very bottom of the form card.</p>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Page Hero Images ── */}
      <AccordionItem value="hero-images" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Image className="h-3.5 w-3.5" /></span>
            Page Hero Images
          </span>
          {Object.keys(form.pageHeroImages ?? {}).filter(k => (form.pageHeroImages ?? {})[+k]).length > 0 && (
            <Badge variant="secondary" className="ml-auto mr-2 text-[10px]">
              {Object.keys(form.pageHeroImages ?? {}).filter(k => (form.pageHeroImages ?? {})[+k]).length} set
            </Badge>
          )}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 px-5 pb-6 pt-3">
          <p className="text-xs text-muted-foreground">
            Add a full-width banner image to the top of any form page. Images are selected from the built-in library and saved permanently with the form.
          </p>

          {/* Thumbnail previews */}
          {Object.entries(form.pageHeroImages ?? {}).filter(([, v]) => v).length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(form.pageHeroImages ?? {}).filter(([, v]) => v).map(([pageIdx, url]) => (
                <div key={pageIdx} className="relative rounded-lg overflow-hidden h-16 border border-border/50 group bg-muted/30">
                  <img src={url} alt={`Page ${+pageIdx + 1} hero`} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/30 flex items-end px-2 py-1">
                    <span className="text-[10px] font-semibold text-white">Page {+pageIdx + 1}</span>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openHeroPicker(+pageIdx)}
                      className="p-1 rounded bg-black/50 hover:bg-primary/80 text-white"
                      title="Change image"
                    >
                      <Image className="h-2.5 w-2.5" />
                    </button>
                    <button
                      onClick={() => {
                        const next = { ...(form.pageHeroImages ?? {}) };
                        delete next[+pageIdx];
                        onUpdate({ pageHeroImages: next });
                      }}
                      className="p-1 rounded bg-black/50 hover:bg-black/70 text-white"
                      title="Remove"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => openHeroPicker(0)}
          >
            <Image className="h-3.5 w-3.5" />
            {Object.keys(form.pageHeroImages ?? {}).filter(k => (form.pageHeroImages ?? {})[+k]).length > 0
              ? 'Manage Hero Images'
              : 'Choose Hero Images'}
          </Button>
        </AccordionContent>
      </AccordionItem>
      </div>{/* end content tab */}

      {/* ── INTEGRATIONS TAB ── */}
      <div className={settingsTab === 'integrations' ? 'space-y-3' : 'hidden'}>

      {/* ── Webhook Configuration ── */}
      <AccordionItem value="webhook" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Webhook className="h-3.5 w-3.5" /></span>
            Webhook Configuration
          </span>
          <Badge variant={form.webhookConfig.enabled ? 'default' : 'secondary'} className="ml-auto mr-2 text-[10px]">
            {form.webhookConfig.enabled ? 'Active' : 'Off'}
          </Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-slate-50/70 px-4 py-3">
            <Label className="text-sm font-medium">Enable Webhook</Label>
            <Switch checked={form.webhookConfig.enabled} onCheckedChange={v => updateWebhook({ enabled: v })} />
          </div>
          {form.webhookConfig.enabled && (
            <>
              {/* Webhook URL */}
              <div className="space-y-2">
                <Label className="settings-label">Webhook URL</Label>
                <Select
                  value={currentUrlPreset}
                  onValueChange={v => {
                    if (v !== '__custom__') updateWebhook({ url: v });
                    else updateWebhook({ url: '' });
                  }}
                >
                  <SelectTrigger className="settings-input"><SelectValue placeholder="Select an endpoint…" /></SelectTrigger>
                  <SelectContent>
                    {WEBHOOK_URL_PRESETS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentUrlPreset === '__custom__' && (
                  <Input
                    value={form.webhookConfig.url}
                    onChange={e => updateWebhook({ url: e.target.value })}
                    placeholder="https://api.example.com/submit"
                    className="settings-input mt-2"
                  />
                )}
                {currentUrlPreset !== '__custom__' && (
                  <p className="text-xs text-muted-foreground font-mono truncate px-1">{form.webhookConfig.url}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="settings-label">Method</Label>
                  <Select value={form.webhookConfig.method} onValueChange={v => updateWebhook({ method: v as any })}>
                    <SelectTrigger className="settings-input"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Token */}
                <div className="space-y-2 col-span-2">
                  <Label className="settings-label">Auth Token</Label>
                  <Select
                    value={currentTokenPreset}
                    onValueChange={v => {
                      if (v !== '__custom__') {
                        updateWebhook({
                          token: v,
                          headers: { ...form.webhookConfig.headers, Authorization: `Bearer ${v}` },
                        });
                      } else {
                        updateWebhook({ token: '' });
                      }
                    }}
                  >
                    <SelectTrigger className="settings-input"><SelectValue placeholder="Select token…" /></SelectTrigger>
                    <SelectContent>
                      {TOKEN_PRESETS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentTokenPreset === '__custom__' && (
                    <Input
                      value={form.webhookConfig.token || ''}
                      onChange={e => updateWebhook({
                        token: e.target.value,
                        headers: { ...form.webhookConfig.headers, Authorization: `Bearer ${e.target.value}` },
                      })}
                      placeholder="Enter auth token"
                      className="settings-input mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="settings-label">Source ID</Label>
                <Input value={form.webhookConfig.sourceId || ''} onChange={e => updateWebhook({ sourceId: e.target.value })} className="settings-input" />
              </div>
              <div className="space-y-2">
                <Label className="settings-label">Redirect URL (after submit)</Label>
                <Input value={form.webhookConfig.redirectUrl || ''} onChange={e => updateWebhook({ redirectUrl: e.target.value })} placeholder="https://…" className="settings-input" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-slate-50/70 px-4 py-3">
                <Label className="text-sm font-medium">Capture UTM Params from URL</Label>
                <Switch checked={form.webhookConfig.includeUtmParams} onCheckedChange={v => updateWebhook({ includeUtmParams: v })} />
              </div>

              {/* Custom Headers */}
              <div className="space-y-2">
                <Label className="settings-label">Custom Headers</Label>
                <div className="space-y-2">
                  {Object.entries(form.webhookConfig.headers).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-sm rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                      <code className="text-xs font-semibold text-primary flex-1 truncate">{key}</code>
                      <code className="text-xs text-muted-foreground flex-1 truncate">{val}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeHeader(key)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input value={newHeaderKey} onChange={e => setNewHeaderKey(e.target.value)} placeholder="Header name" className="flex-1 text-sm settings-input" />
                  <Input value={newHeaderVal} onChange={e => setNewHeaderVal(e.target.value)} placeholder="Value" className="flex-1 text-sm settings-input" />
                  <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={addHeader}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* ── UTM Parameters ── */}
      <AccordionItem value="utm" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><MapPin className="h-3.5 w-3.5" /></span>
            UTM Parameters
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Set static/default UTM values that are always sent with form submissions. Dynamic values from the page URL are appended on top when "Capture UTM Params from URL" is enabled.
          </p>
          {[
            { key: 'utm_source', label: 'UTM Source', placeholder: 'e.g. instagram' },
            { key: 'utm_medium', label: 'UTM Medium', placeholder: 'e.g. paid_social' },
            { key: 'utm_campaign', label: 'UTM Campaign', placeholder: 'e.g. trial_offer_may' },
            { key: 'utm_term', label: 'UTM Term', placeholder: 'e.g. pilates+studio' },
            { key: 'utm_content', label: 'UTM Content', placeholder: 'e.g. hero_cta' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label className="settings-label">{label}</Label>
              <Input
                value={(form.webhookConfig.utmParamDefaults as any)?.[key] || ''}
                onChange={e => updateUtmDefaults(key, e.target.value)}
                placeholder={placeholder}
                className="settings-input font-mono text-sm"
              />
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      {/* ── Tracking Pixels ── */}
      <AccordionItem value="pixels" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><BarChart3 className="h-3.5 w-3.5" /></span>
            Tracking Pixels
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          {[
            { label: 'Snap Pixel ID', key: 'snapPixelId' as const, placeholder: 'e.g. 5217a3a7-…' },
            { label: 'Meta (Facebook) Pixel ID', key: 'metaPixelId' as const, placeholder: 'e.g. 527819981439695' },
            { label: 'Google Ads ID', key: 'googleAdsId' as const, placeholder: 'e.g. AW-809104648' },
            { label: 'Google Ads Conversion Label', key: 'googleAdsConversionLabel' as const, placeholder: '' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label className="settings-label">{label}</Label>
              <Input value={form.pixelConfig[key] || ''} onChange={e => updatePixels({ [key]: e.target.value })} placeholder={placeholder} className="settings-input" />
            </div>
          ))}
          <div className="space-y-2">
            <Label className="settings-label">Custom Tracking Scripts</Label>
            <Textarea
              value={form.pixelConfig.customScripts || ''}
              onChange={e => updatePixels({ customScripts: e.target.value })}
              rows={4}
              placeholder="Paste any custom tracking scripts here…"
              className="settings-input font-mono text-xs"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Google Sheets ── */}
      <AccordionItem value="google-sheets" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Sheet className="h-3.5 w-3.5" /></span>
            Google Sheets
          </span>
          <Badge variant={form.googleSheetsConfig.enabled ? 'default' : 'secondary'} className="ml-auto mr-2 text-[10px]">
            {form.googleSheetsConfig.spreadsheetId ? 'Connected' : form.googleSheetsConfig.enabled ? 'Pending' : 'Off'}
          </Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-slate-50/70 px-4 py-3">
            <Label className="text-sm font-medium">Record Submissions to Google Sheets</Label>
            <Switch checked={form.googleSheetsConfig.enabled} onCheckedChange={v => onUpdate({ googleSheetsConfig: { ...form.googleSheetsConfig, enabled: v } })} />
          </div>
          {form.googleSheetsConfig.enabled && (
            <>
              {sheetUrl ? (
                <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-300/50">
                      <Sheet className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-emerald-800">Spreadsheet connected</p>
                      <p className="text-[10px] text-emerald-600/70">Submissions auto-recorded</p>
                    </div>
                    <span className="ml-auto flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-100 border border-emerald-200/70 rounded-full px-2 py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2 transition-colors"
                    >
                      Open Sheet <ExternalLink className="h-3 w-3" />
                    </a>
                    {onUpdateSheetStructure && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onUpdateSheetStructure}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        Update Structure
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Button onClick={onCreateSheet} disabled={isCreatingSheet} className="w-full premium-btn">
                  {isCreatingSheet ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sheet className="h-4 w-4 mr-2" />
                  )}
                  {isCreatingSheet ? 'Creating Spreadsheet…' : 'Create Spreadsheet & Connect'}
                </Button>
              )}
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      </div>{/* end integrations tab */}

      {/* ── DESIGN TAB ── */}
      <div className={settingsTab === 'design' ? 'space-y-3' : 'hidden'}>

      {/* ── Advanced Controls ── */}
      <AccordionItem value="advanced" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><PanelRight className="h-3.5 w-3.5" /></span>
            Advanced Controls
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <Label className="text-[12px] font-semibold text-indigo-800">Animations</Label>
                </div>
                <Switch checked={form.animations?.enabled ?? false} onCheckedChange={v => updateAnimations({ enabled: v })} />
              </div>
              <p className="text-[11px] text-indigo-600/70 leading-relaxed">Stage reveals, fading headers, polished feedback.</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-violet-500" />
                  <Label className="text-[12px] font-semibold text-violet-800">Premium Depth</Label>
                </div>
                <Switch checked={form.theme.formShadow === 'xl'} onCheckedChange={toggleProShadow} />
              </div>
              <p className="text-[11px] text-violet-600/70 leading-relaxed">Gallery-ready card shadow effect.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4">
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-4 w-4 text-slate-500" />
                  <Label className="text-[12px] font-semibold text-slate-700">Layout Mode</Label>
                </div>
                <Select value={form.layout ?? 'classic'} onValueChange={value => handleLayoutChange(value as FormConfig['layout'])}>
                  <SelectTrigger className="settings-input h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['classic', 'card', 'split-left', 'split-right', 'banner-top', 'floating', 'fullscreen'].map(layout => (
                      <SelectItem key={layout} value={layout}>{layout}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">Switch hero, floating, or split layouts.</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Colors & Branding ── */}
      <AccordionItem value="theme-basic" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Palette className="h-3.5 w-3.5" /></span>
            Colors & Branding
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          {/* Quick Theme Selection */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12.5px] font-bold text-indigo-800">Theme Gallery</p>
                <p className="text-[11px] text-indigo-600/70 mt-0.5">Apply polished color schemes instantly</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowThemeDialog(true)}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-0 shadow-sm shadow-indigo-500/20 text-white text-[12px] h-8 px-3 font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Browse
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Primary Color', key: 'primaryColor' as const },
              { label: 'Secondary Color', key: 'secondaryColor' as const },
              { label: 'Background', key: 'backgroundColor' as const },
              { label: 'Form Background', key: 'formBackgroundColor' as const },
              { label: 'Text Color', key: 'textColor' as const },
              { label: 'Label Color', key: 'labelColor' as const },
              { label: 'Input Border', key: 'inputBorderColor' as const },
              { label: 'Input Background', key: 'inputBackgroundColor' as const },
              { label: 'Button Text', key: 'buttonTextColor' as const },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1.5">
                <Label className="settings-label">{label}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.theme[key]}
                    onChange={e => updateTheme({ [key]: e.target.value })}
                    className="h-9 w-10 rounded-lg border border-border/60 cursor-pointer"
                  />
                  <Input value={form.theme[key]} onChange={e => updateTheme({ [key]: e.target.value })} className="font-mono text-xs flex-1 settings-input" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-slate-50/70 px-4 py-3">
            <Label className="text-sm font-medium">Show Logo</Label>
            <Switch checked={form.theme.showLogo} onCheckedChange={v => updateTheme({ showLogo: v })} />
          </div>
          {form.theme.showLogo && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="settings-label">Logo URL</Label>
                <Input value={form.theme.logoUrl || ''} onChange={e => updateTheme({ logoUrl: e.target.value })} placeholder="https://…" className="settings-input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="settings-label">Logo Size</Label>
                  <Input value={form.theme.logoMaxWidth || '72px'} onChange={e => updateTheme({ logoMaxWidth: e.target.value })} placeholder="72px" className="settings-input" />
                </div>
                <div className="space-y-2">
                  <Label className="settings-label">Top Padding</Label>
                  <Input value={form.theme.logoTopPadding || '16px'} onChange={e => updateTheme({ logoTopPadding: e.target.value })} placeholder="16px" className="settings-input" />
                </div>
                <div className="space-y-2">
                  <Label className="settings-label">Side Padding</Label>
                  <Input value={form.theme.logoSidePadding || '32px'} onChange={e => updateTheme({ logoSidePadding: e.target.value })} placeholder="32px" className="settings-input" />
                </div>
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* ── Dimensions & Layout ── */}
      <AccordionItem value="theme-dimensions" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Globe className="h-3.5 w-3.5" /></span>
            Dimensions & Layout
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <div className="space-y-2">
            <Label className="settings-label">Form Layout</Label>
            <Select value={form.theme.formLayout || 'single'} onValueChange={v => updateTheme({ formLayout: v as any })}>
              <SelectTrigger className="settings-input"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Column</SelectItem>
                <SelectItem value="two-column">Two Columns (Grid)</SelectItem>
                <SelectItem value="three-column">Three Columns (Grid)</SelectItem>
                <SelectItem value="custom">Custom (Per-field widths)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Form Width', key: 'formWidth' as const, ph: '100%' },
              { label: 'Max Width', key: 'formMaxWidth' as const, ph: '520px' },
              { label: 'Form Padding', key: 'formPadding' as const, ph: '32px' },
              { label: 'Input Padding', key: 'inputPadding' as const, ph: '14px 16px' },
              { label: 'Border Radius', key: 'borderRadius' as const, ph: '12px' },
              { label: 'Field Gap', key: 'fieldGap' as const, ph: '16px' },
              { label: 'Line Height', key: 'lineHeight' as const, ph: '1.6' },
            ].map(({ label, key, ph }) => (
              <div key={key} className="space-y-2">
                <Label className="settings-label">{label}</Label>
                <Input value={form.theme[key]} onChange={e => updateTheme({ [key]: e.target.value })} placeholder={ph} className="settings-input" />
              </div>
            ))}
            <div className="space-y-2">
              <Label className="settings-label">Form Shadow</Label>
              <Select value={form.theme.formShadow} onValueChange={v => updateTheme({ formShadow: v as any })}>
                <SelectTrigger className="settings-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="2xl">2XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Typography ── */}
      <AccordionItem value="theme-typography" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Type className="h-3.5 w-3.5" /></span>
            Typography
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <div className="space-y-2">
            <Label className="settings-label">Font Family</Label>
            <Input value={form.theme.fontFamily} onChange={e => updateTheme({ fontFamily: e.target.value })} className="font-mono text-sm settings-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="settings-label">Label Font Size</Label>
              <Input value={form.theme.labelFontSize} onChange={e => updateTheme({ labelFontSize: e.target.value })} placeholder="14px" className="settings-input" />
            </div>
            <div className="space-y-2">
              <Label className="settings-label">Input Font Size</Label>
              <Input value={form.theme.inputFontSize} onChange={e => updateTheme({ inputFontSize: e.target.value })} placeholder="15px" className="settings-input" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="settings-label">Header Font</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Size</Label>
                <Input value={form.theme.headerFontSize || '22px'} onChange={e => updateTheme({ headerFontSize: e.target.value })} placeholder="22px" className="settings-input" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Weight</Label>
                <Select value={form.theme.headerFontWeight || '700'} onValueChange={v => updateTheme({ headerFontWeight: v })}>
                  <SelectTrigger className="settings-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Light 300</SelectItem>
                    <SelectItem value="400">Regular 400</SelectItem>
                    <SelectItem value="500">Medium 500</SelectItem>
                    <SelectItem value="600">Semi Bold 600</SelectItem>
                    <SelectItem value="700">Bold 700</SelectItem>
                    <SelectItem value="800">Extra Bold 800</SelectItem>
                    <SelectItem value="900">Black 900</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Style</Label>
                <Select value={form.theme.headerFontStyle || 'normal'} onValueChange={v => updateTheme({ headerFontStyle: v as any })}>
                  <SelectTrigger className="settings-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="italic">Italic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Cursive Header Styling ── */}
          <div className="space-y-3 rounded-lg border border-violet-200/50 bg-violet-50/30 p-3">
            <div className="flex items-center justify-between">
              <Label className="settings-label flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" /> Cursive Header
              </Label>
              <Switch checked={form.theme.headerCursiveEnabled ?? false} onCheckedChange={v => updateTheme({ headerCursiveEnabled: v })} />
            </div>
            {form.theme.headerCursiveEnabled && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Cursive Font</Label>
                  <Select value={form.theme.headerCursiveFont || 'Great Vibes'} onValueChange={v => updateTheme({ headerCursiveFont: v })}>
                    <SelectTrigger className="settings-input"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Great Vibes">Great Vibes</SelectItem>
                      <SelectItem value="Brush Script MT">Brush Script</SelectItem>
                      <SelectItem value="Cursive">Cursive (System)</SelectItem>
                      <SelectItem value="Satisfy">Satisfy</SelectItem>
                      <SelectItem value="Dancing Script">Dancing Script</SelectItem>
                      <SelectItem value="Pacifico">Pacifico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Apply To</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['left', 'right', 'all'] as const).map(part => (
                      <button
                        key={part}
                        type="button"
                        onClick={() => updateTheme({ headerCursivePart: part })}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          (form.theme.headerCursivePart ?? 'all') === part
                            ? 'border-violet-500 bg-violet-100 text-violet-900'
                            : 'border-violet-200 bg-white text-violet-700 hover:bg-violet-50'
                        }`}
                      >
                        {part === 'left' && 'Left Half'}
                        {part === 'right' && 'Right Half'}
                        {part === 'all' && 'All Text'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Text Alignments ── */}
          <div className="space-y-2">
            <Label className="settings-label">Header &amp; Title Alignment</Label>
            <p className="text-[11px] text-muted-foreground">Controls form title, sub-header, description, logo container and footer.</p>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  type="button"
                  title={align.charAt(0).toUpperCase() + align.slice(1)}
                  onClick={() => updateTheme({ headerAlign: align })}
                  className={`flex-1 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
                    (form.theme.headerAlign ?? 'center') === align
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:bg-muted/40'
                  }`}
                >
                  {align === 'left'   && <AlignLeft   className="h-4 w-4" />}
                  {align === 'center' && <AlignCenter className="h-4 w-4" />}
                  {align === 'right'  && <AlignRight  className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="settings-label">Field Label Alignment</Label>
            <p className="text-[11px] text-muted-foreground">Controls the text alignment of all field labels in the form.</p>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  type="button"
                  title={align.charAt(0).toUpperCase() + align.slice(1)}
                  onClick={() => updateTheme({ labelAlign: align })}
                  className={`flex-1 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
                    (form.theme.labelAlign ?? 'left') === align
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:bg-muted/40'
                  }`}
                >
                  {align === 'left'   && <AlignLeft   className="h-4 w-4" />}
                  {align === 'center' && <AlignCenter className="h-4 w-4" />}
                  {align === 'right'  && <AlignRight  className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Form Layout ── */}
      <AccordionItem value="layout" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Monitor className="h-3.5 w-3.5" /></span>
            Form Layout
          </span>
          <Badge variant="secondary" className="ml-auto mr-2 text-[10px] capitalize">
            {form.layout ?? 'classic'}
          </Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <Label className="settings-label">Layout Style</Label>
          <div className="grid grid-cols-3 gap-2">
            {([
              {
                value: 'classic', label: 'Classic',
                thumb: <svg viewBox="0 0 48 36" className="w-full h-9"><rect width="48" height="36" rx="3" fill="#f1f5f9"/><rect x="10" y="6" width="28" height="24" rx="2" fill="white" stroke="#e2e8f0"/><rect x="16" y="10" width="16" height="2" rx="1" fill="#cbd5e1"/><rect x="14" y="14" width="20" height="1.5" rx="0.75" fill="#e2e8f0"/><rect x="14" y="17" width="20" height="1.5" rx="0.75" fill="#e2e8f0"/><rect x="14" y="22" width="20" height="4" rx="1" fill="#94a3b8"/></svg>
              },
              {
                value: 'card', label: 'Card',
                thumb: <svg viewBox="0 0 48 36" className="w-full h-9"><rect width="48" height="36" rx="3" fill="#e2e8f0"/><rect x="8" y="5" width="32" height="26" rx="3" fill="white"/><rect x="8" y="5" width="32" height="26" rx="3" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/><rect x="16" y="9" width="16" height="2" rx="1" fill="#cbd5e1"/><rect x="14" y="13" width="20" height="1.5" rx="0.75" fill="#e2e8f0"/><rect x="14" y="16" width="20" height="1.5" rx="0.75" fill="#e2e8f0"/><rect x="14" y="21" width="20" height="4" rx="1" fill="#6366f1"/></svg>
              },
              {
                value: 'split-left', label: 'Img Left',
                thumb: <svg viewBox="0 0 48 36" className="w-full h-9"><rect width="48" height="36" rx="3" fill="#f8fafc"/><rect width="22" height="36" rx="3" fill="#6366f1" opacity="0.7"/><rect x="25" y="6" width="20" height="24" rx="2" fill="white" stroke="#e2e8f0"/><rect x="28" y="10" width="14" height="1.5" rx="0.75" fill="#cbd5e1"/><rect x="28" y="13" width="14" height="1.5" rx="0.75" fill="#e2e8f0"/><rect x="28" y="22" width="14" height="4" rx="1" fill="#94a3b8"/></svg>
              },
              {
                value: 'split-right', label: 'Img Right',
                thumb: <svg viewBox="0 0 48 36" className="w-full h-9"><rect width="48" height="36" rx="3" fill="#f8fafc"/><rect x="3" y="6" width="20" height="24" rx="2" fill="white" stroke="#e2e8f0"/><rect x="6" y="10" width="14" height="1.5" rx="0.75" fill="#cbd5e1"/><rect x="6" y="13" width="14" height="1.5" rx="0.75" fill="#e2e8f0"/><rect x="6" y="22" width="14" height="4" rx="1" fill="#94a3b8"/><rect x="26" width="22" height="36" rx="3" fill="#6366f1" opacity="0.7"/></svg>
              },
              {
                value: 'banner-top', label: 'Banner',
                thumb: <svg viewBox="0 0 48 36" className="w-full h-9"><rect width="48" height="36" rx="3" fill="#f1f5f9"/><rect width="48" height="13" rx="3" fill="#6366f1" opacity="0.7"/><rect x="10" y="10" width="28" height="22" rx="2" fill="white" stroke="#e2e8f0"/><rect x="16" y="14" width="16" height="1.5" rx="0.75" fill="#cbd5e1"/><rect x="14" y="18" width="20" height="1.5" rx="0.75" fill="#e2e8f0"/><rect x="14" y="24" width="20" height="3.5" rx="1" fill="#94a3b8"/></svg>
              },
              {
                value: 'floating', label: 'Floating',
                thumb: <svg viewBox="0 0 48 36" className="w-full h-9"><rect width="48" height="36" rx="3" fill="#6366f1" opacity="0.35"/><rect width="48" height="36" rx="3" fill="none" stroke="#818cf8" strokeWidth="0.5"/><rect x="8" y="5" width="32" height="26" rx="3" fill="white" opacity="0.96"/><rect x="16" y="9" width="16" height="2" rx="1" fill="#cbd5e1"/><rect x="14" y="13" width="20" height="1.5" rx="0.75" fill="#e2e8f0"/><rect x="14" y="22" width="20" height="4" rx="1" fill="#6366f1"/></svg>
              },
              {
                value: 'fullscreen', label: 'Fullscreen',
                thumb: <svg viewBox="0 0 48 36" className="w-full h-9"><rect width="48" height="36" fill="white"/><rect x="8" y="6" width="32" height="4" rx="1" fill="#e2e8f0"/><rect x="8" y="12" width="32" height="2" rx="1" fill="#e2e8f0"/><rect x="8" y="16" width="32" height="2" rx="1" fill="#e2e8f0"/><rect x="8" y="23" width="32" height="7" rx="1.5" fill="#6366f1"/></svg>
              },
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleLayoutChange(opt.value as FormConfig['layout'])}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all cursor-pointer hover:border-primary/60 hover:bg-primary/5 overflow-hidden ${
                  (form.layout ?? 'classic') === opt.value
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                <div className="w-full rounded overflow-hidden">{opt.thumb}</div>
                <span className="text-[10px] font-semibold leading-tight mt-0.5">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Image URL — only for image-based layouts */}
          {['split-left', 'split-right', 'banner-top', 'floating'].includes(form.layout ?? '') && (
            <>
              {/* Panel Width */}
              <div className="space-y-3">
                <Label className="settings-label">Panel Width Split</Label>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-medium flex-1">🖼 Image panel</span>
                    <Input
                      type="number"
                      min={15} max={80}
                      value={form.layoutImagePanelWidth ?? 45}
                      onChange={e => onUpdate({ layoutImagePanelWidth: Math.min(80, Math.max(15, Number(e.target.value))) })}
                      className="settings-input w-20 text-center font-mono text-xs"
                    />
                    <span className="text-[11px] text-muted-foreground">%</span>
                  </div>
                  <Slider
                    value={[form.layoutImagePanelWidth ?? 45]}
                    min={15} max={80} step={1}
                    onValueChange={([v]) => onUpdate({ layoutImagePanelWidth: v })}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Form {100 - (form.layoutImagePanelWidth ?? 45)}%</span>
                    <span>Image {form.layoutImagePanelWidth ?? 45}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="settings-label">Background / Panel Image URL</Label>
                <Input
                  value={form.layoutImageUrl || ''}
                  onChange={e => onUpdate({ layoutImageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/…"
                  className="settings-input text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="settings-label">Image Fit</Label>
                <Select
                  value={form.layoutImageFit || 'cover'}
                  onValueChange={v => onUpdate({ layoutImageFit: v as any })}
                >
                  <SelectTrigger className="settings-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover — fill &amp; crop</SelectItem>
                    <SelectItem value="contain">Contain — show whole image</SelectItem>
                    <SelectItem value="fill">Fill — stretch to fit</SelectItem>
                    <SelectItem value="natural">Natural — original size</SelectItem>
                    <SelectItem value="zoom-in">Zoom In — 130%</SelectItem>
                    <SelectItem value="zoom-out">Zoom Out — 70%</SelectItem>
                    <SelectItem value="tile">Tile — repeat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image Position */}
              <div className="space-y-2">
                <Label className="settings-label">Image Position</Label>
                <p className="text-[11px] text-muted-foreground mb-2">Click on the grid or drag the preview point to position</p>
                {/* Interactive drag & drop position preview */}
                <div className="space-y-2">
                  <div 
                    className="relative w-full h-48 rounded-lg border-2 border-border/60 bg-gradient-to-br from-muted to-muted/50 overflow-hidden cursor-crosshair"
                    style={{
                      backgroundImage: form.layoutImageUrl ? `url(${form.layoutImageUrl})` : undefined,
                      backgroundSize: (form.layoutImageFit === 'cover' ? 'cover' : form.layoutImageFit === 'contain' ? 'contain' : 'cover'),
                      backgroundPosition: `${form.layoutImagePositionX ?? '50'}% ${form.layoutImagePositionY ?? '50'}%`,
                      backgroundRepeat: 'no-repeat'
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      onUpdate({ 
                        layoutImagePositionX: Math.round(Math.max(0, Math.min(100, x))).toString(),
                        layoutImagePositionY: Math.round(Math.max(0, Math.min(100, y))).toString()
                      });
                    }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget;
                      const x = ((e.clientX - rect.getBoundingClientRect().left) / rect.offsetWidth) * 100;
                      const y = ((e.clientY - rect.getBoundingClientRect().top) / rect.offsetHeight) * 100;
                      rect.style.setProperty('--cursor-x', x + '%');
                      rect.style.setProperty('--cursor-y', y + '%');
                    }}
                  >
                    {/* Visual position marker */}
                    <div 
                      className="absolute w-6 h-6 border-2 border-white rounded-full shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${form.layoutImagePositionX ?? '50'}%`,
                        top: `${form.layoutImagePositionY ?? '50'}%`,
                        boxShadow: '0 0 0 2px #000, 0 0 10px rgba(0,0,0,0.3)'
                      }}
                    >
                      <div className="absolute inset-1 rounded-full bg-primary/30" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Position: {form.layoutImagePositionX ?? '50'}% H, {form.layoutImagePositionY ?? '50'}% V
                  </p>
                </div>
                
                {/* Quick position grid */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Quick Select</p>
                  <div className="grid grid-cols-3 gap-1">
                    {([
                      { x: '0',  y: '0',   title: 'Top Left' },
                      { x: '50', y: '0',   title: 'Top Center' },
                      { x: '100',y: '0',   title: 'Top Right' },
                      { x: '0',  y: '50',  title: 'Middle Left' },
                      { x: '50', y: '50',  title: 'Center' },
                      { x: '100',y: '50',  title: 'Middle Right' },
                      { x: '0',  y: '100', title: 'Bottom Left' },
                      { x: '50', y: '100', title: 'Bottom Center' },
                      { x: '100',y: '100', title: 'Bottom Right' },
                    ] as const).map(pos => {
                      const active = (form.layoutImagePositionX ?? '50') === pos.x && (form.layoutImagePositionY ?? '50') === pos.y;
                      return (
                        <button
                          key={`${pos.x}-${pos.y}`}
                          type="button"
                          title={pos.title}
                          onClick={() => onUpdate({ layoutImagePositionX: pos.x, layoutImagePositionY: pos.y })}
                          className={`h-8 rounded-md border-2 flex items-center justify-center transition-all ${
                            active ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'
                          }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            active ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Fine-tune sliders */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-muted-foreground font-medium">Horizontal (X)</Label>
                      <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{form.layoutImagePositionX ?? '50'}%</span>
                    </div>
                    <Slider
                      value={[parseInt(form.layoutImagePositionX ?? '50')]}
                      min={0} max={100} step={1}
                      onValueChange={([v]) => onUpdate({ layoutImagePositionX: String(v) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-muted-foreground font-medium">Vertical (Y)</Label>
                      <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{form.layoutImagePositionY ?? '50'}%</span>
                    </div>
                    <Slider
                      value={[parseInt(form.layoutImagePositionY ?? '50')]}
                      min={0} max={100} step={1}
                      onValueChange={([v]) => onUpdate({ layoutImagePositionY: String(v) })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* ── Animations ── */}
      <AccordionItem value="animations" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Sparkles className="h-3.5 w-3.5" /></span>
            Animations
          </span>
          <Badge variant={form.animations?.enabled ? 'default' : 'secondary'} className="ml-auto mr-2 text-[10px]">
            {form.animations?.enabled ? 'On' : 'Off'}
          </Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-slate-50/70 px-4 py-3">
            <Label className="text-sm font-medium">Enable Animations</Label>
            <Switch
              checked={!!form.animations?.enabled}
              onCheckedChange={v => updateAnimations({ enabled: v })}
            />
          </div>

          {form.animations?.enabled && (
            <>
              {/* Per-element animation pickers */}
              {([
                { label: 'Logo', key: 'logo', icon: <Image className="h-3 w-3" />, options: [
                  { value: 'none', label: 'None' },
                  { value: 'fadeIn', label: '✶ Fade In' },
                  { value: 'zoomIn', label: '⊕ Zoom In' },
                  { value: 'spinIn', label: '↺ Spin In' },
                  { value: 'floatIn', label: '↟ Float In' },
                  { value: 'glowPulse', label: '✸ Glow Pulse' },
                  { value: 'revealClip', label: '▶ Clip Reveal' },
                ]},
                { label: 'Title & Sub-header', key: 'title', icon: <Type className="h-3 w-3" />, options: [
                  { value: 'none', label: 'None' },
                  { value: 'fadeIn', label: '✶ Fade In' },
                  { value: 'slideDown', label: '↓ Slide Down' },
                  { value: 'bounceIn', label: '◎ Bounce In' },
                  { value: 'typewriter', label: '▌ Typewriter' },
                  { value: 'splitReveal', label: '⇔ Split Reveal' },
                  { value: 'glitchIn', label: '⚡ Glitch In' },
                  { value: 'perspectiveFlip', label: '⟁ Perspective Flip' },
                ]},
                { label: 'Venue / Date Strip', key: 'header', icon: <Calendar className="h-3 w-3" />, options: [
                  { value: 'none', label: 'None' },
                  { value: 'fadeIn', label: '✶ Fade In' },
                  { value: 'slideDown', label: '↓ Slide Down' },
                  { value: 'expandIn', label: '⇔ Expand In' },
                  { value: 'blurIn', label: '◌ Blur In' },
                ]},
                { label: 'Form Fields', key: 'fields', icon: <Columns className="h-3 w-3" />, options: [
                  { value: 'none', label: 'None' },
                  { value: 'fadeIn', label: '✶ Fade In' },
                  { value: 'slideUp', label: '↑ Slide Up' },
                  { value: 'stagger', label: '≋ Stagger (one-by-one)' },
                  { value: 'cascadeIn', label: '⇒ Cascade In' },
                  { value: 'flipIn', label: '⟲ Flip In' },
                  { value: 'springIn', label: '⊙ Spring In' },
                ]},
                { label: 'Footer', key: 'footer', icon: <AlignLeft className="h-3 w-3" />, options: [
                  { value: 'none', label: 'None' },
                  { value: 'fadeIn', label: '✶ Fade In' },
                  { value: 'slideUp', label: '↑ Slide Up' },
                  { value: 'expandIn', label: '⇔ Expand In' },
                ]},
              ] as const).map(({ label, key, icon, options }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="settings-label flex items-center gap-1.5">{icon} {label}</Label>
                  <Select
                    value={(form.animations as any)?.[key] || 'none'}
                    onValueChange={v => updateAnimations({ [key]: v } as any)}
                  >
                    <SelectTrigger className="settings-input"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {/* Easing curve */}
              <div className="space-y-1.5">
                <Label className="settings-label flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> Easing Curve
                </Label>
                <Select
                  value={form.animations?.easing || 'spring'}
                  onValueChange={v => updateAnimations({ easing: v as any })}
                >
                  <SelectTrigger className="settings-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ease">Ease — smooth in &amp; out</SelectItem>
                    <SelectItem value="ease-out">Ease Out — fast start, decelerate</SelectItem>
                    <SelectItem value="ease-in-out">Ease In-Out — symmetric</SelectItem>
                    <SelectItem value="spring">Spring — subtle overshoot</SelectItem>
                    <SelectItem value="bounce">Bounce — elastic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="settings-label flex items-center justify-between">
                  Animation Duration
                  <span className="font-mono text-primary/80">{form.animations?.duration ?? 500}ms</span>
                </Label>
                <Slider
                  min={150}
                  max={1500}
                  step={50}
                  value={[form.animations?.duration ?? 500]}
                  onValueChange={([v]) => updateAnimations({ duration: v })}
                  className="mt-1"
                />
              </div>

              {/* Stagger delay */}
              {form.animations?.fields === 'stagger' && (
                <div className="space-y-2">
                  <Label className="settings-label flex items-center justify-between">
                    Stagger Delay (between fields)
                    <span className="font-mono text-primary/80">{form.animations?.staggerDelay ?? 80}ms</span>
                  </Label>
                  <Slider
                    min={20}
                    max={400}
                    step={20}
                    value={[form.animations?.staggerDelay ?? 80]}
                    onValueChange={([v]) => updateAnimations({ staggerDelay: v })}
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      </div>{/* end design tab */}

      {/* ── PUBLISH TAB ── */}
      <div className={settingsTab === 'publish' ? 'space-y-3' : 'hidden'}>

      {/* ── Deployment ── */}
      <AccordionItem value="deployment" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Globe className="h-3.5 w-3.5" /></span>
            Deployment
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <div className="space-y-1.5">
            <Label className="settings-label">Existing Vercel Project Domain</Label>
            <p className="text-xs text-muted-foreground leading-snug">
              Enter the domain of your existing Vercel project to deploy there instead of creating a new one. E.g. <span className="font-mono">mysite.vercel.app</span> or <span className="font-mono">mysite.com</span>.
            </p>
            <Input
              value={form.vercelProjectDomain || ''}
              onChange={e => onUpdate({ vercelProjectDomain: e.target.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') })}
              placeholder="mysite.vercel.app"
              className="settings-input font-mono text-xs"
            />
          </div>
          {form.deployedUrl && (
            <div className="space-y-1.5">
              <Label className="settings-label">Live URL</Label>
              <a
                href={form.deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary underline underline-offset-2 break-all hover:opacity-80"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                {form.deployedUrl}
              </a>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* ── Custom CSS ── */}
      <AccordionItem value="custom-css" className="settings-section">
        <AccordionTrigger className="settings-trigger">
          <span className="flex items-center gap-2.5">
            <span className="settings-icon-wrap"><Key className="h-3.5 w-3.5" /></span>
            Custom CSS
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 px-5 pb-6 pt-3">
          <Textarea
            value={form.theme.customCss || ''}
            onChange={e => updateTheme({ customCss: e.target.value })}
            rows={7}
            placeholder=".form-container { /* your styles */ }"
            className="settings-input font-mono text-xs"
          />
        </AccordionContent>
      </AccordionItem>

      </div>{/* end publish tab */}
    </Accordion>
    
    <ThemeSelectionDialog
      open={showThemeDialog}
      onClose={() => setShowThemeDialog(false)}
      onSelectTheme={handleSelectTheme}
      currentTheme={form.theme}
    />
    <HeroImagePickerDialog
      open={showHeroPicker}
      onOpenChange={setShowHeroPicker}
      initialPage={heroPickerInitialPage}
      pageCount={pageCount}
      pageHeroImages={form.pageHeroImages ?? {}}
      onSave={(updated) => onUpdate({ pageHeroImages: updated })}
    />
  </>
  );
}

