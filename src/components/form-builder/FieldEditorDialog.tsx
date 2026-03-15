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
import { FormField, FieldOption, ConditionalRule, FIELD_TYPE_LABELS, FieldType, DependentOptionsConfig, MomenceSearchConfig, MomenceSessionsConfig, AppointmentSlotsConfig, AppointmentInterval, AppointmentVacation, AppointmentSlot, AppointmentSlotExclusion, EmailOtpConfig, AppointmentService, AppointmentAvailableDate, LikertColumn, LikertColumnType, LikertRow } from '@/types/formField';
import { Plus, Trash2, X, GitBranch, ChevronDown, ChevronUp, Eye, MapPin, Star, Heart, ThumbsUp, Flame, Smile, Award, Sun, Zap, Shield, Target, Dumbbell, Bike, Trophy, Activity, Image as ImageIcon, List, Table2 } from 'lucide-react';
import { getStoredMailtrapToken, persistMailtrapToken } from '@/lib/mailtrap';
import {
  getChoiceMatrixColumns,
  getFieldControlClassNames,
  getFieldWrapperClassNames,
} from '@/utils/formFieldStyling';

const RATING_ICON_OPTIONS: { key: string; label: string; icon: typeof Star }[] = [
  { key: 'star',      label: 'Star',      icon: Star },
  { key: 'heart',     label: 'Heart',     icon: Heart },
  { key: 'thumbs-up', label: 'Thumbs',    icon: ThumbsUp },
  { key: 'flame',     label: 'Flame',     icon: Flame },
  { key: 'smile',     label: 'Smile',     icon: Smile },
  { key: 'zap',       label: 'Bolt',      icon: Zap },
  { key: 'award',     label: 'Award',     icon: Award },
  { key: 'shield',    label: 'Shield',    icon: Shield },
  { key: 'sun',       label: 'Sun',       icon: Sun },
  { key: 'target',    label: 'Target',    icon: Target },
  { key: 'dumbbell',  label: 'Dumbbell',  icon: Dumbbell },
  { key: 'bike',      label: 'Bike',      icon: Bike },
  { key: 'trophy',    label: 'Trophy',    icon: Trophy },
  { key: 'activity',  label: 'Activity',  icon: Activity },
];

interface FieldEditorDialogProps {
  field: FormField | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<FormField>) => void;
  allFields: FormField[];
  initialTab?: string;
}

export function FieldEditorDialog({ field, open, onClose, onSave, allFields, initialTab }: FieldEditorDialogProps) {
  const [draft, setDraft] = useState<Partial<FormField>>({});
  const [expandedOptionIndex, setExpandedOptionIndex] = useState<number | null>(null);
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [expandedLikertColIndex, setExpandedLikertColIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basic');
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

  // ── New simplified appointment state ──────────────────────────────────
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcWith, setNewSvcWith] = useState('');
  const [newSvcDuration, setNewSvcDuration] = useState(30);
  const [newSvcBuffer, setNewSvcBuffer] = useState(0);
  const [newSvcMaxBookings, setNewSvcMaxBookings] = useState(1);
  const [newDateValue, setNewDateValue] = useState('');
  const [newDateFrom, setNewDateFrom] = useState('09:00');
  const [newDateTo, setNewDateTo] = useState('17:00');

  useEffect(() => {
    if (field) setDraft({ ...field });
  }, [field]);

  useEffect(() => {
    if (!field || field.type !== 'email-otp') return;

    const storedToken = getStoredMailtrapToken();
    if (!storedToken) return;

    setDraft(prev => {
      const existingToken = prev.emailOtpConfig?.mailtrapToken?.trim();
      if (existingToken) return prev;

      return {
        ...prev,
        emailOtpConfig: {
          ...(prev.emailOtpConfig || field.emailOtpConfig || {}),
          mailtrapToken: storedToken,
        },
      };
    });
  }, [field]);

  if (!field) return null;

  const update = (key: keyof FormField, value: any) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const optionTypes: FieldType[] = ['select', 'radio', 'checkbox', 'checkboxes', 'multiple-choice', 'multiselect', 'picture-choice', 'choice-matrix', 'ranking', 'submission-picker', 'dependent'];
  const hasOptions = optionTypes.includes((draft.type || field.type) as FieldType);
  const isAdvanced = ['lookup', 'formula'].includes(draft.type || field.type);
  const isSwitch = (draft.type || field.type) === 'switch';
  const isMomenceSearch  = (draft.type || field.type) === 'member-search';
  const isMomenceSession = (draft.type || field.type) === 'momence-sessions';
  const isAppointmentSlots = (draft.type || field.type) === 'appointment-slots';
  const isEmailOtp = (draft.type || field.type) === 'email-otp';
  const hasLikert  = (draft.type || field.type) === 'likert-table';
  const allowOtherTypes: FieldType[] = ['select', 'radio', 'checkbox', 'checkboxes', 'multiple-choice', 'multiselect'];
  const effectiveField = { ...field, ...draft } as FormField;
  const fieldWrapperClassPreview = getFieldWrapperClassNames(effectiveField, ['form-group']);
  const fieldControlClassPreview = getFieldControlClassNames(effectiveField.type, ['form-input']);

  const getDefaultTab = (type: FieldType) => {
    if (type === 'conditional') return 'conditions';
    if (optionTypes.includes(type)) return 'options';
    if (['lookup', 'formula'].includes(type)) return 'advanced';
    if (type === 'appointment-slots') return 'appt-setup';
    if (type === 'member-search') return 'momence';
    if (type === 'momence-sessions') return 'sessions';
    if (type === 'email-otp') return 'verification';
    if (type === 'likert-table') return 'likert';
    return 'basic';
  };

  useEffect(() => {
    if (field) setActiveTab(initialTab || getDefaultTab(field.type));
  }, [field?.id, field?.type, initialTab]);

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
    if (typeof updates.mailtrapToken === 'string') {
      persistMailtrapToken(updates.mailtrapToken);
    }

    const existing = draft.emailOtpConfig || {};
    update('emailOtpConfig', { ...existing, ...updates });
  };

  // ── Simplified appointment service helpers ────────────────────────────
  const addService = () => {
    const current = draft.appointmentSlotsConfig || {};
    const svc: AppointmentService = {
      id: `svc_${Date.now()}`,
      name: newSvcName || undefined,
      with: newSvcWith || undefined,
      durationMinutes: newSvcDuration,
      bufferMinutes: newSvcBuffer || undefined,
      maxBookingsPerSlot: newSvcMaxBookings > 1 ? newSvcMaxBookings : undefined,
    };
    updateAppointment({ services: [...(current.services || []), svc] });
    setNewSvcName(''); setNewSvcWith(''); setNewSvcDuration(30); setNewSvcBuffer(0); setNewSvcMaxBookings(1);
  };

  const removeService = (id: string) => {
    const current = draft.appointmentSlotsConfig || {};
    updateAppointment({ services: (current.services || []).filter(s => s.id !== id) });
  };

  const updateService = (id: string, changes: Partial<AppointmentService>) => {
    const current = draft.appointmentSlotsConfig || {};
    updateAppointment({ services: (current.services || []).map(s => s.id === id ? { ...s, ...changes } : s) });
  };

  const addAvailableDate = () => {
    if (!newDateValue) return;
    const current = draft.appointmentSlotsConfig || {};
    const existing = current.availableDates || [];
    if (existing.some(d => d.date === newDateValue)) return; // no dupes
    const entry: AppointmentAvailableDate = {
      id: `date_${Date.now()}`,
      date: newDateValue,
      from: newDateFrom,
      to: newDateTo,
    };
    updateAppointment({ availableDates: [...existing, entry].sort((a, b) => a.date.localeCompare(b.date)) });
    setNewDateValue(''); setNewDateFrom('09:00'); setNewDateTo('17:00');
  };

  const removeAvailableDate = (id: string) => {
    const current = draft.appointmentSlotsConfig || {};
    updateAppointment({ availableDates: (current.availableDates || []).filter(d => d.id !== id) });
  };

  const updateAvailableDate = (id: string, changes: Partial<AppointmentAvailableDate>) => {
    const current = draft.appointmentSlotsConfig || {};
    updateAppointment({ availableDates: (current.availableDates || []).map(d => d.id === id ? { ...d, ...changes } : d) });
  };

  /** Preview: generate slot times for a given service + date entry */
  const previewSlotsForService = (svc: AppointmentService, dateEntry: AppointmentAvailableDate): string[] => {
    const duration = svc.durationMinutes;
    const buffer = svc.bufferMinutes || 0;
    const step = duration + buffer;
    let start = timeToMinutes(dateEntry.from);
    const end = timeToMinutes(dateEntry.to);
    const slots: string[] = [];
    while (start + duration <= end) {
      slots.push(minutesToTime(start));
      start += step;
    }
    return slots;
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

  const addBulkOptions = () => {
    const parts = bulkPasteText
      .split(/[\n\r\t,;|]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const opts = [...(draft.options || [])];
    parts.forEach(label => {
      const value = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || `option_${opts.length + 1}`;
      opts.push({ label, value });
    });
    update('options', opts);
    setBulkPasteText('');
    setShowBulkPaste(false);
  };

  // ── Likert table helpers ────────────────────────────────────────────────
  const getLikertCfg = () => draft.likertTableConfig || { rows: [], columns: [] };

  const addLikertRow = () => {
    const cfg = getLikertCfg();
    const id = `lrow_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    update('likertTableConfig', { ...cfg, rows: [...cfg.rows, { id, label: `Statement ${cfg.rows.length + 1}` }] });
  };

  const updateLikertRow = (idx: number, label: string) => {
    const cfg = getLikertCfg();
    const rows = cfg.rows.map((r: LikertRow, i: number) => i === idx ? { ...r, label } : r);
    update('likertTableConfig', { ...cfg, rows });
  };

  const removeLikertRow = (idx: number) => {
    const cfg = getLikertCfg();
    update('likertTableConfig', { ...cfg, rows: cfg.rows.filter((_: LikertRow, i: number) => i !== idx) });
  };

  const addLikertColumn = () => {
    const cfg = getLikertCfg();
    const id = `lcol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newCol: LikertColumn = {
      id,
      label: `Column ${cfg.columns.length + 1}`,
      type: 'radio',
      options: [
        { label: 'Strongly Agree', value: 'strongly_agree' },
        { label: 'Agree', value: 'agree' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'Disagree', value: 'disagree' },
        { label: 'Strongly Disagree', value: 'strongly_disagree' },
      ],
      required: false,
    };
    update('likertTableConfig', { ...cfg, columns: [...cfg.columns, newCol] });
    setExpandedLikertColIndex(cfg.columns.length);
  };

  const updateLikertColumn = (idx: number, key: keyof LikertColumn, value: unknown) => {
    const cfg = getLikertCfg();
    const columns = cfg.columns.map((c: LikertColumn, i: number) => i === idx ? { ...c, [key]: value } : c);
    update('likertTableConfig', { ...cfg, columns });
  };

  const removeLikertColumn = (idx: number) => {
    const cfg = getLikertCfg();
    update('likertTableConfig', { ...cfg, columns: cfg.columns.filter((_: LikertColumn, i: number) => i !== idx) });
    setExpandedLikertColIndex(null);
  };

  const addLikertColOption = (colIdx: number) => {
    const cfg = getLikertCfg();
    const col = cfg.columns[colIdx];
    const opts = [...(col.options || [])];
    opts.push({ label: `Option ${opts.length + 1}`, value: `option_${opts.length + 1}` });
    updateLikertColumn(colIdx, 'options', opts);
  };

  const updateLikertColOption = (colIdx: number, optIdx: number, key: 'label' | 'value', value: string) => {
    const cfg = getLikertCfg();
    const col = cfg.columns[colIdx];
    const opts = (col.options || []).map((o: FieldOption, i: number) => i === optIdx ? { ...o, [key]: value } : o);
    updateLikertColumn(colIdx, 'options', opts);
  };

  const removeLikertColOption = (colIdx: number, optIdx: number) => {
    const cfg = getLikertCfg();
    const col = cfg.columns[colIdx];
    const opts = (col.options || []).filter((_: FieldOption, i: number) => i !== optIdx);
    updateLikertColumn(colIdx, 'options', opts);
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
  const updateChoiceMatrixColumns = (rawValue: string) => {
    const columns = rawValue
      .split(/[\n,|]+/)
      .map(value => value.trim())
      .filter(Boolean);
    update('choiceMatrixColumns', columns);
    if (columns.length > 1) {
      update('max', columns.length);
    }
  };

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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2">
            <TabsList className="flex h-auto min-w-max items-center justify-start gap-1.5 rounded-2xl border border-border/60 bg-background/90 p-1 shadow-sm">
              <TabsTrigger value="basic" className="shrink-0 rounded-xl px-4 py-2">Settings</TabsTrigger>
              <TabsTrigger value="validation" className="shrink-0 rounded-xl px-4 py-2">Validation</TabsTrigger>
              {hasOptions && <TabsTrigger value="options" className="shrink-0 rounded-xl px-4 py-2">Options</TabsTrigger>}
              <TabsTrigger value="advanced" className="shrink-0 rounded-xl px-4 py-2">Advanced</TabsTrigger>
              <TabsTrigger value="conditions" className="shrink-0 rounded-xl px-4 py-2">Conditions</TabsTrigger>
              <TabsTrigger value="style" className="shrink-0 rounded-xl px-4 py-2">Style</TabsTrigger>
              {isMomenceSearch  && <TabsTrigger value="momence" className="shrink-0 rounded-xl px-4 py-2">Momence</TabsTrigger>}
              {isMomenceSession && <TabsTrigger value="sessions" className="shrink-0 rounded-xl px-4 py-2">Sessions</TabsTrigger>}
              {isAppointmentSlots && <TabsTrigger value="appt-setup" className="shrink-0 rounded-xl px-4 py-2">Setup</TabsTrigger>}
              {isEmailOtp && <TabsTrigger value="verification" className="shrink-0 rounded-xl px-4 py-2">Verification</TabsTrigger>}
              {hasLikert && <TabsTrigger value="likert" className="shrink-0 rounded-xl px-4 py-2 flex items-center gap-1"><Table2 className="h-3.5 w-3.5" />Table</TabsTrigger>}
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

              {/* ── Switch settings ──────────────────────────────────────────────────── */}
              {isSwitch && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Switch Settings</Label>
                  <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background p-3">
                    <div>
                      <Label className="text-sm">Default State</Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Start in the ON position</p>
                    </div>
                    <Switch checked={draft.switchDefaultOn ?? false} onCheckedChange={v => update('switchDefaultOn', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">On Label</Label>
                      <Input value={draft.switchOnLabel || ''} onChange={e => update('switchOnLabel', e.target.value)} placeholder="Yes" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Off Label</Label>
                      <Input value={draft.switchOffLabel || ''} onChange={e => update('switchOffLabel', e.target.value)} placeholder="No" className="h-8 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Rating settings ──────────────────────────────────────────────────── */}
              {(draft.type === 'rating' || draft.type === 'star-rating') && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Rating Settings</Label>
                  <div className="flex items-center gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Number of icons</Label>
                      <Input type="number" min={2} max={10} value={draft.max ?? 5} onChange={e => update('max', Number(e.target.value))} className="w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Icon style (14 options)</Label>
                    <div className="grid grid-cols-7 gap-2">
                      {RATING_ICON_OPTIONS.map(opt => {
                        const IconComp = opt.icon;
                        const isSelected = (draft.ratingIcon || 'star') === opt.key;
                        return (
                          <button key={opt.key} type="button" onClick={() => update('ratingIcon', opt.key)}
                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                              isSelected ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10' : 'border-border hover:border-primary/50 bg-background'
                            }`}>
                            <IconComp className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-[10px] font-medium text-muted-foreground leading-none capitalize">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Range (slider) settings ──────────────────────────────────────────── */}
              {draft.type === 'range' && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Slider Settings</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Min</Label>
                      <Input type="number" value={draft.min ?? 0} onChange={e => update('min', Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Max</Label>
                      <Input type="number" value={draft.max ?? 10} onChange={e => update('max', Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Step</Label>
                      <Input type="number" value={draft.step ?? 1} onChange={e => update('step', Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label className="text-sm">Show current value</Label>
                      <Switch checked={draft.rangeShowValue ?? true} onCheckedChange={v => update('rangeShowValue', v)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Value suffix</Label>
                      <Input value={draft.rangeValueSuffix || ''} onChange={e => update('rangeValueSuffix', e.target.value)} placeholder="e.g. %, pts" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Opinion scale settings ──────────────────────────────────────────── */}
              {draft.type === 'opinion-scale' && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Opinion Scale Settings</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Min</Label>
                      <Input type="number" value={draft.min ?? 1} onChange={e => update('min', Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Max</Label>
                      <Input type="number" value={draft.max ?? 10} onChange={e => update('max', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Password settings ───────────────────────────────────────────────── */}
              {draft.type === 'password' && (
                <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Password Settings</Label>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label className="text-sm">Allow reveal toggle</Label>
                    <Switch checked={draft.passwordReveal ?? true} onCheckedChange={v => update('passwordReveal', v)} />
                  </div>
                </div>
              )}

              {/* ── Section Collapse settings ───────────────────────────────────────── */}
              {draft.type === 'section-collapse' && (
                <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Section Collapse Settings</Label>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label className="text-sm">Start expanded</Label>
                    <Switch checked={draft.collapseDefaultOpen ?? false} onCheckedChange={v => update('collapseDefaultOpen', v)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Section description</Label>
                    <Textarea
                      value={draft.collapseDescription || ''}
                      onChange={e => update('collapseDescription', e.target.value)}
                      placeholder="Optional helper text shown inside the collapsed area"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* ── Divider settings ────────────────────────────────────────────────── */}
              {draft.type === 'divider' && (
                <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Divider Settings</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Style</Label>
                      <Select value={draft.dividerStyle || 'solid'} onValueChange={v => update('dividerStyle', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                          <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Thickness (px)</Label>
                      <Input type="number" min={1} max={8} value={draft.dividerThickness ?? 1} onChange={e => update('dividerThickness', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Signature settings ─────────────────────────────────────────────── */}
              {draft.type === 'signature' && (
                <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Signature Settings</Label>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Pad height (px)</Label>
                    <Input
                      type="number"
                      min={120}
                      max={400}
                      value={draft.signatureHeight ?? 200}
                      onChange={e => update('signatureHeight', Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {/* ── Spacer settings ─────────────────────────────────────────────────── */}
              {draft.type === 'spacer' && (
                <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Spacer Settings</Label>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Height</Label>
                    <Input
                      value={draft.spacerHeight || draft.helpText || ''}
                      onChange={e => {
                        update('spacerHeight', e.target.value);
                        update('helpText', e.target.value);
                      }}
                      placeholder="e.g. 20px or 2rem"
                    />
                  </div>
                </div>
              )}

              {/* ── Media settings ─────────────────────────────────────────────────── */}
              {['image', 'video', 'pdf-viewer'].includes(draft.type || '') && (
                <div className="space-y-2 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Media Settings</Label>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Media URL</Label>
                    <Input
                      value={draft.defaultValue || ''}
                      onChange={e => update('defaultValue', e.target.value)}
                      placeholder="https://…"
                    />
                    <p className="text-[11px] text-muted-foreground">Used to render the media in preview and published forms.</p>
                  </div>
                </div>
              )}

              {/* ── Subform settings ─────────────────────────────────────────────── */}
              {draft.type === 'subform' && (
                <div className="space-y-2 rounded-xl border border-border p-4 bg-muted/20">
                  <Label className="text-sm font-semibold">Subform Settings</Label>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Template/Form ID</Label>
                    <Input
                      value={draft.subformTemplateId || ''}
                      onChange={e => update('subformTemplateId', e.target.value)}
                      placeholder="e.g. form_123456"
                    />
                    <p className="text-[11px] text-muted-foreground">Used to reference a nested form. Leave empty to show a placeholder.</p>
                  </div>
                </div>
              )}

              {/* ── HTML snippet content ───────────────────────────────────────────── */}
              {draft.type === 'html-snippet' && (
                <div className="space-y-2">
                  <Label>HTML Content</Label>
                  <Textarea
                    value={draft.htmlContent || ''}
                    onChange={e => update('htmlContent', e.target.value)}
                    placeholder={'<div>\n  <!-- Your HTML here -->\n</div>'}
                    className="font-mono text-sm min-h-[140px]"
                  />
                  <p className="text-xs text-muted-foreground">This HTML will be rendered verbatim in the exported form.</p>
                </div>
              )}
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
                {(draft.type || field.type) === 'choice-matrix' && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Choice Matrix Settings</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure the matrix scale separately from the row labels below. Row labels still come from the Options list.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Low-end Label</Label>
                        <Input
                          value={draft.choiceMatrixMinLabel || ''}
                          onChange={e => update('choiceMatrixMinLabel', e.target.value)}
                          placeholder="Lowest"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">High-end Label</Label>
                        <Input
                          value={draft.choiceMatrixMaxLabel || ''}
                          onChange={e => update('choiceMatrixMaxLabel', e.target.value)}
                          placeholder="Highest"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Column Labels</Label>
                      <Textarea
                        value={getChoiceMatrixColumns(effectiveField).join('\n')}
                        onChange={e => updateChoiceMatrixColumns(e.target.value)}
                        rows={5}
                        placeholder={'1\n2\n3\n4\n5'}
                        className="font-mono text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Use one label per line. Commas and pipes also work.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[3, 4, 5, 7].map(count => (
                        <Button
                          key={count}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => updateChoiceMatrixColumns(Array.from({ length: count }, (_, index) => String(index + 1)).join('\n'))}
                        >
                          {count}-point scale
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {allowOtherTypes.includes((draft.type || field.type) as FieldType) && (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">Allow "Other" option</p>
                      <p className="text-xs text-muted-foreground">Appends an "Other…" entry that reveals a free-text input when selected</p>
                    </div>
                    <Switch checked={!!draft.allowOther} onCheckedChange={v => update('allowOther', v)} />
                  </div>
                )}
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

                      {/* Picture-choice image URL */}
                      {(draft.type === 'picture-choice') && (
                        <div className="flex items-center gap-2 px-2 pb-2">
                          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 ml-0.5" />
                          <Input
                            value={opt.imageUrl || ''}
                            onChange={e => updateOption(i, 'imageUrl', e.target.value)}
                            placeholder="Image URL for this option (optional)"
                            className="text-xs h-7 border-dashed"
                          />
                        </div>
                      )}

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
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
                  </Button>
                  <Button
                    variant={showBulkPaste ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => { setShowBulkPaste(v => !v); setBulkPasteText(''); }}
                  >
                    <List className="h-3.5 w-3.5 mr-1" /> Bulk Add
                  </Button>
                </div>

                {showBulkPaste && (
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Paste options separated by commas, newlines, semicolons, tabs, or pipes.
                    </p>
                    <Textarea
                      value={bulkPasteText}
                      onChange={e => setBulkPasteText(e.target.value)}
                      placeholder={"Option A, Option B, Option C\nOption D; Option E\nOption F | Option G"}
                      rows={5}
                      className="text-sm font-mono"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addBulkOptions} disabled={!bulkPasteText.trim()}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Items
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowBulkPaste(false); setBulkPasteText(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

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

              {draft.type === 'dependent' && (
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-xs text-muted-foreground">
                  Configure dependent dropdown options and rules in the <strong>Options</strong> tab. Use the Dependent Options panel to map values from another field.
                </div>
              )}

              {draft.type === 'conditional' && (
                <div className="rounded-xl border border-dashed border-amber-300/60 bg-amber-50/60 p-4 text-xs text-amber-700/90">
                  Set visibility logic in the <strong>Conditions</strong> tab to show, hide, or require this field based on other field values.
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
                  Switch this field's type to Lookup or Formula to see advanced configuration options.
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
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Generated CSS Hooks</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    These classes are added automatically in preview and exported HTML, so custom CSS can target fields reliably.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Wrapper Classes</Label>
                  <Textarea
                    value={fieldWrapperClassPreview}
                    readOnly
                    rows={2}
                    className="font-mono text-xs bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Control Classes</Label>
                  <Input
                    value={fieldControlClassPreview}
                    readOnly
                    className="font-mono text-xs bg-background"
                  />
                </div>
              </div>
            </TabsContent>

            {isAppointmentSlots && (
              <>
                {/* ── Appointment Setup Tab (simplified) ─────────────────── */}
                <TabsContent value="appt-setup" className="space-y-5 mt-4">

                  {/* ── Services ─────────────────────────────────────────── */}
                  <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Services</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Add one or more services users can book. Duration and buffer control how slots are generated.</p>
                    </div>

                    {/* Existing services */}
                    {(draft.appointmentSlotsConfig?.services || []).map(svc => (
                      <div key={svc.id} className="rounded-xl border bg-background/70 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
                            {svc.name || 'Unnamed Service'}
                            {svc.with ? <span className="font-normal"> · with {svc.with}</span> : ''}
                          </p>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeService(svc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Service Name <span className="text-muted-foreground/60">(optional)</span></Label>
                            <Input value={svc.name || ''} placeholder="e.g. Haircut"
                              onChange={e => updateService(svc.id, { name: e.target.value || undefined })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Appointment With <span className="text-muted-foreground/60">(optional)</span></Label>
                            <Input value={svc.with || ''} placeholder="e.g. John"
                              onChange={e => updateService(svc.id, { with: e.target.value || undefined })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                            <Input type="number" min={1} value={svc.durationMinutes}
                              onChange={e => updateService(svc.id, { durationMinutes: Number(e.target.value) || 30 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Gap Between Slots (min)</Label>
                            <Input type="number" min={0} value={svc.bufferMinutes ?? 0}
                              onChange={e => updateService(svc.id, { bufferMinutes: Number(e.target.value) || undefined })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Bookings / Slot</Label>
                            <Input type="number" min={1} value={svc.maxBookingsPerSlot ?? 1}
                              onChange={e => updateService(svc.id, { maxBookingsPerSlot: Number(e.target.value) > 1 ? Number(e.target.value) : undefined })} />
                          </div>
                        </div>
                        {/* Slot preview for this service */}
                        {(draft.appointmentSlotsConfig?.availableDates || []).length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground font-medium">Preview — generated slots</p>
                            {(draft.appointmentSlotsConfig?.availableDates || []).map(dateEntry => {
                              const slots = previewSlotsForService(svc, dateEntry);
                              if (!slots.length) return null;
                              return (
                                <div key={dateEntry.id} className="flex items-start gap-2 flex-wrap">
                                  <span className="text-xs font-medium text-muted-foreground w-20 shrink-0 pt-0.5">{dateEntry.date}</span>
                                  <div className="flex flex-wrap gap-1">
                                    {slots.map(s => (
                                      <span key={s} className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add new service */}
                    <div className="rounded-xl border border-dashed p-3 space-y-3">
                      <p className="text-xs text-muted-foreground font-medium">Add New Service</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Service Name <span className="text-muted-foreground/60">(optional)</span></Label>
                          <Input value={newSvcName} placeholder="e.g. Haircut"
                            onChange={e => setNewSvcName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Appointment With <span className="text-muted-foreground/60">(optional)</span></Label>
                          <Input value={newSvcWith} placeholder="e.g. John"
                            onChange={e => setNewSvcWith(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                          <Input type="number" min={1} value={newSvcDuration}
                            onChange={e => setNewSvcDuration(Number(e.target.value) || 30)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Gap Between Slots (min)</Label>
                          <Input type="number" min={0} value={newSvcBuffer}
                            onChange={e => setNewSvcBuffer(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Max Bookings / Slot</Label>
                          <Input type="number" min={1} value={newSvcMaxBookings}
                            onChange={e => setNewSvcMaxBookings(Number(e.target.value) || 1)} />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={addService}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Service
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Gap between slots:</strong> extra minutes after each appointment before the next slot starts (e.g. 5 min cleanup).
                      &nbsp;<strong>Max bookings:</strong> how many people can book the same time slot for this service.
                    </p>
                  </div>

                  {/* ── Available Dates ────────────────────────────────────── */}
                  <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Available Dates</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Pick the exact dates on which bookings can be made and specify the time window for each date.</p>
                    </div>

                    {/* Existing dates */}
                    {(draft.appointmentSlotsConfig?.availableDates || []).length === 0 && (
                      <p className="text-xs text-muted-foreground">No dates added yet.</p>
                    )}
                    {(draft.appointmentSlotsConfig?.availableDates || []).map(dateEntry => (
                      <div key={dateEntry.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Date</Label>
                          <Input type="date" value={dateEntry.date}
                            onChange={e => updateAvailableDate(dateEntry.id, { date: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">From</Label>
                          <Input type="time" value={dateEntry.from}
                            onChange={e => updateAvailableDate(dateEntry.id, { from: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">To</Label>
                          <Input type="time" value={dateEntry.to}
                            onChange={e => updateAvailableDate(dateEntry.id, { to: e.target.value })} />
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive mb-0.5" onClick={() => removeAvailableDate(dateEntry.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}

                    {/* Add new date */}
                    <div className="rounded-xl border border-dashed p-3 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Add Date</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Date</Label>
                          <Input type="date" value={newDateValue} onChange={e => setNewDateValue(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">From</Label>
                          <Input type="time" value={newDateFrom} onChange={e => setNewDateFrom(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">To</Label>
                          <Input type="time" value={newDateTo} onChange={e => setNewDateTo(e.target.value)} />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={addAvailableDate}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Date
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Slots are auto-generated for each date using the time window and each service's duration + gap.
                    </p>
                  </div>

                  {/* ── Display / Settings ────────────────────────────────────── */}
                  <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm space-y-4">
                    <p className="text-sm font-semibold text-foreground">Settings &amp; Display</p>

                    {/* Booking note */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-medium">Instructions / Booking Note <span className="text-muted-foreground/60">(optional)</span></Label>
                      <Input
                        value={draft.appointmentSlotsConfig?.bookingNote || ''}
                        onChange={e => updateAppointment({ bookingNote: e.target.value || undefined })}
                        placeholder="e.g. Please arrive 5 minutes early."
                      />
                      <p className="text-xs text-muted-foreground">Shown above the slot picker in the published form.</p>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-medium">Timezone</Label>
                      <Select
                        value={draft.appointmentSlotsConfig?.defaultTimezone || 'Asia/Kolkata'}
                        onValueChange={v => updateAppointment({ defaultTimezone: v })}
                      >
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</SelectItem>
                          <SelectItem value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</SelectItem>
                          <SelectItem value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</SelectItem>
                          <SelectItem value="Asia/Shanghai">Asia/Shanghai (CST, UTC+8)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                          <SelectItem value="Europe/Paris">Europe/Paris (CET, UTC+1)</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (ET)</SelectItem>
                          <SelectItem value="America/Chicago">America/Chicago (CT)</SelectItem>
                          <SelectItem value="America/Denver">America/Denver (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">America/Los_Angeles (PT)</SelectItem>
                          <SelectItem value="America/Sao_Paulo">America/Sao_Paulo (BRT)</SelectItem>
                          <SelectItem value="Australia/Sydney">Australia/Sydney (AEST)</SelectItem>
                          <SelectItem value="Pacific/Auckland">Pacific/Auckland (NZST)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Timezone displayed alongside slot times in the form.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Time Format */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">Time Format</Label>
                        <div className="flex gap-2">
                          <Button size="sm" variant={(draft.appointmentSlotsConfig?.timeFormat || '12h') === '12h' ? 'default' : 'outline'}
                            onClick={() => updateAppointment({ timeFormat: '12h' })}>AM/PM</Button>
                          <Button size="sm" variant={(draft.appointmentSlotsConfig?.timeFormat || '12h') === '24h' ? 'default' : 'outline'}
                            onClick={() => updateAppointment({ timeFormat: '24h' })}>24 Hour</Button>
                        </div>
                      </div>

                      {/* Hide fully booked slots */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">Fully Booked Slots</Label>
                        <div className="flex items-center gap-2 rounded-lg border p-2.5">
                          <Switch
                            checked={draft.appointmentSlotsConfig?.hideFullSlots ?? false}
                            onCheckedChange={v => updateAppointment({ hideFullSlots: v || undefined })}
                          />
                          <Label className="text-xs cursor-pointer">{draft.appointmentSlotsConfig?.hideFullSlots ? 'Hidden' : 'Show as "Full"'}</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                </TabsContent>
              </>
            )}

            {isEmailOtp && (
              <TabsContent value="verification" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Configure OTP email verification with Mailtrap. Only the API token is needed, and backend credentials are preferred when available.
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
                  <p className="text-xs text-muted-foreground">
                    Optional if <code className="rounded bg-muted px-1">MAILTRAP_API_TOKEN</code> is configured in backend credentials. Any token you enter here is saved locally for future sessions.
                  </p>
                  <Input
                    type="password"
                    value={draft.emailOtpConfig?.mailtrapToken || ''}
                    onChange={e => updateEmailOtp({ mailtrapToken: e.target.value })}
                    placeholder="Optional if backend Mailtrap credential is configured"
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

            {hasLikert && (
              <TabsContent value="likert" className="space-y-5 mt-4">
                {/* ── ROWS ──────────────────────────────────────────────── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Rows <Badge variant="secondary" className="ml-1">{getLikertCfg().rows.length}</Badge></Label>
                    <Button size="sm" variant="outline" onClick={addLikertRow}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {getLikertCfg().rows.map((row: LikertRow, i: number) => (
                      <div key={row.id} className="flex items-center gap-2">
                        <span className="w-5 text-center text-xs text-muted-foreground font-mono shrink-0">{i + 1}</span>
                        <Input
                          value={row.label}
                          onChange={e => updateLikertRow(i, e.target.value)}
                          placeholder={`Statement ${i + 1}`}
                          className="flex-1 text-sm"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeLikertRow(i)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {getLikertCfg().rows.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-2">No rows yet — click "Add Row"</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/50 pt-1" />

                {/* ── COLUMNS ──────────────────────────────────────────── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Columns <Badge variant="secondary" className="ml-1">{getLikertCfg().columns.length}</Badge></Label>
                    <Button size="sm" variant="outline" onClick={addLikertColumn}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Column
                    </Button>
                  </div>

                  {getLikertCfg().columns.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-2">No columns yet — click "Add Column"</p>
                  )}

                  {getLikertCfg().columns.map((col: LikertColumn, ci: number) => {
                    const isOpen = expandedLikertColIndex === ci;
                    const hasColOptions = ['radio', 'checkbox', 'select'].includes(col.type);
                    return (
                      <div key={col.id} className="rounded-lg border bg-card overflow-hidden">
                        {/* Column header row */}
                        <div className="flex items-center gap-2 p-2">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => setExpandedLikertColIndex(isOpen ? null : ci)}
                          >
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                          <Input
                            value={col.label}
                            onChange={e => updateLikertColumn(ci, 'label', e.target.value)}
                            placeholder="Column label"
                            className="flex-1 text-sm font-medium"
                          />
                          <Badge variant="outline" className="text-xs shrink-0 capitalize">{col.type}</Badge>
                          <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                            <span>Req</span>
                            <Switch
                              checked={!!col.required}
                              onCheckedChange={v => updateLikertColumn(ci, 'required', v)}
                              className="scale-75 origin-right"
                            />
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeLikertColumn(ci)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Expanded settings */}
                        {isOpen && (
                          <div className="border-t bg-muted/30 p-3 space-y-3">
                            {/* Type selector */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Input Type</Label>
                              <div className="flex flex-wrap gap-1.5">
                                {(['radio', 'checkbox', 'text', 'number', 'select', 'date', 'rating'] as LikertColumnType[]).map(t => (
                                  <Button
                                    key={t}
                                    size="sm"
                                    variant={col.type === t ? 'default' : 'outline'}
                                    className="h-7 text-xs capitalize"
                                    onClick={() => updateLikertColumn(ci, 'type', t)}
                                  >
                                    {t === 'radio' ? 'Single Choice' : t === 'checkbox' ? 'Multi-Choice' : t === 'select' ? 'Dropdown' : t === 'rating' ? '★ Rating' : t.charAt(0).toUpperCase() + t.slice(1)}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Options editor — for radio / checkbox / select */}
                            {hasColOptions && (
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Options</Label>
                                <div className="space-y-1.5">
                                  {(col.options || []).map((opt: FieldOption, oi: number) => (
                                    <div key={oi} className="flex items-center gap-2">
                                      <Input
                                        value={opt.label}
                                        onChange={e => updateLikertColOption(ci, oi, 'label', e.target.value)}
                                        placeholder="Label"
                                        className="flex-1 text-xs"
                                      />
                                      <Input
                                        value={opt.value}
                                        onChange={e => updateLikertColOption(ci, oi, 'value', e.target.value)}
                                        placeholder="Value"
                                        className="flex-1 text-xs font-mono"
                                      />
                                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeLikertColOption(ci, oi)}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addLikertColOption(ci)}>
                                  <Plus className="h-3 w-3 mr-1" /> Add Option
                                </Button>
                              </div>
                            )}

                            {/* Placeholder — for text / number */}
                            {(col.type === 'text' || col.type === 'number') && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Placeholder</Label>
                                <Input
                                  value={col.placeholder || ''}
                                  onChange={e => updateLikertColumn(ci, 'placeholder', e.target.value)}
                                  placeholder="e.g. Enter a value…"
                                  className="text-sm"
                                />
                              </div>
                            )}

                            {/* Max — for rating */}
                            {col.type === 'rating' && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Max Stars</Label>
                                <Input
                                  type="number"
                                  min={2} max={10}
                                  value={col.max ?? 5}
                                  onChange={e => updateLikertColumn(ci, 'max', Number(e.target.value) || 5)}
                                  className="text-sm w-24"
                                />
                              </div>
                            )}

                            {/* Min width */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Min Column Width</Label>
                              <Input
                                value={col.minWidth || ''}
                                onChange={e => updateLikertColumn(ci, 'minWidth', e.target.value)}
                                placeholder="e.g. 120px"
                                className="text-sm w-32"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
