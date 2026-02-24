import { FormField, FIELD_TYPE_LABELS } from '@/types/formField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GripVertical,
  Pencil,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Asterisk,
} from 'lucide-react';

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
  const isSectionBreak = field.type === 'section-break';

  if (isSectionBreak) {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-3">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {field.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex flex-col items-center gap-1 pt-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveUp}
          disabled={isFirst}
          className="h-6 w-6"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          disabled={isLast}
          className="h-6 w-6"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{field.label}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
            {FIELD_TYPE_LABELS[field.type]}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{field.name}</span>
          <span>ID: {field.id.slice(0, 12)}…</span>
          {field.width !== '100' && <span>W: {field.width}%</span>}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {field.isRequired && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Asterisk className="h-2.5 w-2.5" /> Required
            </Badge>
          )}
          {field.isHidden && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
              <EyeOff className="h-2.5 w-2.5" /> Hidden
            </Badge>
          )}
          {field.isReadOnly && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Lock className="h-2.5 w-2.5" /> Read-only
            </Badge>
          )}
          {field.conditionalRules && field.conditionalRules.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Conditional
            </Badge>
          )}
          {field.options && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {field.options.length} options
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDuplicate} className="h-8 w-8">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
