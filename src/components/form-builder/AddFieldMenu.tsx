import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Type, Mail, Phone, Hash, Link, Lock, AlignLeft, ChevronDown, Circle, CheckSquare, Star, Calendar, Clock, Timer, Paperclip, Palette, PenTool, Minus, SplitSquareHorizontal, EyeOff, Database, Calculator, GitBranch, NetworkIcon, SlidersHorizontal } from 'lucide-react';
import { FIELD_TYPE_CATEGORIES, FIELD_TYPE_LABELS, FieldType } from '@/types/formField';

const FIELD_ICONS: Partial<Record<FieldType, React.ReactNode>> = {
  text: <Type className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  tel: <Phone className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  url: <Link className="h-3.5 w-3.5" />,
  password: <Lock className="h-3.5 w-3.5" />,
  textarea: <AlignLeft className="h-3.5 w-3.5" />,
  select: <ChevronDown className="h-3.5 w-3.5" />,
  radio: <Circle className="h-3.5 w-3.5" />,
  checkbox: <CheckSquare className="h-3.5 w-3.5" />,
  rating: <Star className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  time: <Clock className="h-3.5 w-3.5" />,
  'datetime-local': <Timer className="h-3.5 w-3.5" />,
  file: <Paperclip className="h-3.5 w-3.5" />,
  color: <Palette className="h-3.5 w-3.5" />,
  signature: <PenTool className="h-3.5 w-3.5" />,
  'section-break': <Minus className="h-3.5 w-3.5" />,
  'page-break': <SplitSquareHorizontal className="h-3.5 w-3.5" />,
  hidden: <EyeOff className="h-3.5 w-3.5" />,
  lookup: <Database className="h-3.5 w-3.5" />,
  formula: <Calculator className="h-3.5 w-3.5" />,
  conditional: <GitBranch className="h-3.5 w-3.5" />,
  dependent: <NetworkIcon className="h-3.5 w-3.5" />,
  range: <SlidersHorizontal className="h-3.5 w-3.5" />,
};

interface AddFieldMenuProps {
  onAdd: (type: FieldType) => void;
}

export function AddFieldMenu({ onAdd }: AddFieldMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 shadow-xl border-border/60"
        align="end"
        sideOffset={8}
        side="bottom"
        avoidCollisions
        collisionPadding={16}
      >
        <div className="px-3 pt-3 pb-2 border-b border-border/40">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Choose field type</p>
        </div>
        <ScrollArea className="h-72">
          <div className="p-2">
            {Object.entries(FIELD_TYPE_CATEGORIES).map(([category, types]) => (
              <div key={category} className="mb-3">
                <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{category}</p>
                {types.map(type => (
                  <button
                    key={type}
                    onClick={() => { onAdd(type); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left hover:bg-primary/8 hover:text-primary transition-colors group"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-muted group-hover:bg-primary/15 text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                      {FIELD_ICONS[type] ?? <Plus className="h-3 w-3" />}
                    </span>
                    <span className="font-medium">{FIELD_TYPE_LABELS[type]}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
