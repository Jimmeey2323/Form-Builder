import { FormConfig, WebhookConfig, PixelConfig } from '@/types/formField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ExternalLink, Loader2, Sheet } from 'lucide-react';
import { useState } from 'react';

interface FormSettingsPanelProps {
  form: FormConfig;
  onUpdate: (updates: Partial<FormConfig>) => void;
  onCreateSheet?: () => void;
  isCreatingSheet?: boolean;
}

export function FormSettingsPanel({ form, onUpdate, onCreateSheet, isCreatingSheet }: FormSettingsPanelProps) {
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderVal, setNewHeaderVal] = useState('');

  const updateTheme = (updates: Partial<FormConfig['theme']>) => {
    onUpdate({ theme: { ...form.theme, ...updates } });
  };

  const updateWebhook = (updates: Partial<WebhookConfig>) => {
    onUpdate({ webhookConfig: { ...form.webhookConfig, ...updates } });
  };

  const updatePixels = (updates: Partial<PixelConfig>) => {
    onUpdate({ pixelConfig: { ...form.pixelConfig, ...updates } });
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
    <Accordion type="multiple" defaultValue={['general', 'webhook', 'pixels', 'google-sheets', 'theme-basic']} className="space-y-2">
      {/* General */}
      <AccordionItem value="general" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">General Settings</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label>Form Title</Label>
            <Input value={form.title} onChange={e => onUpdate({ title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Submit Button Text</Label>
              <Input value={form.submitButtonText} onChange={e => onUpdate({ submitButtonText: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Success Message</Label>
              <Input value={form.successMessage} onChange={e => onUpdate({ successMessage: e.target.value })} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Webhook */}
      <AccordionItem value="webhook" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          Webhook Configuration
          <Badge variant={form.webhookConfig.enabled ? 'default' : 'secondary'} className="ml-2 text-[10px]">
            {form.webhookConfig.enabled ? 'Active' : 'Off'}
          </Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">Enable Webhook</Label>
            <Switch checked={form.webhookConfig.enabled} onCheckedChange={v => updateWebhook({ enabled: v })} />
          </div>
          {form.webhookConfig.enabled && (
            <>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input value={form.webhookConfig.url} onChange={e => updateWebhook({ url: e.target.value })} placeholder="https://api.example.com/submit" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={form.webhookConfig.method} onValueChange={v => updateWebhook({ method: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Token</Label>
                  <Input value={form.webhookConfig.token || ''} onChange={e => updateWebhook({ token: e.target.value })} placeholder="Auth token" />
                </div>
                <div className="space-y-2">
                  <Label>Source ID</Label>
                  <Input value={form.webhookConfig.sourceId || ''} onChange={e => updateWebhook({ sourceId: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Redirect URL (after submit)</Label>
                <Input value={form.webhookConfig.redirectUrl || ''} onChange={e => updateWebhook({ redirectUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm">Include UTM Parameters</Label>
                <Switch checked={form.webhookConfig.includeUtmParams} onCheckedChange={v => updateWebhook({ includeUtmParams: v })} />
              </div>
              <div className="space-y-2">
                <Label>Custom Headers</Label>
                {Object.entries(form.webhookConfig.headers).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <code className="bg-muted px-2 py-1 rounded text-xs flex-1 truncate">{key}</code>
                    <code className="bg-muted px-2 py-1 rounded text-xs flex-1 truncate">{val}</code>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeHeader(key)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={newHeaderKey} onChange={e => setNewHeaderKey(e.target.value)} placeholder="Header name" className="flex-1 text-sm" />
                  <Input value={newHeaderVal} onChange={e => setNewHeaderVal(e.target.value)} placeholder="Value" className="flex-1 text-sm" />
                  <Button variant="outline" size="icon" className="shrink-0" onClick={addHeader}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Tracking Pixels */}
      <AccordionItem value="pixels" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Tracking Pixels</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label>Snap Pixel ID</Label>
            <Input value={form.pixelConfig.snapPixelId || ''} onChange={e => updatePixels({ snapPixelId: e.target.value })} placeholder="e.g. 5217a3a7-..." />
          </div>
          <div className="space-y-2">
            <Label>Meta (Facebook) Pixel ID</Label>
            <Input value={form.pixelConfig.metaPixelId || ''} onChange={e => updatePixels({ metaPixelId: e.target.value })} placeholder="e.g. 527819981439695" />
          </div>
          <div className="space-y-2">
            <Label>Google Ads ID</Label>
            <Input value={form.pixelConfig.googleAdsId || ''} onChange={e => updatePixels({ googleAdsId: e.target.value })} placeholder="e.g. AW-809104648" />
          </div>
          <div className="space-y-2">
            <Label>Google Ads Conversion Label</Label>
            <Input value={form.pixelConfig.googleAdsConversionLabel || ''} onChange={e => updatePixels({ googleAdsConversionLabel: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Custom Tracking Scripts</Label>
            <Textarea value={form.pixelConfig.customScripts || ''} onChange={e => updatePixels({ customScripts: e.target.value })} rows={4} placeholder="Paste any custom tracking scripts here..." className="font-mono text-xs" />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Google Sheets */}
      <AccordionItem value="google-sheets" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          Google Sheets
          <Badge variant={form.googleSheetsConfig.enabled ? 'default' : 'secondary'} className="ml-2 text-[10px]">
            {form.googleSheetsConfig.spreadsheetId ? 'Connected' : form.googleSheetsConfig.enabled ? 'Pending' : 'Off'}
          </Badge>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">Record Submissions to Google Sheets</Label>
            <Switch checked={form.googleSheetsConfig.enabled} onCheckedChange={v => onUpdate({ googleSheetsConfig: { ...form.googleSheetsConfig, enabled: v } })} />
          </div>
          {form.googleSheetsConfig.enabled && (
            <>
              {sheetUrl ? (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Sheet className="h-4 w-4 text-primary" />
                    <span className="font-medium">Spreadsheet connected</span>
                  </div>
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline flex items-center gap-1"
                  >
                    Open Google Sheet <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <Button onClick={onCreateSheet} disabled={isCreatingSheet} className="w-full">
                  {isCreatingSheet ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sheet className="h-4 w-4 mr-2" />
                  )}
                  {isCreatingSheet ? 'Creating Spreadsheet...' : 'Create Spreadsheet & Connect'}
                </Button>
              )}
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Theme - Colors */}
      <AccordionItem value="theme-basic" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Colors & Branding</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
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
                <Label className="text-xs">{label}</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.theme[key]} onChange={e => updateTheme({ [key]: e.target.value })} className="h-8 w-10 rounded border cursor-pointer" />
                  <Input value={form.theme[key]} onChange={e => updateTheme({ [key]: e.target.value })} className="font-mono text-xs flex-1" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">Show Logo</Label>
            <Switch checked={form.theme.showLogo} onCheckedChange={v => updateTheme({ showLogo: v })} />
          </div>
          {form.theme.showLogo && (
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={form.theme.logoUrl || ''} onChange={e => updateTheme({ logoUrl: e.target.value })} placeholder="https://..." />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Theme - Dimensions */}
      <AccordionItem value="theme-dimensions" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Dimensions & Layout</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Form Width</Label>
              <Input value={form.theme.formWidth} onChange={e => updateTheme({ formWidth: e.target.value })} placeholder="100%" />
            </div>
            <div className="space-y-2">
              <Label>Max Width</Label>
              <Input value={form.theme.formMaxWidth} onChange={e => updateTheme({ formMaxWidth: e.target.value })} placeholder="520px" />
            </div>
            <div className="space-y-2">
              <Label>Form Padding</Label>
              <Input value={form.theme.formPadding} onChange={e => updateTheme({ formPadding: e.target.value })} placeholder="32px" />
            </div>
            <div className="space-y-2">
              <Label>Input Padding</Label>
              <Input value={form.theme.inputPadding} onChange={e => updateTheme({ inputPadding: e.target.value })} placeholder="14px 16px" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Border Radius</Label>
              <Input value={form.theme.borderRadius} onChange={e => updateTheme({ borderRadius: e.target.value })} placeholder="12px" />
            </div>
            <div className="space-y-2">
              <Label>Form Shadow</Label>
              <Select value={form.theme.formShadow} onValueChange={v => updateTheme({ formShadow: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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

      {/* Typography */}
      <AccordionItem value="theme-typography" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Typography</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Input value={form.theme.fontFamily} onChange={e => updateTheme({ fontFamily: e.target.value })} className="font-mono text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Label Font Size</Label>
              <Input value={form.theme.labelFontSize} onChange={e => updateTheme({ labelFontSize: e.target.value })} placeholder="14px" />
            </div>
            <div className="space-y-2">
              <Label>Input Font Size</Label>
              <Input value={form.theme.inputFontSize} onChange={e => updateTheme({ inputFontSize: e.target.value })} placeholder="15px" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Custom CSS */}
      <AccordionItem value="custom-css" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">Custom CSS</AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <Textarea
            value={form.theme.customCss || ''}
            onChange={e => updateTheme({ customCss: e.target.value })}
            rows={6}
            placeholder=".form-container { /* your styles */ }"
            className="font-mono text-xs"
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
