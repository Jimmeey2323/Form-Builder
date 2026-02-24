import { FormField, FIELD_TYPE_LABELS, FieldType } from '@/types/formField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GripVertical,
  Pencil,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
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
} from 'lucide-react';

const FIELD_ICONS: Partial<Record<FieldType, React.ReactNode>> = {
  text: <Type className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  tel: <Phone className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  url: <Link className="h-4 w-4" />,
  password: <KeyRound className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  select: <ListOrdered className="h-4 w-4" />,
  radio: <CircleDot className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  time: <Clock className="h-4 w-4" />,
  'datetime-local': <Calendar className="h-4 w-4" />,
  file: <Upload className="h-4 w-4" />,
  color: <Palette className="h-4 w-4" />,
  hidden: <EyeOff className="h-4 w-4" />,
  lookup: <Search className="h-4 w-4" />,
  formula: <Calculator className="h-4 w-4" />,
  conditional: <GitBranch className="h-4 w-4" />,
  dependent: <GitBranch className="h-4 w-4" />,
  rating: <Star className="h-4 w-4" />,
  signature: <PenTool className="h-4 w-4" />,
  range: <SlidersHorizontal className="h-4 w-4" />,
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
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: FieldCardProps) {
  if (field.type === 'page-break') {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 my-1">
        <SplitSquareHorizontal className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider flex-1">
          Page Break
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    );
  }

  if (field.type === 'section-break') {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/40 px-4 py-3 my-1">
        <Minus className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          {field.label}
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    );
  }

  const icon = FIELD_ICONS[field.type] || <Type className="h-4 w-4" />;

  return (
    <div className="group flex items-center gap-3 rounded-lg border bg-card px-3 py-3 transition-all hover:shadow-sm hover:border-primary/20">
      {/* Reorder controls */}
      <div className="flex flex-col items-center shrink-0">
        <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst} className="h-5 w-5 p-0">
          <ChevronUp className="h-3 w-3" />
        </Button>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
        <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast} className="h-5 w-5 p-0">
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center h-9 w-9 rounded-md bg-muted shrink-0">
        <span className="text-muted-foreground">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] items-center gap-x-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{field.label}</span>
            {field.isRequired && (
              <Asterisk className="h-3 w-3 text-destructive shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
            <span className="font-mono truncate max-w-[120px]">{field.name}</span>
            <span className="text-muted-foreground/40">•</span>
            <span>{FIELD_TYPE_LABELS[field.type]}</span>
            {field.width !== '100' && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span>{field.width}%</span>
              </>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1 shrink-0">
          {field.isHidden && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4"><EyeOff className="h-2.5 w-2.5" /></Badge>
          )}
          {field.isReadOnly && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4"><Lock className="h-2.5 w-2.5" /></Badge>
          )}
          {field.options && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{field.options.length}</Badge>
          )}
          {field.conditionalRules && field.conditionalRules.length > 0 && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
              <GitBranch className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" onClick={onDuplicate} className="h-7 w-7"><Copy className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}
