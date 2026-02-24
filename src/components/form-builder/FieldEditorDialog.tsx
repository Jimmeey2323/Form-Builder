import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField, FieldOption, ConditionalRule, FIELD_TYPE_LABELS, FieldType } from '@/types/formField';
import { Plus, Trash2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FieldEditorDialogProps {
  field: FormField | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<FormField>) => void;
  allFields: FormField[];
}

export function FieldEditorDialog({ field, open, onClose, onSave, allFields }: FieldEditorDialogProps) {
  const [draft, setDraft] = useState<Partial<FormField>>({});

  useEffect(() => {
    if (field) setDraft({ ...field });
  }, [field]);

  if (!field) return null;

  const update = (key: keyof FormField, value: any) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const hasOptions = ['select', 'radio', 'checkbox'].includes(draft.type || field.type);
  const isAdvanced = ['lookup', 'formula', 'conditional', 'dependent'].includes(draft.type || field.type);

  const addOption = () => {
    const opts = [...(draft.options || [])];
    const idx = opts.length + 1;
    opts.push({ label: `Option ${idx}`, value: `option_${idx}` });
    update('options', opts);
  };

  const updateOption = (index: number, key: keyof FieldOption, value: string) => {
    const opts = [...(draft.options || [])];
    opts[index] = { ...opts[index], [key]: value };
    update('options', opts);
  };

  const removeOption = (index: number) => {
    const opts = [...(draft.options || [])];
    opts.splice(index, 1);
    update('options', opts);
  };

  const addConditionalRule = () => {
    const rules: ConditionalRule[] = [...(draft.conditionalRules || [])];
    rules.push({
      dependsOnFieldId: '',
      operator: 'equals',
      value: '',
      action: 'show',
    });
    update('conditionalRules', rules);
  };

  const updateRule = (index: number, key: keyof ConditionalRule, value: string) => {
    const rules = [...(draft.conditionalRules || [])];
    rules[index] = { ...rules[index], [key]: value };
    update('conditionalRules', rules);
  };

  const removeRule = (index: number) => {
    const rules = [...(draft.conditionalRules || [])];
    rules.splice(index, 1);
    update('conditionalRules', rules);
  };

  const addLookupEntry = () => {
    const config = draft.lookupConfig || { sourceFieldId: '', lookupData: {} };
    const key = `key_${Object.keys(config.lookupData).length + 1}`;
    config.lookupData[key] = `Value ${Object.keys(config.lookupData).length + 1}`;
    update('lookupConfig', { ...config });
  };

  const otherFields = allFields.filter(f => f.id !== field.id);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Field
            <Badge variant="secondary">{FIELD_TYPE_LABELS[draft.type as FieldType || field.type]}</Badge>
          </DialogTitle>
          <DialogDescription>Configure all properties for this form field.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              {hasOptions && <TabsTrigger value="options">Options</TabsTrigger>}
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={draft.label || ''} onChange={e => update('label', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Field Name (HTML name)</Label>
                  <Input value={draft.name || ''} onChange={e => update('name', e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field ID</Label>
                  <Input value={draft.id || ''} onChange={e => update('id', e.target.value)} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={draft.type || field.type} onValueChange={v => update('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FIELD_TYPE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input value={draft.placeholder || ''} onChange={e => update('placeholder', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Default Value</Label>
                <Input value={draft.defaultValue || ''} onChange={e => update('defaultValue', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Help Text</Label>
                <Input value={draft.helpText || ''} onChange={e => update('helpText', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Autocomplete</Label>
                <Input value={draft.autocomplete || ''} onChange={e => update('autocomplete', e.target.value)} placeholder="e.g. given-name, email, tel" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label className="text-sm">Required</Label>
                  <Switch checked={draft.isRequired ?? false} onCheckedChange={v => update('isRequired', v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label className="text-sm">Hidden</Label>
                  <Switch checked={draft.isHidden ?? false} onCheckedChange={v => update('isHidden', v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label className="text-sm">Read Only</Label>
                  <Switch checked={draft.isReadOnly ?? false} onCheckedChange={v => update('isReadOnly', v)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label className="text-sm">Disabled</Label>
                  <Switch checked={draft.isDisabled ?? false} onCheckedChange={v => update('isDisabled', v)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="validation" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Length</Label>
                  <Input type="number" value={draft.minLength ?? ''} onChange={e => update('minLength', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Length</Label>
                  <Input type="number" value={draft.maxLength ?? ''} onChange={e => update('maxLength', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min Value</Label>
                  <Input type="number" value={draft.min ?? ''} onChange={e => update('min', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Value</Label>
                  <Input type="number" value={draft.max ?? ''} onChange={e => update('max', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-2">
                  <Label>Step</Label>
                  <Input type="number" value={draft.step ?? ''} onChange={e => update('step', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pattern (Regex)</Label>
                <Input value={draft.pattern || ''} onChange={e => update('pattern', e.target.value)} placeholder="e.g. [0-9]{10}" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>File Accept (MIME types)</Label>
                <Input value={draft.accept || ''} onChange={e => update('accept', e.target.value)} placeholder="e.g. image/*,.pdf" />
              </div>
            </TabsContent>

            {hasOptions && (
              <TabsContent value="options" className="space-y-4 mt-4">
                <div className="space-y-2">
                  {(draft.options || []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={opt.label}
                        onChange={e => updateOption(i, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Input
                        value={opt.value}
                        onChange={e => updateOption(i, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 font-mono text-sm"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeOption(i)} className="h-8 w-8 shrink-0 text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
                </Button>
              </TabsContent>
            )}

            <TabsContent value="advanced" className="space-y-4 mt-4">
              {(draft.type === 'dependent' || field.type === 'dependent') && (
                <div className="space-y-2">
                  <Label>Depends On Field</Label>
                  <Select value={draft.dependsOnFieldId || ''} onValueChange={v => update('dependsOnFieldId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select parent field" /></SelectTrigger>
                    <SelectContent>
                      {otherFields.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.label} ({f.name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(draft.type === 'formula' || field.type === 'formula') && (
                <div className="space-y-2">
                  <Label>Formula Expression</Label>
                  <Textarea
                    value={draft.formulaConfig?.expression || ''}
                    onChange={e => update('formulaConfig', { ...draft.formulaConfig, expression: e.target.value, referencedFieldIds: [] })}
                    placeholder="e.g. {field_1} + {field_2} * 0.18"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Use {'{field_name}'} to reference other fields. Supports +, -, *, /</p>
                </div>
              )}

              {(draft.type === 'lookup' || field.type === 'lookup') && (
                <div className="space-y-3">
                  <Label>Lookup Source Field</Label>
                  <Select
                    value={draft.lookupConfig?.sourceFieldId || ''}
                    onValueChange={v => update('lookupConfig', { ...draft.lookupConfig, sourceFieldId: v, lookupData: draft.lookupConfig?.lookupData || {} })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {otherFields.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label>Lookup Data (Key → Display)</Label>
                  {Object.entries(draft.lookupConfig?.lookupData || {}).map(([key, val], i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={key}
                        onChange={e => {
                          const data = { ...draft.lookupConfig?.lookupData };
                          delete data[key];
                          data[e.target.value] = val;
                          update('lookupConfig', { ...draft.lookupConfig, lookupData: data });
                        }}
                        placeholder="Key"
                        className="flex-1 font-mono text-sm"
                      />
                      <Input
                        value={val}
                        onChange={e => {
                          const data = { ...draft.lookupConfig?.lookupData };
                          data[key] = e.target.value;
                          update('lookupConfig', { ...draft.lookupConfig, lookupData: data });
                        }}
                        placeholder="Display value"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => {
                        const data = { ...draft.lookupConfig?.lookupData };
                        delete data[key];
                        update('lookupConfig', { ...draft.lookupConfig, lookupData: data });
                      }} className="h-8 w-8 text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addLookupEntry}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Entry
                  </Button>
                </div>
              )}

              {!isAdvanced && (
                <p className="text-sm text-muted-foreground py-4">
                  Switch this field's type to Lookup, Formula, Conditional, or Dependent to see advanced configuration options.
                </p>
              )}
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Add rules to show/hide this field based on other field values.
              </p>
              {(draft.conditionalRules || []).map((rule, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Rule {i + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeRule(i)} className="h-6 w-6 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={rule.dependsOnFieldId} onValueChange={v => updateRule(i, 'dependsOnFieldId', v)}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="When field..." /></SelectTrigger>
                      <SelectContent>
                        {otherFields.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={rule.operator} onValueChange={v => updateRule(i, 'operator', v)}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="is_empty">Is Empty</SelectItem>
                        <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={rule.value}
                      onChange={e => updateRule(i, 'value', e.target.value)}
                      placeholder="Value"
                      className="text-sm"
                    />
                    <Select value={rule.action} onValueChange={v => updateRule(i, 'action', v)}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="show">Show this field</SelectItem>
                        <SelectItem value="hide">Hide this field</SelectItem>
                        <SelectItem value="require">Make required</SelectItem>
                        <SelectItem value="set_value">Set value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addConditionalRule}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Condition
              </Button>
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Width</Label>
                <Select value={draft.width || '100'} onValueChange={v => update('width', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="33">33%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="66">66%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CSS Class</Label>
                <Input value={draft.cssClass || ''} onChange={e => update('cssClass', e.target.value)} placeholder="custom-class" />
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(draft); onClose(); }}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
