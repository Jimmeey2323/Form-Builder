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
import { FormField, FieldOption, ConditionalRule, FIELD_TYPE_LABELS, FieldType, DependentOptionsConfig, MomenceSearchConfig, MomenceSessionsConfig } from '@/types/formField';
import { Plus, Trash2, X, GitBranch, ChevronDown, ChevronUp, Eye, MapPin } from 'lucide-react';
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
  const [expandedOptionIndex, setExpandedOptionIndex] = useState<number | null>(null);
  const [newCustomSrcVal, setNewCustomSrcVal] = useState('');

  useEffect(() => {
    if (field) setDraft({ ...field });
  }, [field]);

  if (!field) return null;

  const update = (key: keyof FormField, value: any) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const hasOptions = ['select', 'radio', 'checkbox'].includes(draft.type || field.type);
  const isAdvanced = ['lookup', 'formula', 'conditional', 'dependent'].includes(draft.type || field.type);
  const isMomenceSearch  = (draft.type || field.type) === 'member-search';
  const isMomenceSession = (draft.type || field.type) === 'momence-sessions';

  const updateSession = (key: keyof MomenceSessionsConfig, value: any) => {
    update('momenceSessionsConfig', {
      ...(draft.momenceSessionsConfig || { dateRangeDays: 30, showDatePicker: true, allowMultiple: true }),
      [key]: value,
    });
  };

  const updateMomence = (key: keyof MomenceSearchConfig, value: any) => {
    update('momenceSearchConfig', {
      ...(draft.momenceSearchConfig || { hostId: 33905 }),
      [key]: value,
    });
  };

  const addOption = () => {
    const opts = [...(draft.options || [])];
    const idx = opts.length + 1;
    opts.push({ label: `Option ${idx}`, value: `option_${idx}` });
    update('options', opts);
  };

  const updateOption = (index: number, key: keyof FieldOption | string, value: any) => {
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
  const sourceField = otherFields.find(f => f.id === (draft.dependsOnFieldId || ''));
  const sourceHasOptions = !!(sourceField && ['select', 'radio', 'checkbox'].includes(sourceField.type) && (sourceField.options?.length ?? 0) > 0);

  // ─── Dependent Options Groups helpers ───────────────────────────────
  const sourceForGroups = draft.dependentOptionsConfig?.sourceFieldId
    ? otherFields.find(f => f.id === draft.dependentOptionsConfig!.sourceFieldId)
    : null;

  const sourceGroupValues: { label: string; value: string }[] = [
    ...(sourceForGroups?.options?.map(o => ({ label: o.label, value: o.value })) ?? []),
    ...(draft.dependentOptionsConfig?.customSourceValues?.map(v => ({ label: v, value: v })) ?? []),
  ];

  const toggleGroupOption = (sourceValue: string, optionValue: string) => {
    const config = draft.dependentOptionsConfig!;
    const groups = [...(config.groups || [])];
    const gi = groups.findIndex(g => g.sourceValue === sourceValue);
    if (gi === -1) {
      groups.push({ sourceValue, visibleOptionValues: [optionValue] });
    } else {
      const vals = [...groups[gi].visibleOptionValues];
      const vi = vals.indexOf(optionValue);
      if (vi === -1) vals.push(optionValue);
      else vals.splice(vi, 1);
      groups[gi] = { ...groups[gi], visibleOptionValues: vals };
    }
    update('dependentOptionsConfig', { ...config, groups });
  };

  const addCustomSourceValue = () => {
    const val = newCustomSrcVal.trim();
    if (!val) return;
    const config = draft.dependentOptionsConfig!;
    const existing = config.customSourceValues || [];
    if (!existing.includes(val)) {
      update('dependentOptionsConfig', { ...config, customSourceValues: [...existing, val] });
    }
    setNewCustomSrcVal('');
  };

  const removeCustomSourceValue = (val: string) => {
    const config = draft.dependentOptionsConfig!;
    update('dependentOptionsConfig', {
      ...config,
      customSourceValues: (config.customSourceValues || []).filter(v => v !== val),
      groups: config.groups.filter(g => g.sourceValue !== val),
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <div className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Field
              <Badge variant="secondary">{FIELD_TYPE_LABELS[draft.type as FieldType || field.type]}</Badge>
            </DialogTitle>
            <DialogDescription>Configure all properties for this form field.</DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              {hasOptions && <TabsTrigger value="options">Options</TabsTrigger>}
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              {isMomenceSearch  && <TabsTrigger value="momence">Momence</TabsTrigger>}
              {isMomenceSession && <TabsTrigger value="sessions">Sessions</TabsTrigger>}
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
                <p className="text-xs text-muted-foreground">
                  Add choices. Optionally, set a condition on each option to show it only when another field has a specific value.
                </p>
                <div className="space-y-3">
                  {(draft.options || []).map((opt, i) => (
                    <div key={i} className="rounded-lg border bg-card overflow-hidden">
                      {/* Option row */}
                      <div className="flex items-center gap-2 p-2">
                        <Input
                          value={opt.label}
                          onChange={e => updateOption(i, 'label', e.target.value)}
                          placeholder="Label"
                          className="flex-1 text-sm"
                        />
                        <Input
                          value={opt.value}
                          onChange={e => updateOption(i, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          variant={opt.conditionalRule ? 'default' : 'ghost'}
                          size="icon"
                          onClick={() => setExpandedOptionIndex(expandedOptionIndex === i ? null : i)}
                          className="h-8 w-8 shrink-0"
                          title="Set conditional visibility for this option"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeOption(i)} className="h-8 w-8 shrink-0 text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Address row — show full address below form when this option is selected */}
                      <div className="flex items-center gap-2 px-2 pb-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 ml-0.5" />
                        <Input
                          value={opt.address || ''}
                          onChange={e => updateOption(i, 'address', e.target.value)}
                          placeholder="Address shown on selection (optional)"
                          className="text-xs h-7 border-dashed"
                        />
                      </div>

                      {/* Conditional rule for this option */}
                      {expandedOptionIndex === i && (
                        <div className="border-t bg-muted/30 p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                              <GitBranch className="h-3 w-3" /> Conditional Visibility
                            </span>
                            {opt.conditionalRule && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-destructive"
                                onClick={() => updateOption(i, 'conditionalRule' as any, undefined)}
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">Show this option only when:</p>
                          <div className="grid grid-cols-3 gap-2">
                            <Select
                              value={opt.conditionalRule?.fieldId || ''}
                              onValueChange={v =>
                                updateOption(i, 'conditionalRule' as any, {
                                  ...(opt.conditionalRule || { operator: 'equals', value: '' }),
                                  fieldId: v,
                                })
                              }
                            >
                              <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Field…" /></SelectTrigger>
                              <SelectContent>
                                {otherFields.map(f => (
                                  <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={opt.conditionalRule?.operator || 'equals'}
                              onValueChange={v =>
                                updateOption(i, 'conditionalRule' as any, {
                                  ...(opt.conditionalRule || { fieldId: '', value: '' }),
                                  operator: v,
                                })
                              }
                            >
                              <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="not_equals">Not Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={opt.conditionalRule?.value || ''}
                              onChange={e =>
                                updateOption(i, 'conditionalRule' as any, {
                                  ...(opt.conditionalRule || { fieldId: '', operator: 'equals' }),
                                  value: e.target.value,
                                })
                              }
                              placeholder="Value"
                              className="text-xs h-8"
                            />
                          </div>
                          {opt.conditionalRule?.fieldId && (
                            <p className="text-[11px] text-primary/70">
                              ✓ This option is conditionally shown
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
                </Button>

                {/* ── Dependent Options Groups ────────────────────────────────── */}
                <div className="rounded-xl border-2 border-dashed border-primary/25 bg-primary/4 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <GitBranch className="h-3 w-3" /> Dependent Options
                    </p>
                    <Switch
                      checked={!!draft.dependentOptionsConfig}
                      onCheckedChange={on => update('dependentOptionsConfig', on
                        ? { sourceFieldId: '', groups: [], customSourceValues: [] }
                        : undefined
                      )}
                    />
                  </div>

                  {draft.dependentOptionsConfig && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Pick a field to watch. Then assign which options of <em>this</em> field should appear for each of its values.
                        Options not assigned to any group are always visible.
                      </p>

                      {/* Source field picker */}
                      <Select
                        value={draft.dependentOptionsConfig.sourceFieldId}
                        onValueChange={v => update('dependentOptionsConfig', {
                          ...draft.dependentOptionsConfig!,
                          sourceFieldId: v,
                          groups: [],
                          customSourceValues: [],
                        })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Watch which field…" />
                        </SelectTrigger>
                        <SelectContent>
                          {otherFields.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Groups matrix — rendered once source field is chosen */}
                      {draft.dependentOptionsConfig.sourceFieldId && (
                        <div className="space-y-2">
                          {sourceGroupValues.length === 0 && !sourceForGroups?.options?.length && (
                            <p className="text-[11px] text-muted-foreground italic">
                              The selected field has no predefined options. Add custom trigger values below.
                            </p>
                          )}

                          {sourceGroupValues.map(sv => {
                            const group = draft.dependentOptionsConfig!.groups.find(g => g.sourceValue === sv.value);
                            const selectedVals = group?.visibleOptionValues ?? [];
                            return (
                              <div key={sv.value} className="rounded-lg bg-card border border-border/70 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-semibold text-foreground/70">
                                    When = <span className="text-primary font-bold">"{sv.label}"</span>
                                  </p>
                                  {/* Only show × for custom values */}
                                  {(draft.dependentOptionsConfig!.customSourceValues || []).includes(sv.value) && (
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive"
                                      onClick={() => removeCustomSourceValue(sv.value)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>

                                {(draft.options || []).length === 0 ? (
                                  <p className="text-[10px] text-muted-foreground italic">Add options above first.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {(draft.options || []).map(opt => {
                                      const checked = selectedVals.includes(opt.value);
                                      return (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => toggleGroupOption(sv.value, opt.value)}
                                          className={`text-[11px] font-medium px-2.5 py-1 rounded-full border-2 transition-all cursor-pointer select-none ${
                                            checked
                                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                              : 'border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground bg-background'
                                          }`}
                                        >
                                          {opt.label || opt.value}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {selectedVals.length === 0 && (draft.options || []).length > 0 && (
                                  <p className="text-[10px] text-muted-foreground/60 italic">
                                    ⚠ No options assigned — all will be hidden when this value is selected.
                                  </p>
                                )}
                              </div>
                            );
                          })}

                          {/* Add custom trigger value — useful when source is a text / number field */}
                          {!sourceForGroups?.options?.length && (
                            <div className="flex gap-2 pt-1">
                              <Input
                                value={newCustomSrcVal}
                                onChange={e => setNewCustomSrcVal(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSourceValue())}
                                placeholder="Add trigger value (e.g. Yes)"
                                className="h-8 text-xs flex-1"
                              />
                              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addCustomSourceValue}>
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            <TabsContent value="advanced" className="space-y-4 mt-4">
              {/* ─── Convert to Dependent ─── */}
              {draft.type !== 'dependent' && draft.type !== 'conditional' && (
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5" /> Make this a Dependent Field
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A dependent field's value, visibility, or options are driven by another field's value.
                  </p>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => update('type', 'dependent')}>
                    Convert to Dependent
                  </Button>
                </div>
              )}

              {(draft.type === 'dependent' || draft.type === 'conditional') && (
                <div className="space-y-4">
                  {/* Source field */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source Field</Label>
                    <Select value={draft.dependsOnFieldId || ''} onValueChange={v => update('dependsOnFieldId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select the field to watch…" /></SelectTrigger>
                      <SelectContent>
                        {otherFields.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.label} <span className="text-muted-foreground">({f.name})</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">When this field's value changes, rules below are evaluated.</p>
                  </div>

                  {/* Value mapping table */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Value Mapping</Label>
                    <p className="text-[11px] text-muted-foreground">When source = (value), set this field's value to (mapped value).</p>
                    {Object.entries((draft.lookupConfig?.lookupData) || {}).map(([srcVal, mappedVal], i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-14 shrink-0">When =</span>
                        {sourceHasOptions ? (
                          <Select
                            value={srcVal}
                            onValueChange={newKey => {
                              const data = { ...(draft.lookupConfig?.lookupData || {}) };
                              delete data[srcVal];
                              data[newKey] = mappedVal;
                              update('lookupConfig', { sourceFieldId: draft.dependsOnFieldId || '', lookupData: data });
                            }}
                          >
                            <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Pick option…" /></SelectTrigger>
                            <SelectContent>
                              {sourceField!.options!.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={srcVal}
                            onChange={e => {
                              const data = { ...(draft.lookupConfig?.lookupData || {}) };
                              delete data[srcVal];
                              data[e.target.value] = mappedVal;
                              update('lookupConfig', { sourceFieldId: draft.dependsOnFieldId || '', lookupData: data });
                            }}
                            placeholder="Source value"
                            className="flex-1 font-mono text-xs"
                          />
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">→</span>
                        <Input
                          value={mappedVal}
                          onChange={e => {
                            const data = { ...(draft.lookupConfig?.lookupData || {}) };
                            data[srcVal] = e.target.value;
                            update('lookupConfig', { sourceFieldId: draft.dependsOnFieldId || '', lookupData: data });
                          }}
                          placeholder="Set value to"
                          className="flex-1 text-xs"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => {
                            const data = { ...(draft.lookupConfig?.lookupData || {}) };
                            delete data[srcVal];
                            update('lookupConfig', { sourceFieldId: draft.dependsOnFieldId || '', lookupData: data });
                          }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="h-7 text-xs"
                      onClick={() => {
                        const data = { ...(draft.lookupConfig?.lookupData || {}) };
                        const key = `value_${Object.keys(data).length + 1}`;
                        data[key] = '';
                        update('lookupConfig', { sourceFieldId: draft.dependsOnFieldId || '', lookupData: data });
                      }}>
                      <Plus className="h-3 w-3 mr-1" /> Add Mapping
                    </Button>
                  </div>

                  {/* Default value when no mapping matches */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Default Value (no match)</Label>
                    <Input
                      value={draft.defaultValue || ''}
                      onChange={e => update('defaultValue', e.target.value)}
                      placeholder="Shown when no mapping applies"
                      className="text-sm"
                    />
                  </div>

                  {/* Behavior */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">On Change Behavior</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between rounded-lg border p-2.5">
                        <Label className="text-xs">Read-only</Label>
                        <Switch checked={draft.isReadOnly ?? false} onCheckedChange={v => update('isReadOnly', v)} />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-2.5">
                        <Label className="text-xs">Auto-clear on change</Label>
                        <Switch
                          checked={draft.cssClass?.includes('auto-clear') ?? false}
                          onCheckedChange={v => update('cssClass', v ? ((draft.cssClass || '') + ' auto-clear').trim() : (draft.cssClass || '').replace('auto-clear', '').trim())}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formula field config */}
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

              {/* Lookup field config */}
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

              {!isAdvanced && draft.type !== 'dependent' && draft.type !== 'conditional' && (
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

            {isMomenceSearch && (
              <TabsContent value="momence" className="space-y-5 mt-4">
                <p className="text-sm text-muted-foreground">
                  Configure the Momence member search autocomplete behaviour.
                </p>

                {/* ── Location field → dynamic hostId ── */}
                <div className="space-y-2">
                  <Label className="font-semibold">Location field (drives hostId)</Label>
                  <p className="text-xs text-muted-foreground">
                    Select the form field whose value determines which Momence location to search.
                    If it contains <strong>kenkere</strong> or <strong>copper</strong> → host 33905 (Bengaluru), otherwise → 13752.
                  </p>
                  <Select
                    value={draft.momenceSearchConfig?.locationFieldName || '__none__'}
                    onValueChange={v => updateMomence('locationFieldName', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="— none (use static hostId) —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— none (use static host ID below) —</SelectItem>
                      {allFields.filter(f => f.id !== field.id).map(f => (
                        <SelectItem key={f.id} value={f.name}>{f.label} ({f.name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ── Fallback static Host ID ── */}
                <div className="space-y-2">
                  <Label>Fallback / static Host ID</Label>
                  <div className="flex gap-2">
                    <Select
                      value={[33905, 13752].includes(draft.momenceSearchConfig?.hostId ?? 33905)
                        ? String(draft.momenceSearchConfig?.hostId ?? 33905) : 'custom'}
                      onValueChange={v => { if (v !== 'custom') updateMomence('hostId', Number(v)); }}
                    >
                      <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="33905">33905 — Bengaluru / Kenkere</SelectItem>
                        <SelectItem value="13752">13752 — Alt location</SelectItem>
                        <SelectItem value="custom">Custom…</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="font-mono w-28"
                      value={draft.momenceSearchConfig?.hostId ?? 33905}
                      onChange={e => updateMomence('hostId', Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* ── Search placeholder ── */}
                <div className="space-y-2">
                  <Label>Search placeholder</Label>
                  <Input
                    value={draft.momenceSearchConfig?.searchPlaceholder ?? ''}
                    onChange={e => updateMomence('searchPlaceholder', e.target.value)}
                    placeholder="Type a name, email or phone…"
                  />
                </div>

                {/* ── Auto-fill info ── */}
                <div className="space-y-3">
                  <Label className="font-semibold">Auto-filled fields</Label>
                  <p className="text-xs text-muted-foreground">
                    When a member is selected all fields below are populated automatically.
                    They are inline sub-fields named <strong>{draft.name || field.name}_*</strong> — no manual mapping needed.
                  </p>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1 max-h-64 overflow-y-auto">
                    {([
                      ['first_name',                'First Name'],
                      ['last_name',                 'Last Name'],
                      ['email',                     'Email'],
                      ['phone',                     'Phone'],
                      ['sessions_booked',           'Sessions Booked'],
                      ['sessions_checked_in',       'Sessions Checked-In'],
                      ['late_cancelled',            'Late Cancelled'],
                      ['home_location',             'Home Location'],
                      ['tags',                      'Tags'],
                      ['customer_tags',             'Customer Tags'],
                      ['first_seen',                'First Seen'],
                      ['last_seen',                 'Last Seen'],
                      ['total_visits',              'Total Visits'],
                      ['active_membership',         'Active Membership'],
                      ['membership_type',           'Membership Type'],
                      ['membership_end_date',       'Membership End Date'],
                      ['membership_sessions_used',  'Sessions Used'],
                      ['membership_sessions_limit', 'Sessions Limit'],
                      ['membership_frozen',         'Membership Frozen'],
                      ['recent_sessions_count',     'Recent Sessions Count'],
                      ['last_session_name',         'Last Session Name'],
                      ['last_session_date',         'Last Session Date'],
                    ] as [string, string][]).map(([suffix, lbl]) => (
                      <div key={suffix} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-muted-foreground">{lbl}</span>
                        <code className="font-mono text-primary bg-primary/8 px-1.5 py-0.5 rounded text-[11px]">
                          {(draft.name || field.name)}_{suffix}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}
            {isMomenceSession && (
              <TabsContent value="sessions" className="space-y-5 mt-4">
                <p className="text-sm text-muted-foreground">
                  Configure how sessions are fetched from Momence and displayed to the user.
                </p>

                {/* Date range days */}
                <div className="space-y-2">
                  <Label className="font-semibold">Default date range (days)</Label>
                  <p className="text-xs text-muted-foreground">
                    Number of days ahead to look for sessions when no date picker is shown, or as the default range.
                  </p>
                  <Input
                    type="number" min={1} max={365}
                    value={draft.momenceSessionsConfig?.dateRangeDays ?? 30}
                    onChange={e => updateSession('dateRangeDays', Number(e.target.value))}
                    className="w-32"
                  />
                </div>

                {/* Show date picker */}
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Show date range picker</Label>
                    <p className="text-xs text-muted-foreground">
                      Let users choose a custom start/end date before loading sessions.
                    </p>
                  </div>
                  <Switch
                    checked={draft.momenceSessionsConfig?.showDatePicker ?? true}
                    onCheckedChange={v => updateSession('showDatePicker', v)}
                  />
                </div>

                {/* Allow multiple */}
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Allow multiple selections</Label>
                    <p className="text-xs text-muted-foreground">
                      When enabled users can select more than one session (checkboxes). Otherwise single selection (radio).
                    </p>
                  </div>
                  <Switch
                    checked={draft.momenceSessionsConfig?.allowMultiple ?? true}
                    onCheckedChange={v => updateSession('allowMultiple', v)}
                  />
                </div>

                {/* ── Auto-fill info ── */}
                <div className="space-y-3">
                  <Label className="font-semibold">Auto-filled fields</Label>
                  <p className="text-xs text-muted-foreground">
                    When a session is selected all fields below are populated automatically.
                    They are inline sub-fields named <strong>{draft.name || field.name}_*</strong> — no manual mapping needed.
                    For multi-select, values are comma-separated.
                  </p>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1 max-h-72 overflow-y-auto">
                    {([
                      ['session_name',        'Session Name'],
                      ['session_start',       'Start Time'],
                      ['session_end',         'End Time'],
                      ['duration_min',        'Duration (min)'],
                      ['instructor',          'Instructor'],
                      ['location',            'Location'],
                      ['level',               'Level'],
                      ['category',            'Category'],
                      ['capacity',            'Capacity'],
                      ['spots_left',          'Spots Left'],
                      ['booked_count',        'Booked Count'],
                      ['late_cancelled',      'Late Cancelled'],
                      ['price',               'Price'],
                      ['is_recurring',        'Is Recurring'],
                      ['is_in_person',        'Is In-Person'],
                      ['description',         'Description'],
                      ['tags',                'Tags'],
                      ['teacher_email',       'Teacher Email'],
                      ['original_teacher',    'Original Teacher'],
                      ['additional_teachers', 'Additional Teachers'],
                      ['waitlist_capacity',   'Waitlist Capacity'],
                      ['waitlist_booked',     'Waitlist Booked'],
                      ['zoom_link',           'Zoom Link'],
                      ['online_stream_url',   'Online Stream URL'],
                    ] as [string, string][]).map(([suffix, lbl]) => (
                      <div key={suffix} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-muted-foreground">{lbl}</span>
                        <code className="font-mono text-primary bg-primary/8 px-1.5 py-0.5 rounded text-[11px]">
                          {(draft.name || field.name)}_{suffix}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border/50 shrink-0">
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(draft); onClose(); }}>Save Changes</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
