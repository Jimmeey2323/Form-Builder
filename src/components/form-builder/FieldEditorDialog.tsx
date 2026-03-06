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
import { FormField, FieldOption, ConditionalRule, FIELD_TYPE_LABELS, FieldType, DependentOptionsConfig, MomenceSearchConfig, MomenceSessionsConfig, AppointmentSlotsConfig, AppointmentInterval, AppointmentVacation, AppointmentSlot, AppointmentSlotExclusion, EmailOtpConfig } from '@/types/formField';
import { Plus, Trash2, X, GitBranch, ChevronDown, ChevronUp, Eye, MapPin } from 'lucide-react';

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
  const [newIntervalFrom, setNewIntervalFrom] = useState('09:00');
  const [newIntervalTo, setNewIntervalTo] = useState('17:00');
  const [newIntervalDays, setNewIntervalDays] = useState('Weekdays');
  const [newIntervalSpecificDate, setNewIntervalSpecificDate] = useState('');
  const [newIntervalUseSpecificDate, setNewIntervalUseSpecificDate] = useState(false);
  const [newVacStart, setNewVacStart] = useState('');
  const [newVacEnd, setNewVacEnd] = useState('');
  const [excludedSlotDate, setExcludedSlotDate] = useState(new Date().toISOString().slice(0, 10));
  const [excludedSlotTime, setExcludedSlotTime] = useState('12:00');
  const [slotPreviewDate, setSlotPreviewDate] = useState(new Date().toISOString().slice(0, 10));

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
  const isAppointmentSlots = (draft.type || field.type) === 'appointment-slots';
  const isEmailOtp = (draft.type || field.type) === 'email-otp';

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

  const updateAppointment = (updates: Partial<AppointmentSlotsConfig>) => {
    const existing = draft.appointmentSlotsConfig || {};
    update('appointmentSlotsConfig', { ...existing, ...updates });
  };

  const timeToMinutes = (value: string) => {
    const [hours, minutes = '0'] = (value || '00:00').split(':');
    return Number(hours) * 60 + Number(minutes);
  };

  const minutesToTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const dayMatchesInterval = (dayRule: string, dayOfWeek: number) => {
    if (dayRule === 'Every Day') return true;
    if (dayRule === 'Weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (dayRule === 'Weekends') return dayOfWeek === 0 || dayOfWeek === 6;
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return dayMap[dayRule] === dayOfWeek;
  };

  const isExcludedIntervalSlot = (date: string, startTime: string) => {
    return (draft.appointmentSlotsConfig?.excludedSlots || []).some(slot => slot.date === date && slot.startTime === startTime);
  };

  const getGeneratedSlotsForDate = (date: string) => {
    if (!date) return [];
    const cfg = draft.appointmentSlotsConfig || {};
    const candidate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(candidate.getTime())) return [];

    const vacations = cfg.vacations || [];
    if (vacations.some(vac => date >= vac.startDate && date <= (vac.endDate || vac.startDate))) {
      return [];
    }

    const duration = cfg.slotDuration === 'custom'
      ? (cfg.customSlotDuration || 30)
      : (cfg.slotDuration || 60);
    const buffer = Number(cfg.bufferMinutes) || 0;
    const step = duration + buffer;
    const lunchFrom = cfg.lunchtimeEnabled ? timeToMinutes(cfg.lunchtimeFrom || '12:00') : -1;
    const lunchTo = cfg.lunchtimeEnabled ? timeToMinutes(cfg.lunchtimeTo || '13:00') : -1;
    const dayOfWeek = candidate.getDay();
    const results: string[] = [];
    const seen = new Set<string>();

    (cfg.intervals || []).forEach(interval => {
      const matches = interval.specificDate ? interval.specificDate === date : dayMatchesInterval(interval.days, dayOfWeek);
      if (!matches) return;

      let start = timeToMinutes(interval.from);
      const end = timeToMinutes(interval.to);
      while (start + duration <= end) {
        if (lunchFrom >= 0) {
          const slotEnd = start + duration;
          if (start < lunchTo && slotEnd > lunchFrom) {
            start = lunchTo;
            continue;
          }
        }
        const time = minutesToTime(start);
        if (!seen.has(time)) {
          seen.add(time);
          results.push(time);
        }
        start += step;
      }
    });

    return results.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  };

  const addAppointmentInterval = () => {
    const current = draft.appointmentSlotsConfig || {};
    const newInterval: AppointmentInterval = {
      id: `int_${Date.now()}`,
      from: newIntervalFrom,
      to: newIntervalTo,
      days: newIntervalUseSpecificDate ? 'Every Day' : newIntervalDays,
      ...(newIntervalUseSpecificDate && newIntervalSpecificDate ? { specificDate: newIntervalSpecificDate } : {}),
    };
    const intervals: AppointmentInterval[] = [...(current.intervals || []), newInterval];
    updateAppointment({ intervals });
    setNewIntervalFrom('09:00');
    setNewIntervalTo('17:00');
    setNewIntervalDays('Weekdays');
    setNewIntervalSpecificDate('');
    setNewIntervalUseSpecificDate(false);
  };

  const removeAppointmentInterval = (id: string) => {
    const current = draft.appointmentSlotsConfig || {};
    updateAppointment({ intervals: (current.intervals || []).filter(i => i.id !== id) });
  };

  const updateAppointmentInterval = (id: string, changes: Partial<AppointmentInterval>) => {
    const current = draft.appointmentSlotsConfig || {};
    updateAppointment({
      intervals: (current.intervals || []).map(i => i.id === id ? { ...i, ...changes } : i),
    });
  };

  const addAppointmentVacation = () => {
    if (!newVacStart) return;
    const current = draft.appointmentSlotsConfig || {};
    const vacations: AppointmentVacation[] = [...(current.vacations || []), {
      id: `vac_${Date.now()}`,
      startDate: newVacStart,
      endDate: newVacEnd || newVacStart,
    }];
    updateAppointment({ vacations });
    setNewVacStart('');
    setNewVacEnd('');
  };

  const removeAppointmentVacation = (id: string) => {
    const current = draft.appointmentSlotsConfig || {};
    updateAppointment({ vacations: (current.vacations || []).filter(v => v.id !== id) });
  };

  const addExcludedAppointmentSlot = (date = excludedSlotDate, startTime = excludedSlotTime) => {
    if (!date || !startTime) return;
    const current = draft.appointmentSlotsConfig || {};
    const existing = current.excludedSlots || [];
    if (existing.some(slot => slot.date === date && slot.startTime === startTime)) return;
    const exclusion: AppointmentSlotExclusion = {
      id: `excluded_${date}_${startTime.replace(':', '')}`,
      date,
      startTime,
    };
    updateAppointment({ excludedSlots: [...existing, exclusion] });
  };

  const removeExcludedAppointmentSlot = (id: string) => {
    const current = draft.appointmentSlotsConfig || {};
    updateAppointment({ excludedSlots: (current.excludedSlots || []).filter(slot => slot.id !== id) });
  };

  const updateEmailOtp = (updates: Partial<EmailOtpConfig>) => {
    const existing = draft.emailOtpConfig || {};
    update('emailOtpConfig', { ...existing, ...updates });
  };

  const addAppointmentSlot = () => {
    const current = draft.appointmentSlotsConfig || {};
    const nextIndex = (current.slots?.length || 0) + 1;
    const slot: AppointmentSlot = {
      id: `slot_${Date.now()}_${nextIndex}`,
      className: `Session ${nextIndex}`,
      teacherName: 'Instructor',
      sessionType: 'group',
      date: new Date().toISOString().slice(0, 10),
      startTime: '09:00',
      durationMinutes: 45,
      maxBookings: 10,
    };
    updateAppointment({ slots: [...(current.slots || []), slot] });
  };

  const updateAppointmentSlot = (index: number, updates: Partial<AppointmentSlot>) => {
    const current = draft.appointmentSlotsConfig || {};
    const slots = [...(current.slots || [])];
    slots[index] = { ...slots[index], ...updates };
    updateAppointment({ slots });
  };

  const removeAppointmentSlot = (index: number) => {
    const current = draft.appointmentSlotsConfig || {};
    const slots = [...(current.slots || [])];
    slots.splice(index, 1);
    updateAppointment({ slots });
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
      <DialogContent className="flex h-[92vh] w-[min(96vw,1120px)] max-w-none flex-col gap-0 overflow-hidden rounded-[28px] border border-border/70 bg-background p-0 shadow-2xl">
        <div className="shrink-0 border-b border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-6 pb-5 pt-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              Edit Field
              <Badge variant="secondary" className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {FIELD_TYPE_LABELS[draft.type as FieldType || field.type]}
              </Badge>
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-sm text-muted-foreground/90">
              Configure the field behavior, appearance, validation, and advanced automation settings in one place.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/20">
          <div className="min-w-[960px] px-6 py-5">
          <Tabs defaultValue="basic" className="w-full">
            <div className="overflow-x-auto pb-2">
            <TabsList className="flex h-auto min-w-max items-center justify-start gap-1.5 rounded-2xl border border-border/60 bg-background/90 p-1 shadow-sm">
              <TabsTrigger value="basic" className="shrink-0 rounded-xl px-4 py-2">Basic</TabsTrigger>
              <TabsTrigger value="validation" className="shrink-0 rounded-xl px-4 py-2">Validation</TabsTrigger>
              {hasOptions && <TabsTrigger value="options" className="shrink-0 rounded-xl px-4 py-2">Options</TabsTrigger>}
              <TabsTrigger value="advanced" className="shrink-0 rounded-xl px-4 py-2">Advanced</TabsTrigger>
              <TabsTrigger value="conditions" className="shrink-0 rounded-xl px-4 py-2">Conditions</TabsTrigger>
              <TabsTrigger value="style" className="shrink-0 rounded-xl px-4 py-2">Style</TabsTrigger>
              {isMomenceSearch  && <TabsTrigger value="momence" className="shrink-0 rounded-xl px-4 py-2">Momence</TabsTrigger>}
              {isMomenceSession && <TabsTrigger value="sessions" className="shrink-0 rounded-xl px-4 py-2">Sessions</TabsTrigger>}
              {isAppointmentSlots && <TabsTrigger value="appt-setup" className="shrink-0 rounded-xl px-4 py-2">Setup</TabsTrigger>}
              {isEmailOtp && <TabsTrigger value="verification" className="shrink-0 rounded-xl px-4 py-2">Verification</TabsTrigger>}
            </TabsList>
            </div>

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

            {isAppointmentSlots && (
              <>
                {/* ── Setup Tab ─────────────────────────────────────────────── */}
                <TabsContent value="appt-setup" className="space-y-5 mt-4">
                  <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-foreground">Appointment Setup</p>
                      <p className="text-xs text-muted-foreground">All appointment rules live here: schedule windows, capacity, blackout times, and session metadata.</p>
                    </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Date Format</Label>
                    <div className="flex gap-2">
                      {(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD'] as const).map(fmt => (
                        <Button key={fmt} size="sm" variant={
                          (draft.appointmentSlotsConfig?.dateFormat || 'MM/DD/YYYY') === fmt ? 'default' : 'outline'
                        } onClick={() => updateAppointment({ dateFormat: fmt })}>{fmt}</Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Select a date format. D = day, M = month, Y = year.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Start Week on</Label>
                    <div className="flex gap-2">
                      {(['monday', 'sunday'] as const).map(d => (
                        <Button key={d} size="sm" variant={
                          (draft.appointmentSlotsConfig?.startWeekOn || 'sunday') === d ? 'default' : 'outline'
                        } className="uppercase" onClick={() => updateAppointment({ startWeekOn: d })}>{d}</Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Select when the week starts in your calendar.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Time Format</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant={(draft.appointmentSlotsConfig?.timeFormat || '12h') === '24h' ? 'default' : 'outline'}
                        onClick={() => updateAppointment({ timeFormat: '24h' })}>24 HOUR</Button>
                      <Button size="sm" variant={(draft.appointmentSlotsConfig?.timeFormat || '12h') === '12h' ? 'default' : 'outline'}
                        onClick={() => updateAppointment({ timeFormat: '12h' })}>AM/PM</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Select a time format.</p>
                  </div>
                  </div>
                </TabsContent>

                {/* ── Availability Tab ──────────────────────────────────────── */}
                <TabsContent value="appt-setup" className="space-y-5 mt-4">
                  <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-foreground">Availability</p>
                      <p className="text-xs text-muted-foreground">Define recurring windows, one-off dates, slot duration, rest buffers, and breaks.</p>
                    </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Calendar Integrations</Label>
                    <div className="flex gap-2">
                      {([
                        { key: 'google', label: 'Google Calendar' },
                        { key: 'outlook', label: 'Outlook Calendar' },
                        { key: 'calendly', label: 'Calendly' },
                      ] as { key: 'google' | 'outlook' | 'calendly'; label: string }[]).map(({ key, label }) => (
                        <Button key={key} size="sm" variant={
                          draft.appointmentSlotsConfig?.calIntegrations?.[key] ? 'default' : 'outline'
                        } onClick={() => updateAppointment({
                          calIntegrations: {
                            ...(draft.appointmentSlotsConfig?.calIntegrations || {}),
                            [key]: !draft.appointmentSlotsConfig?.calIntegrations?.[key],
                          },
                        })}>{label}</Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Check your calendar's availability.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Appointment Slot Duration</Label>
                    <div className="flex flex-wrap gap-2">
                      {([15, 30, 45, 60, 'custom'] as const).map(d => (
                        <Button key={d} size="sm" variant={
                          (draft.appointmentSlotsConfig?.slotDuration ?? 60) === d ? 'default' : 'outline'
                        } onClick={() => updateAppointment({ slotDuration: d })}>
                          {d === 'custom' ? 'Custom' : `${d} min`}
                        </Button>
                      ))}
                    </div>
                    {draft.appointmentSlotsConfig?.slotDuration === 'custom' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input type="number" min={1} className="w-24"
                          value={draft.appointmentSlotsConfig?.customSlotDuration ?? 30}
                          onChange={e => updateAppointment({ customSlotDuration: Number(e.target.value) || 30 })} />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Select the length of each appointment slot.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold">Intervals</Label>
                    {(draft.appointmentSlotsConfig?.intervals || []).map(interval => (
                      <div key={interval.id} className="rounded-lg border p-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">From</Label>
                            <Input type="time" value={interval.from}
                              onChange={e => updateAppointmentInterval(interval.id, { from: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">To</Label>
                            <Input type="time" value={interval.to}
                              onChange={e => updateAppointmentInterval(interval.id, { to: e.target.value })} />
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive"
                            onClick={() => removeAppointmentInterval(interval.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Specific Date Only</Label>
                          <Switch
                            checked={!!interval.specificDate}
                            onCheckedChange={v => updateAppointmentInterval(interval.id, {
                              specificDate: v ? (interval.specificDate || new Date().toISOString().slice(0, 10)) : undefined,
                            })} />
                        </div>
                        {interval.specificDate ? (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Date</Label>
                            <Input type="date" value={interval.specificDate}
                              onChange={e => updateAppointmentInterval(interval.id, { specificDate: e.target.value })} />
                          </div>
                        ) : (
                          <Select value={interval.days}
                            onValueChange={v => updateAppointmentInterval(interval.id, { days: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Every Day">Every Day</SelectItem>
                              <SelectItem value="Weekdays">Weekdays</SelectItem>
                              <SelectItem value="Weekends">Weekends</SelectItem>
                              <SelectItem value="Mon">Monday</SelectItem>
                              <SelectItem value="Tue">Tuesday</SelectItem>
                              <SelectItem value="Wed">Wednesday</SelectItem>
                              <SelectItem value="Thu">Thursday</SelectItem>
                              <SelectItem value="Fri">Friday</SelectItem>
                              <SelectItem value="Sat">Saturday</SelectItem>
                              <SelectItem value="Sun">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                    <div className="rounded-lg border border-dashed p-3 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Add New Interval</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">From</Label>
                          <Input type="time" value={newIntervalFrom} onChange={e => setNewIntervalFrom(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">To</Label>
                          <Input type="time" value={newIntervalTo} onChange={e => setNewIntervalTo(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Specific Date Only</Label>
                        <Switch checked={newIntervalUseSpecificDate} onCheckedChange={setNewIntervalUseSpecificDate} />
                      </div>
                      {newIntervalUseSpecificDate ? (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Date</Label>
                          <Input type="date" value={newIntervalSpecificDate} onChange={e => setNewIntervalSpecificDate(e.target.value)} />
                        </div>
                      ) : (
                        <Select value={newIntervalDays} onValueChange={setNewIntervalDays}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                          <SelectItem value="Every Day">Every Day</SelectItem>
                          <SelectItem value="Weekdays">Weekdays</SelectItem>
                          <SelectItem value="Weekends">Weekends</SelectItem>
                          <SelectItem value="Mon">Monday</SelectItem>
                          <SelectItem value="Tue">Tuesday</SelectItem>
                          <SelectItem value="Wed">Wednesday</SelectItem>
                          <SelectItem value="Thu">Thursday</SelectItem>
                          <SelectItem value="Fri">Friday</SelectItem>
                          <SelectItem value="Sat">Saturday</SelectItem>
                          <SelectItem value="Sun">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      )}
                      <Button variant="outline" size="sm" className="w-full" onClick={addAppointmentInterval}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add New Interval
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Intervals define when slots are available. Toggle "Specific Date Only" to create a one-off availability window for a particular date instead of a recurring weekly pattern.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Buffer / Rest Period Between Slots</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={0} className="w-24"
                        value={draft.appointmentSlotsConfig?.bufferMinutes ?? ''}
                        placeholder="0"
                        onChange={e => updateAppointment({ bufferMinutes: e.target.value ? Number(e.target.value) : undefined })} />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Add a gap after each slot before the next one is shown (e.g. 5 mins for cleanup/travel). For 15-min slots with a 5-min buffer: 12:00, 12:20, 12:40…</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label className="text-sm font-medium">Lunchtime</Label>
                        <p className="text-xs text-muted-foreground">Appointments can't be scheduled during this time.</p>
                      </div>
                      <Switch
                        checked={draft.appointmentSlotsConfig?.lunchtimeEnabled ?? false}
                        onCheckedChange={v => updateAppointment({ lunchtimeEnabled: v })} />
                    </div>
                    {draft.appointmentSlotsConfig?.lunchtimeEnabled && (
                      <div className="grid grid-cols-2 gap-2 pl-1">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Lunch From</Label>
                          <Input type="time" value={draft.appointmentSlotsConfig?.lunchtimeFrom || '12:00'}
                            onChange={e => updateAppointment({ lunchtimeFrom: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Lunch To</Label>
                          <Input type="time" value={draft.appointmentSlotsConfig?.lunchtimeTo || '13:00'}
                            onChange={e => updateAppointment({ lunchtimeTo: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </TabsContent>

                {/* ── Limits Tab ────────────────────────────────────────────── */}
                <TabsContent value="appt-setup" className="space-y-5 mt-4">
                  <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-foreground">Limits & Blackouts</p>
                      <p className="text-xs text-muted-foreground">Set booking windows, day limits, notice periods, vacations, and manually removed slots.</p>
                    </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Start &amp; End Date</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Start Date</Label>
                        <Input type="date" value={draft.appointmentSlotsConfig?.bookingStartDate || ''}
                          onChange={e => updateAppointment({ bookingStartDate: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">End Date</Label>
                        <Input type="date" value={draft.appointmentSlotsConfig?.bookingEndDate || ''}
                          onChange={e => updateAppointment({ bookingEndDate: e.target.value })} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Allow selection only between these dates.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Rolling Days</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={1} className="flex-1"
                        value={draft.appointmentSlotsConfig?.rollingDays ?? ''}
                        placeholder="e.g. 60"
                        onChange={e => updateAppointment({ rollingDays: e.target.value ? Number(e.target.value) : undefined })} />
                      <span className="text-sm font-semibold text-muted-foreground uppercase">Days</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Offer appointment availability for a certain number of days into the future.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold">Vacation and Holidays</Label>
                    {(draft.appointmentSlotsConfig?.vacations || []).map(vac => (
                      <div key={vac.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Start Date</Label>
                          <Input type="date" value={vac.startDate} onChange={e => {
                            const current = draft.appointmentSlotsConfig || {};
                            updateAppointment({ vacations: (current.vacations || []).map(v => v.id === vac.id ? { ...v, startDate: e.target.value } : v) });
                          }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">End Date</Label>
                          <Input type="date" value={vac.endDate} onChange={e => {
                            const current = draft.appointmentSlotsConfig || {};
                            updateAppointment({ vacations: (current.vacations || []).map(v => v.id === vac.id ? { ...v, endDate: e.target.value } : v) });
                          }} />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => removeAppointmentVacation(vac.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <div className="rounded-lg border border-dashed p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Start Date</Label>
                          <Input type="date" value={newVacStart} onChange={e => setNewVacStart(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">End Date</Label>
                          <Input type="date" value={newVacEnd} onChange={e => setNewVacEnd(e.target.value)} />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={addAppointmentVacation}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add New Vacation Date
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Block out dates on your calendar so that appointments can't be scheduled on those dates.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Max Bookings Per Slot</Label>
                    <Input type="number" min={1}
                      value={draft.appointmentSlotsConfig?.maxBookingsPerSlot ?? ''}
                      placeholder="1 (default)"
                      onChange={e => updateAppointment({ maxBookingsPerSlot: e.target.value ? Number(e.target.value) : undefined })} />
                    <p className="text-xs text-muted-foreground">How many people can book each auto-generated time slot. Slots are disabled once full.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Maximum Appointments Per Day</Label>
                    <Input type="number" min={1}
                      value={draft.appointmentSlotsConfig?.maxAppointmentsPerDay ?? ''}
                      placeholder="Unlimited"
                      onChange={e => updateAppointment({ maxAppointmentsPerDay: e.target.value ? Number(e.target.value) : undefined })} />
                    <p className="text-xs text-muted-foreground">Limit the number of appointments for each day.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Minimum Scheduling Notice</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Hours</Label>
                        <Input type="number" min={0}
                          value={draft.appointmentSlotsConfig?.minSchedulingNoticeHours ?? ''}
                          placeholder="0"
                          onChange={e => updateAppointment({ minSchedulingNoticeHours: e.target.value ? Number(e.target.value) : undefined })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Minutes</Label>
                        <Input type="number" min={0} max={59}
                          value={draft.appointmentSlotsConfig?.minSchedulingNoticeMinutes ?? ''}
                          placeholder="0"
                          onChange={e => updateAppointment({ minSchedulingNoticeMinutes: e.target.value ? Number(e.target.value) : undefined })} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Remove Individual Time Slots</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          className="w-[160px]"
                          value={slotPreviewDate}
                          onChange={e => {
                            setSlotPreviewDate(e.target.value);
                            setExcludedSlotDate(e.target.value);
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Keep interval-based generation active, but remove specific generated slots for a particular date.
                    </p>

                    <div className="rounded-lg border bg-card/70 p-3 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {getGeneratedSlotsForDate(slotPreviewDate).length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No interval-generated slots exist for this date yet. Add an interval or choose another date.
                          </p>
                        ) : (
                          getGeneratedSlotsForDate(slotPreviewDate).map(time => {
                            const excluded = isExcludedIntervalSlot(slotPreviewDate, time);
                            return (
                              <button
                                key={`${slotPreviewDate}-${time}`}
                                type="button"
                                onClick={() => {
                                  if (excluded) {
                                    const existing = (draft.appointmentSlotsConfig?.excludedSlots || []).find(slot => slot.date === slotPreviewDate && slot.startTime === time);
                                    if (existing) removeExcludedAppointmentSlot(existing.id);
                                  } else {
                                    addExcludedAppointmentSlot(slotPreviewDate, time);
                                  }
                                }}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  excluded
                                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                                    : 'border-border bg-background text-foreground hover:border-destructive/40 hover:text-destructive'
                                }`}
                              >
                                {excluded ? `Restore ${time}` : `Remove ${time}`}
                              </button>
                            );
                          })
                        )}
                      </div>
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <Input type="date" value={excludedSlotDate} onChange={e => setExcludedSlotDate(e.target.value)} />
                        <Input type="time" value={excludedSlotTime} onChange={e => setExcludedSlotTime(e.target.value)} />
                        <Button variant="outline" onClick={() => addExcludedAppointmentSlot()}>
                          Remove Slot
                        </Button>
                      </div>
                    </div>

                    {(draft.appointmentSlotsConfig?.excludedSlots || []).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Removed Time Slots</Label>
                        <div className="space-y-2">
                          {[...(draft.appointmentSlotsConfig?.excludedSlots || [])]
                            .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
                            .map(slot => (
                              <div key={slot.id} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                                <span>{slot.date} at {slot.startTime}</span>
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeExcludedAppointmentSlot(slot.id)}>
                                  Restore
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </TabsContent>

                {/* ── Advanced Tab ──────────────────────────────────────────── */}
                <TabsContent value="appt-setup" className="space-y-5 mt-4">
                  <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-foreground">Session Details</p>
                      <p className="text-xs text-muted-foreground">Choose session type, define custom slots, and control timezone behavior.</p>
                    </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Appointment Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: 'one-on-one', label: 'One-on-one', icon: '👤' },
                        { value: 'group', label: 'Group', icon: '👥' },
                      ] as const).map(({ value, label, icon }) => (
                        <button key={value} type="button" onClick={() => updateAppointment({ appointmentType: value })}
                          className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors ${
                            (draft.appointmentSlotsConfig?.appointmentType ?? 'one-on-one') === value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                          }`}>
                          <span className="text-2xl">{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                    {draft.appointmentSlotsConfig?.appointmentType === 'group' && (
                      <div className="space-y-1 mt-2">
                        <Label className="text-xs text-muted-foreground">Max Attendees per Slot</Label>
                        <Input type="number" min={2}
                          value={draft.appointmentSlotsConfig?.groupMaxAttendees ?? ''}
                          placeholder="Unlimited"
                          onChange={e => updateAppointment({ groupMaxAttendees: e.target.value ? Number(e.target.value) : undefined })} />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Make each appointment slot available to one person or multiple people.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Specific Slots (Class & Teacher)</Label>
                      <Button variant="outline" size="sm" onClick={addAppointmentSlot}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Slot
                      </Button>
                    </div>
                    {(draft.appointmentSlotsConfig?.slots || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No custom slots added. Add slots to configure class name, teacher, type, and per-slot capacity.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(draft.appointmentSlotsConfig?.slots || []).map((slot, index) => (
                          <div key={slot.id} className="rounded-lg border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground">Slot {index + 1}</p>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAppointmentSlot(index)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Class Name</Label>
                                <Input value={slot.className} onChange={e => updateAppointmentSlot(index, { className: e.target.value })} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Teacher Name</Label>
                                <Input value={slot.teacherName} onChange={e => updateAppointmentSlot(index, { teacherName: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Date</Label>
                                <Input type="date" value={slot.date} onChange={e => updateAppointmentSlot(index, { date: e.target.value })} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Start Time</Label>
                                <Input type="time" value={slot.startTime} onChange={e => updateAppointmentSlot(index, { startTime: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                                <Input type="number" min={1} value={slot.durationMinutes} onChange={e => updateAppointmentSlot(index, { durationMinutes: Number(e.target.value) || 30 })} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Max Bookings</Label>
                                <Input type="number" min={1} value={slot.maxBookings} onChange={e => updateAppointmentSlot(index, { maxBookings: Number(e.target.value) || 1 })} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Type</Label>
                                <Select value={slot.sessionType} onValueChange={v => updateAppointmentSlot(index, { sessionType: v as AppointmentSlot['sessionType'] })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="group">Group</SelectItem>
                                    <SelectItem value="personal">Personal</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      When custom slots are present, users can book only these slots and each slot respects its max booking capacity.
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="text-sm font-medium">Send Reminder Emails</Label>
                      <p className="text-xs text-muted-foreground">Send a reminder email to all attendees before the appointment time.</p>
                    </div>
                    <Switch
                      checked={draft.appointmentSlotsConfig?.sendReminderEmails ?? false}
                      onCheckedChange={v => updateAppointment({ sendReminderEmails: v })} />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Default Time Zone</Label>
                    <Select
                      value={draft.appointmentSlotsConfig?.defaultTimezone || 'America/New_York'}
                      onValueChange={v => updateAppointment({ defaultTimezone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[
                          'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
                          'America/Sao_Paulo','Europe/London','Europe/Paris','Europe/Berlin',
                          'Europe/Moscow','Asia/Dubai','Asia/Kolkata','Asia/Singapore',
                          'Asia/Tokyo','Asia/Shanghai','Australia/Sydney','Pacific/Auckland',
                        ].map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select the time zone for your appointments. Attendees will see your availability in their local time zone.</p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="text-sm font-medium">Lock the Time Zone</Label>
                      <p className="text-xs text-muted-foreground">Users will only see appointments in your time zone.</p>
                    </div>
                    <Switch
                      checked={draft.appointmentSlotsConfig?.lockTimezone ?? false}
                      onCheckedChange={v => updateAppointment({ lockTimezone: v })} />
                  </div>
                  </div>
                </TabsContent>
              </>
            )}

            {isEmailOtp && (
              <TabsContent value="verification" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Configure OTP email verification (Mailtrap SMTP token).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>From Name</Label>
                    <Input
                      value={draft.emailOtpConfig?.fromName || ''}
                      onChange={e => updateEmailOtp({ fromName: e.target.value })}
                      placeholder="Physique 57 India"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>From Email</Label>
                    <Input
                      type="email"
                      value={draft.emailOtpConfig?.fromEmail || ''}
                      onChange={e => updateEmailOtp({ fromEmail: e.target.value })}
                      placeholder="hello@physique57india.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Mailtrap API Token</Label>
                  <Input
                    type="password"
                    value={draft.emailOtpConfig?.mailtrapToken || ''}
                    onChange={e => updateEmailOtp({ mailtrapToken: e.target.value })}
                    placeholder="Paste token used for SMTP authentication"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Subject</Label>
                  <Input
                    value={draft.emailOtpConfig?.subject || ''}
                    onChange={e => updateEmailOtp({ subject: e.target.value })}
                    placeholder="Your verification code"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>OTP Length</Label>
                    <Input
                      type="number"
                      min={4}
                      max={8}
                      value={draft.emailOtpConfig?.otpLength ?? 6}
                      onChange={e => updateEmailOtp({ otpLength: Number(e.target.value) || 6 })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>OTP Expiry (min)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={draft.emailOtpConfig?.otpExpiryMinutes ?? 10}
                      onChange={e => updateEmailOtp({ otpExpiryMinutes: Number(e.target.value) || 10 })}
                    />
                  </div>
                </div>
              </TabsContent>
            )}

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
        </div>

        <div className="shrink-0 border-t border-border/60 bg-background/95 px-6 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur">
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(draft); onClose(); }}>Save Changes</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
