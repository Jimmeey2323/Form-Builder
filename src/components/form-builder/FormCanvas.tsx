import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormConfig, FormField, FieldType, FIELD_TYPE_LABELS } from '@/types/formField';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  GripVertical, Pencil, Trash2, Copy,
  ChevronDown, Star, Calendar,
  FileUp, Plus, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateFormHtml } from '@/utils/htmlGenerator';



// ── Real field input preview ───────────────────────────────────────────────────────
function RealFieldPreview({ field, onEdit, onDelete, onDuplicate }: { 
  field: FormField; 
  onEdit: (field: FormField) => void;
  onDelete: (fieldId: string) => void;
  onDuplicate: (fieldId: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const renderFieldInput = () => {
    const baseClasses = "form-input";
    const required = field.isRequired;
    const placeholder = field.placeholder || getDefaultPlaceholder(field.type);

    switch (field.type) {
      case 'textarea':
        return <textarea className={baseClasses} placeholder={placeholder} required={required} />;

      case 'select':
        return (
          <select className={baseClasses} required={required} defaultValue="">
            <option value="" disabled>{placeholder || 'Select an option'}</option>
            {(field.options || []).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {(field.options || []).slice(0, 3).map(o => (
              <label key={o.value} className="radio-option">
                <input type="radio" name={field.id} value={o.value} />
                <span>{o.label}</span>
              </label>
            ))}
            {(field.options?.length ?? 0) > 3 && (
              <div className="help-text">+{(field.options?.length ?? 0) - 3} more options</div>
            )}
          </div>
        );

      case 'checkbox':
        if (field.options && field.options.length > 1) {
          return (
            <div className="checkbox-group">
              {(field.options || []).slice(0, 3).map(o => (
                <label key={o.value} className="checkbox-option">
                  <input type="checkbox" name={field.id} value={o.value} />
                  <span>{o.label}</span>
                </label>
              ))}
              {(field.options?.length ?? 0) > 3 && (
                <div className="help-text">+{(field.options?.length ?? 0) - 3} more options</div>
              )}
            </div>
          );
        } else {
          return (
            <label className="checkbox-option">
              <input type="checkbox" />
              <span>{field.label}</span>
            </label>
          );
        }

      case 'rating':
        return (
          <div className="flex gap-1">
            {Array.from({ length: field.max || 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 text-muted-foreground/40 hover:text-yellow-400 cursor-pointer transition-colors" />
            ))}
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input type="range" className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer" min={field.min || 0} max={field.max || 100} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.min || 0}</span>
              <span>{field.max || 100}</span>
            </div>
          </div>
        );

      case 'color':
        return (
          <div className="flex gap-2 items-center">
            <input type="color" className="w-10 h-8 border border-border rounded cursor-pointer" defaultValue="#000000" />
            <input type="text" className="form-input flex-1" placeholder="#000000" />
          </div>
        );

      case 'file':
        return (
          <div className="border-2 border-dashed border-border rounded-md p-4 text-center hover:border-primary/50 transition-colors">
            <FileUp className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">Choose file or drag here</div>
          </div>
        );

      case 'signature':
        return (
          <div className="border-2 border-dashed border-border rounded-md p-6 text-center bg-muted/20">
            <div className="text-sm text-muted-foreground italic">Signature area</div>
          </div>
        );

      case 'date':
        return <input type="date" className="form-input" required={required} />;

      case 'datetime-local':
        return <input type="datetime-local" className="form-input" required={required} />;

      case 'time':
        return <input type="time" className="form-input" required={required} />;

      case 'hidden':
        return (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border border-dashed border-border">
            <div className="text-xs text-muted-foreground">Hidden field:</div>
            <code className="text-xs bg-background px-1 py-0.5 rounded">{field.name}</code>
          </div>
        );

      case 'image':
        return (
          <div className="border-2 border-dashed border-border rounded-md p-6 text-center bg-muted/20">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm text-muted-foreground">Image Upload</div>
          </div>
        );

      case 'video':
        return (
          <div className="border-2 border-dashed border-border rounded-md p-6 text-center bg-muted/20">
            <div className="text-2xl mb-2">🎥</div>
            <div className="text-sm text-muted-foreground">Video Upload</div>
          </div>
        );

      case 'pdf-viewer':
        return (
          <div className="border-2 border-dashed border-border rounded-md p-6 text-center bg-muted/20">
            <div className="text-2xl mb-2">📄</div>
            <div className="text-sm text-muted-foreground">PDF Viewer</div>
          </div>
        );

      case 'voice-recording':
        return (
          <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-muted/20">
            <div className="text-lg">🎤</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Voice Recording</div>
              <div className="text-xs text-muted-foreground">Click to start recording</div>
            </div>
          </div>
        );

      case 'social-links':
        return (
          <div className="space-y-2">
            <input type="url" className={baseClasses} placeholder="https://facebook.com/yourpage" />
            <input type="url" className={baseClasses} placeholder="https://twitter.com/yourhandle" />
            <input type="url" className={baseClasses} placeholder="https://instagram.com/yourprofile" />
          </div>
        );

      case 'address':
        return <textarea className={`${baseClasses} min-h-[100px] resize-none`} placeholder={placeholder || "Street address, city, state, zip…"} required={required} />;

      case 'currency':
        return (
          <div className="flex gap-1">
            <div className="flex items-center px-3 py-2 border border-border rounded-l-md bg-muted text-muted-foreground text-sm">$</div>
            <input type="number" className={`${baseClasses} rounded-l-none rounded-r-md`} placeholder="0.00" min="0" step="0.01" required={required} />
          </div>
        );

      case 'ranking':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-2 border border-border rounded text-sm">
              <span className="w-6 h-6 rounded bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
              Option A
            </div>
            <div className="flex items-center gap-2 p-2 border border-border rounded text-sm">
              <span className="w-6 h-6 rounded bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
              Option B
            </div>
            <div className="flex items-center gap-2 p-2 border border-border rounded text-sm">
              <span className="w-6 h-6 rounded bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
              Option C
            </div>
          </div>
        );

      case 'star-rating':
        return (
          <div className="flex gap-1">
            {Array.from({ length: field.max || 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        );

      case 'opinion-scale':
        return (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
            <div className="flex justify-between gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <button key={i} className="w-8 h-8 rounded-full border border-border hover:border-primary hover:bg-primary/10 text-xs font-medium transition-colors">
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        );

      case 'date-range':
        return (
          <div className="flex gap-2">
            <input type="date" className="form-input" placeholder="Start date" />
            <input type="date" className="form-input" placeholder="End date" />
          </div>
        );

      case 'picture-choice':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="text-center">
                <div className="text-lg mb-1">📷</div>
                <div className="text-xs text-muted-foreground">Option A</div>
              </div>
            </div>
            <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="text-center">
                <div className="text-lg mb-1">📷</div>
                <div className="text-xs text-muted-foreground">Option B</div>
              </div>
            </div>
          </div>
        );

      case 'choice-matrix':
        return (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground mb-2">Rate each option:</div>
            <div className="grid grid-cols-6 gap-1 text-xs">
              <div></div>
              <div className="text-center">1</div>
              <div className="text-center">2</div>
              <div className="text-center">3</div>
              <div className="text-center">4</div>
              <div className="text-center">5</div>
              <div className="py-1">Row 1</div>
              <div className="flex justify-center"><input type="radio" name="row1" className="w-3 h-3" /></div>
              <div className="flex justify-center"><input type="radio" name="row1" className="w-3 h-3" /></div>
              <div className="flex justify-center"><input type="radio" name="row1" className="w-3 h-3" /></div>
              <div className="flex justify-center"><input type="radio" name="row1" className="w-3 h-3" /></div>
              <div className="flex justify-center"><input type="radio" name="row1" className="w-3 h-3" /></div>
            </div>
          </div>
        );

      case 'multiselect':
        return (
          <select className="form-input" multiple size={4} required={required}>
            {(field.options || []).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );

      case 'switch':
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-5 bg-border rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
            </div>
            <span className="text-sm text-foreground">{field.label}</span>
          </div>
        );

      case 'multiple-choice':
        return (
          <div className="checkbox-group">
            {(field.options || []).slice(0, 3).map(o => (
              <label key={o.value} className="checkbox-option">
                <input type="checkbox" name={field.id} value={o.value} />
                <span>{o.label}</span>
              </label>
            ))}
            {(field.options?.length ?? 0) > 3 && (
              <div className="help-text">+{(field.options?.length ?? 0) - 3} more options</div>
            )}
          </div>
        );

      case 'subform':
        return (
          <div className="border border-border rounded-md p-4 bg-muted/20">
            <div className="text-sm text-muted-foreground text-center">Subform: {field.label}</div>
          </div>
        );

      case 'section-collapse':
        return (
          <div className="border border-border rounded-md">
            <div className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer">
              <span className="font-medium text-sm">{field.label}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        );

      case 'divider':
        return <div className="border-t border-border my-4"></div>;

      case 'html-snippet':
        return (
          <div className="border border-border rounded-md p-4 bg-muted/20">
            <div className="text-sm text-muted-foreground text-center">Custom HTML: {field.label}</div>
          </div>
        );

      case 'submission-picker':
        return (
          <select className="form-input" required={required} defaultValue="">
            <option value="" disabled>Select a submission</option>
            <option value="sub1">Submission 1</option>
            <option value="sub2">Submission 2</option>
          </select>
        );

      case 'momence-sessions':
        return (
          <select className="form-input" required={required} defaultValue="">
            <option value="" disabled>Select a session</option>
            <option value="session1">Morning Session</option>
            <option value="session2">Afternoon Session</option>
          </select>
        );

      case 'rich-text':
        return (
          <div className="border border-border rounded-md p-3 bg-background min-h-[100px]">
            <div className="text-sm text-muted-foreground">Rich text editor content area</div>
          </div>
        );

      case 'heading':
        return <h2 className="text-xl font-bold text-foreground mb-2">{field.label}</h2>;

      case 'paragraph':
        return <p className="text-sm text-muted-foreground mb-4">{field.helpText || field.label}</p>;

      case 'banner':
        return (
          <div className="bg-primary/10 border border-primary/20 rounded-md p-4 text-center">
            <div className="text-lg font-semibold text-primary">{field.label}</div>
            {field.helpText && <div className="text-sm text-primary/80 mt-1">{field.helpText}</div>}
          </div>
        );

      default:
        return <input type="text" className="form-input" placeholder={placeholder} required={required} />;
    }
  };

  function getDefaultPlaceholder(type: FieldType): string {
    const placeholders: Record<string, string> = {
      text: 'Enter text here',
      email: 'your@email.com',
      tel: '+1 (555) 123-4567',
      number: '123',
      url: 'https://example.com',
      password: 'Enter password',
      textarea: 'Enter your message here',
      select: 'Select an option',
      date: 'Select date',
      'datetime-local': 'Select date and time',
      time: 'Select time',
      file: 'Choose file',
      color: '#000000',
      range: 'Select value',
      hidden: 'Hidden field',
    };
    return placeholders[type] || 'Enter value';
  }

  return (
    <div 
      className="form-group relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Field Label */}
      <label className="block">
        {field.label}
        {field.isRequired && <span className="required">*</span>}
      </label>

      {/* Help Text */}
      {field.helpText && (
        <span className="help-text">{field.helpText}</span>
      )}

      {/* Field Input */}
      <div className="relative mt-1">
        {renderFieldInput()}
        
        {/* Edit Overlay */}
        <div className={`absolute inset-0 bg-black/5 rounded-md transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm"
              onClick={() => onEdit(field)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm"
              onClick={() => onDuplicate(field.id)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm"
              onClick={() => onDelete(field.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Width string → Tailwind col-span class (safe static map for purge)
const COL_SPAN_MAP: Record<string, string> = {
  '100': 'col-span-12',
  '75':  'col-span-9',
  '66':  'col-span-8',
  '50':  'col-span-6',
  '33':  'col-span-4',
  '25':  'col-span-3',
};

function fieldColSpan(field: FormField, formLayout?: string): string {
  if (field.type === 'section-break' || field.type === 'page-break') return 'col-span-12';
  if (field.width && field.width !== '100') return COL_SPAN_MAP[field.width] ?? 'col-span-12';
  // Fall back to form-level layout default
  if (formLayout === 'two-column')   return 'col-span-6';
  if (formLayout === 'three-column') return 'col-span-4';
  return 'col-span-12';
}

// ── Sortable canvas field card ────────────────────────────────────────────────
function CanvasField({
  field,
  formLayout,
  onEdit,
  onDelete,
  onDuplicate,
  insertDropActive,
}: {
  field: FormField;
  formLayout?: string;
  onEdit: (field: FormField) => void;
  onDelete: (fieldId: string) => void;
  onDuplicate: (fieldId: string) => void;
  insertDropActive: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const colSpan = fieldColSpan(field, formLayout);
  const isLayoutField = field.type === 'section-break' || field.type === 'page-break';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${colSpan} ${isDragging ? 'opacity-30 z-50' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drop-before indicator */}
      {insertDropActive && (
        <div className="h-1 rounded-full bg-primary/60 mb-1.5 mx-2 transition-all" />
      )}

      <div className={`group relative rounded-xl border-2 transition-all ${
        isLayoutField
          ? 'border-dashed border-border/50 bg-muted/20 p-2.5'
          : `bg-card ${ hovered ? 'border-primary/30 shadow-md' : 'border-border/40 shadow-sm'}`
      }`} style={{ padding: isLayoutField ? undefined : '16px 20px 16px 44px' }}>
        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-opacity z-10"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div>
          {!isLayoutField && (
            <div className="flex items-center gap-1.5 mb-2 leading-snug">
              <span className="text-xs font-semibold text-foreground/85">
                {field.label}
              </span>
              {field.isRequired && <span className="text-xs text-destructive font-bold leading-none">*</span>}
              {field.isHidden && <Badge variant="secondary" className="text-[9px] px-1 py-0 leading-none">hidden</Badge>}
              <span className="ml-auto text-[9px] text-muted-foreground/50 font-mono uppercase tracking-wide">{field.type}</span>
            </div>
          )}

          <RealFieldPreview field={field} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
        </div>

        {/* Action buttons - now handled by RealFieldPreview overlay */}
      </div>
    </div>
  );
}

// ── Drop zone (empty canvas or after all fields) ──────────────────────────────
function DropZone({ onDrop }: { onDrop: (type: FieldType) => void }) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`col-span-12 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center py-5 gap-2 cursor-default ${
        over ? 'border-primary bg-primary/5' : 'border-border/50 bg-muted/20'
      }`}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        setOver(false);
        const t = e.dataTransfer.getData('palette-field-type') as FieldType;
        if (t) onDrop(t);
      }}
    >
      <Plus className={`h-5 w-5 ${over ? 'text-primary' : 'text-muted-foreground/40'}`} />
      <p className={`text-xs font-medium ${over ? 'text-primary' : 'text-muted-foreground/50'}`}>
        {over ? 'Release to add field' : 'Drag a field here'}
      </p>
    </div>
  );
}

// ── Main FormCanvas component ─────────────────────────────────────────────────
interface FormCanvasProps {
  form: FormConfig;
  onEdit: (field: FormField) => void;
  onDelete: (fieldId: string) => void;
  onDuplicate: (fieldId: string) => void;
  onAdd: (type: FieldType) => void;
  onReorder: (orderedIds: string[]) => void;
  isLocked?: boolean;
}

export function FormCanvas({ form, onEdit, onDelete, onDuplicate, onAdd, onReorder, isLocked }: FormCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sortedFields.map(f => f.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx !== -1 && newIdx !== -1) {
      onReorder(arrayMove(ids, oldIdx, newIdx));
    }
  };

  // Handle HTML5 drag-from-palette drop anywhere on the canvas
  const handleCanvasDrop = useCallback((type: FieldType) => {
    onAdd(type);
  }, [onAdd]);

  const activeField = activeId ? sortedFields.find(f => f.id === activeId) : null;

  const fieldGap = form.theme.fieldGap || '16px';
  const gridClass = (() => {
    switch (form.theme.formLayout) {
      case 'two-column':   return 'grid grid-cols-12 gap-x-3';
      case 'three-column': return 'grid grid-cols-12 gap-x-3';
      default:             return 'grid grid-cols-12';
    }
  })();

  const primaryGradient = `linear-gradient(135deg, ${form.theme.primaryColor} 0%, ${form.theme.secondaryColor} 100%)`;

  // CSS for matching preview styling
  const formCss = `
    .form-canvas-wrapper {
      --primary-color: ${form.theme.primaryColor};
      --secondary-color: ${form.theme.secondaryColor};
      --primary-gradient: linear-gradient(135deg, ${form.theme.primaryColor} 0%, ${form.theme.secondaryColor} 100%);
      --text-primary: ${form.theme.textColor};
      --text-secondary: #64748b;
      --text-light: #94a3b8;
      --bg-primary: ${form.theme.formBackgroundColor};
      --bg-secondary: #f8fafc;
      --border-color: ${form.theme.inputBorderColor};
      --border-focus: ${form.theme.primaryColor};
      --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
      --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
      --radius: ${form.theme.borderRadius};
    }
    .form-canvas-wrapper * { box-sizing: border-box; }
    .form-canvas-wrapper .form-fields-grid {
      display: grid;
      ${form.theme.formLayout === 'two-column' ? 'grid-template-columns: repeat(2, 1fr);' : form.theme.formLayout === 'three-column' ? 'grid-template-columns: repeat(3, 1fr);' : 'grid-template-columns: 1fr;'}
      gap: ${form.theme.fieldGap || '16px'};
    }
    .form-canvas-wrapper .form-group {
      line-height: ${form.theme.lineHeight || '1.6'};
    }
    .form-canvas-wrapper .form-group label {
      display: block;
      font-size: ${form.theme.labelFontSize};
      font-weight: 500;
      color: ${form.theme.labelColor};
      text-align: ${form.theme.labelAlign || 'left'};
      margin-bottom: 6px;
    }
    .form-canvas-wrapper .required { color: #ef4444; margin-left: 2px; }
    .form-canvas-wrapper .form-input {
      width: 100%;
      padding: ${form.theme.inputPadding};
      border: 2px solid var(--border-color);
      border-radius: 8px;
      font-family: inherit;
      font-size: ${form.theme.inputFontSize};
      background: ${form.theme.inputBackgroundColor};
      color: var(--text-primary);
      transition: all 0.2s ease;
    }
    .form-canvas-wrapper .form-input:focus {
      outline: none;
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px ${form.theme.primaryColor}1a;
    }
    .form-canvas-wrapper .form-input::placeholder { color: var(--text-light); }
    .form-canvas-wrapper select.form-input {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8l4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 12px center;
      background-repeat: no-repeat;
      background-size: 16px;
      padding-right: 40px;
    }
    .form-canvas-wrapper textarea.form-input { resize: vertical; min-height: 100px; }
    .form-canvas-wrapper .help-text { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
    .form-canvas-wrapper .radio-group, .form-canvas-wrapper .checkbox-group { display: flex; flex-direction: column; gap: 8px; }
    .form-canvas-wrapper .radio-option, .form-canvas-wrapper .checkbox-option {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; cursor: pointer; padding: 10px 14px;
      border: 2px solid var(--border-color); border-radius: 8px;
      transition: all 0.15s ease;
    }
    .form-canvas-wrapper .radio-option:hover, .form-canvas-wrapper .checkbox-option:hover { 
      border-color: var(--border-focus); background: var(--bg-secondary); 
    }
    .form-canvas-wrapper .section-break {
      margin: 8px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border-color);
      grid-column: 1 / -1;
    }
    .form-canvas-wrapper .section-break h3 { font-size: 16px; font-weight: 600; }
    .form-canvas-wrapper .submit-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: var(--primary-gradient);
      color: ${form.theme.buttonTextColor};
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-md);
    }
    .form-canvas-wrapper .submit-btn:hover { 
      transform: translateY(-2px); 
      box-shadow: var(--shadow-lg); 
    }
    @media (max-width: 640px) {
      .form-canvas-wrapper .form-fields-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <>
    <style>{formCss}</style>
    <div className="h-[calc(100vh-168px)] overflow-hidden rounded-xl border border-border/60 shadow-sm bg-background">

      {/* ── Canvas Area ────────────────────────────────────────────────────── */}
      <div className="h-full overflow-hidden flex flex-col bg-muted/30">
        <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between bg-background/80">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Canvas — <span className="text-foreground">{form.title}</span>
          </p>
          <div className="flex items-center gap-2">
            {isLocked && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                <Lock className="h-2.5 w-2.5" /> Locked — read only
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60 font-mono">
              {sortedFields.length} field{sortedFields.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* Form card */}
            <div
              className="w-full rounded-xl overflow-hidden bg-card shadow-xl form-canvas-wrapper"
              style={{ maxWidth: form.theme.formMaxWidth || '100%', lineHeight: form.theme.lineHeight || '1.6' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const t = e.dataTransfer.getData('palette-field-type') as FieldType;
                if (t) handleCanvasDrop(t);
              }}
            >
              {/* Top accent bar */}
              <div className="h-1" style={{ background: primaryGradient }} />

              {/* Header */}
              <div
                className="px-8 pt-8 pb-6 bg-muted"
                style={{ textAlign: (form.theme.headerAlign || 'center') as any, borderBottom: `1px solid ${form.theme.inputBorderColor}` }}
              >
                {form.theme.showLogo && form.theme.logoUrl && (
                  <img
                    src={form.theme.logoUrl}
                    alt="Logo"
                    className="h-12 mx-auto mb-4 object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <h2 className="text-2xl font-bold text-foreground leading-snug">{form.title}</h2>
                {form.subHeader && <p className="text-sm font-semibold mt-2 leading-snug" style={{ color: form.theme.primaryColor }}>{form.subHeader}</p>}
                {form.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{form.description}</p>}
              </div>

              {/* Fields */}
              <div className="px-8 pb-8">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedFields.map(f => f.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="form-fields-grid">
                      {sortedFields.map(field => (
                        <CanvasField
                          key={field.id}
                          field={field}
                          formLayout={form.theme.formLayout}
                          onEdit={(field) => onEdit(field)}
                          onDelete={(fieldId) => setPendingDeleteId(fieldId)}
                          onDuplicate={(fieldId) => onDuplicate(fieldId)}
                          insertDropActive={false}
                        />
                      ))}

                      {/* Drop zone always visible at the bottom */}
                      <DropZone onDrop={handleCanvasDrop} />
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeField && (
                      <div className="rounded-xl border-2 border-primary bg-card shadow-xl p-3 opacity-90 w-48">
                        <div className="text-[11px] font-semibold text-foreground/80 mb-1.5">{activeField.label}</div>
                        <RealFieldPreview field={activeField} onEdit={() => {}} onDelete={() => {}} onDuplicate={() => {}} />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              </div>

              {/* Submit button */}
              <div className="px-8 pb-8 pt-2">
                <button
                  type="button"
                  className="w-full rounded-lg py-3 px-6 text-sm font-semibold text-white cursor-default leading-snug transition-all hover:opacity-90"
                  style={{ background: primaryGradient }}
                >
                  {form.submitButtonText}
                </button>
              </div>

              {/* Footer */}
              {form.footer && (
                <div className="px-8 pb-6 border-t border-border/40 pt-4 text-center">
                  <p className="text-xs text-muted-foreground leading-relaxed">{form.footer}</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>

    {/* Field delete confirmation */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={open => { if (!open) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete field?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteId && (() => {
                const f = form.fields.find(x => x.id === pendingDeleteId);
                return f ? <><strong>{f.label}</strong> will be permanently removed from this form.</> : 'This cannot be undone.';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId) { onDelete(pendingDeleteId); }
                setPendingDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
