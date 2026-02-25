import { FormField, FIELD_TYPE_LABELS, FieldType } from '@/types/formField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GripVertical,
  Pencil,
  Trash2,
  Copy,
  EyeOff,
  Lock,
  Asterisk,
  SplitSquareHorizontal,
  Type,
  Mail,
  Phone,
  Hash,
  Link,
  KeyRound,
  AlignLeft,
  ListOrdered,
  CircleDot,
  CheckSquare,
  Calendar,
  Clock,
  Upload,
  Palette,
  Eye,
  Search,
  Calculator,
  GitBranch,
  Star,
  PenTool,
  Minus,
  SlidersHorizontal,
  Users,
  CalendarDays,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const FIELD_ICONS: Partial<Record<FieldType, React.ReactNode>> = {
  text: <Type className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  tel: <Phone className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  url: <Link className="h-3.5 w-3.5" />,
  password: <KeyRound className="h-3.5 w-3.5" />,
  textarea: <AlignLeft className="h-3.5 w-3.5" />,
  select: <ListOrdered className="h-3.5 w-3.5" />,
  radio: <CircleDot className="h-3.5 w-3.5" />,
  checkbox: <CheckSquare className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  time: <Clock className="h-3.5 w-3.5" />,
  'datetime-local': <Calendar className="h-3.5 w-3.5" />,
  file: <Upload className="h-3.5 w-3.5" />,
  color: <Palette className="h-3.5 w-3.5" />,
  hidden: <EyeOff className="h-3.5 w-3.5" />,
  lookup: <Search className="h-3.5 w-3.5" />,
  formula: <Calculator className="h-3.5 w-3.5" />,
  conditional: <GitBranch className="h-3.5 w-3.5" />,
  dependent: <GitBranch className="h-3.5 w-3.5" />,
  rating: <Star className="h-3.5 w-3.5" />,
  signature: <PenTool className="h-3.5 w-3.5" />,
  range: <SlidersHorizontal className="h-3.5 w-3.5" />,
  'member-search': <Users className="h-3.5 w-3.5" />,
  'momence-sessions': <CalendarDays className="h-3.5 w-3.5" />,
};

interface FieldCardProps {
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function FieldCard({
  field,
  onEdit,
  onDelete,
  onDuplicate,
}: FieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  if (field.type === 'page-break') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 my-1 group"
      >
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/40 hover:text-primary transition-colors pr-1">
          <GripVertical className="h-4 w-4" />
        </button>
        <SplitSquareHorizontal className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider flex-1">Page Break</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    );
  }

  if (field.type === 'section-break') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-3 my-1 group"
      >
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/40 hover:text-muted-foreground transition-colors pr-1">
          <GripVertical className="h-4 w-4" />
        </button>
        <Minus className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">{field.label}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    );
  }

  const icon = FIELD_ICONS[field.type] || <Type className="h-3.5 w-3.5" />;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl border bg-card px-3 py-3 transition-all hover:shadow-md hover:border-primary/30 ${isDragging ? 'shadow-xl ring-2 ring-primary/20' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none flex flex-col items-center justify-center shrink-0 h-8 w-5 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Icon */}
      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/8 shrink-0 ring-1 ring-primary/10">
        <span className="text-primary/70">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] items-center gap-x-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">{field.label}</span>
            {field.isRequired && (
              <Asterisk className="h-3 w-3 text-rose-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
            <span className="font-mono truncate max-w-[120px] opacity-70">{field.name}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs">{FIELD_TYPE_LABELS[field.type]}</span>
            {field.width && field.width !== '100' && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span>{field.width}%</span>
              </>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1 shrink-0">
          {field.isHidden && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 gap-0.5"><EyeOff className="h-2.5 w-2.5" /></Badge>
          )}
          {field.isReadOnly && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4"><Lock className="h-2.5 w-2.5" /></Badge>
          )}
          {field.options && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/20 text-primary/70">{field.options.length}</Badge>
          )}
          {field.conditionalRules && field.conditionalRules.length > 0 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-300 text-amber-600 gap-0.5">
              <GitBranch className="h-2.5 w-2.5" />
            </Badge>
          )}
          {field.type === 'momence-sessions' && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-blue-400 text-blue-600 font-semibold gap-0.5">
              <CalendarDays className="h-2.5 w-2.5" />
              Sessions
            </Badge>
          )}
          {field.type === 'member-search' && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-violet-400 text-violet-600 font-semibold gap-0.5">
              <Users className="h-2.5 w-2.5" />
              Momence
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 hover:bg-primary/10 hover:text-primary"><Pencil className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" onClick={onDuplicate} className="h-7 w-7 hover:bg-muted"><Copy className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

