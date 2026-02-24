import { FormConfig } from '@/types/formField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface FormSettingsPanelProps {
  form: FormConfig;
  onUpdate: (updates: Partial<FormConfig>) => void;
}

export function FormSettingsPanel({ form, onUpdate }: FormSettingsPanelProps) {
  return (
    <div className="space-y-5 p-1">
      <div className="space-y-2">
        <Label>Form Title</Label>
        <Input
          value={form.title}
          onChange={e => onUpdate({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description || ''}
          onChange={e => onUpdate({ description: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Submit Button Text</Label>
        <Input
          value={form.submitButtonText}
          onChange={e => onUpdate({ submitButtonText: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Success Message</Label>
        <Input
          value={form.successMessage}
          onChange={e => onUpdate({ successMessage: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Redirect URL (optional)</Label>
        <Input
          value={form.redirectUrl || ''}
          onChange={e => onUpdate({ redirectUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="border-t pt-4 space-y-4">
        <h4 className="text-sm font-semibold">Theme</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.theme.primaryColor}
                onChange={e => onUpdate({ theme: { ...form.theme, primaryColor: e.target.value } })}
                className="h-9 w-12 rounded border cursor-pointer"
              />
              <Input
                value={form.theme.primaryColor}
                onChange={e => onUpdate({ theme: { ...form.theme, primaryColor: e.target.value } })}
                className="font-mono text-sm flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.theme.secondaryColor}
                onChange={e => onUpdate({ theme: { ...form.theme, secondaryColor: e.target.value } })}
                className="h-9 w-12 rounded border cursor-pointer"
              />
              <Input
                value={form.theme.secondaryColor}
                onChange={e => onUpdate({ theme: { ...form.theme, secondaryColor: e.target.value } })}
                className="font-mono text-sm flex-1"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Input
            value={form.theme.fontFamily}
            onChange={e => onUpdate({ theme: { ...form.theme, fontFamily: e.target.value } })}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label>Border Radius</Label>
          <Input
            value={form.theme.borderRadius}
            onChange={e => onUpdate({ theme: { ...form.theme, borderRadius: e.target.value } })}
            placeholder="12px"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label className="text-sm">Show Logo</Label>
          <Switch
            checked={form.theme.showLogo}
            onCheckedChange={v => onUpdate({ theme: { ...form.theme, showLogo: v } })}
          />
        </div>
        {form.theme.showLogo && (
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={form.theme.logoUrl || ''}
              onChange={e => onUpdate({ theme: { ...form.theme, logoUrl: e.target.value } })}
              placeholder="https://..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
