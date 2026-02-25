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
  FileUp, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';



// ── Field input preview ───────────────────────────────────────────────────────
function FieldPreview({ field }: { field: FormField }) {
  const base = 'rounded-md border border-border/60 bg-background text-xs text-muted-foreground px-2.5 py-1.5 w-full';

  if (field.type === 'section-break') {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-semibold text-muted-foreground truncate">{field.label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }
  if (field.type === 'page-break') {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <div className="flex-1 border-t-2 border-dashed border-primary/30" />
        <Badge variant="secondary" className="text-[10px] px-2">Page Break</Badge>
        <div className="flex-1 border-t-2 border-dashed border-primary/30" />
      </div>
    );
  }

  switch (field.type) {
    case 'textarea':
      return <div className={`${base} h-14`}>{field.placeholder || 'Text area…'}</div>;
    case 'select':
      return (
        <div className={`${base} flex items-center justify-between`}>
          <span>{field.placeholder || 'Select an option'}</span>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </div>
      );
    case 'radio':
      return (
        <div className="space-y-1">
          {(field.options || []).slice(0, 2).map(o => (
            <div key={o.value} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-3 w-3 rounded-full border border-border/80 shrink-0" />
              {o.label}
            </div>
          ))}
          {(field.options?.length ?? 0) > 2 && <div className="text-[10px] text-muted-foreground pl-5">+{(field.options?.length ?? 0) - 2} more…</div>}
        </div>
      );
    case 'checkbox':
      return (
        <div className="space-y-1">
          {(field.options || []).slice(0, 2).map(o => (
            <div key={o.value} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-3 w-3 rounded-[3px] border border-border/80 shrink-0" />
              {o.label}
            </div>
          ))}
          {(field.options?.length ?? 0) > 2 && <div className="text-[10px] text-muted-foreground pl-5">+{(field.options?.length ?? 0) - 2} more…</div>}
        </div>
      );
    case 'rating':
      return (
        <div className="flex gap-1">
          {Array.from({ length: field.max || 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 text-muted-foreground/30" />
          ))}
        </div>
      );
    case 'range':
      return <div className={`${base} flex items-center gap-2`}><div className="flex-1 h-1.5 bg-border rounded-full"><div className="w-1/3 h-full bg-primary/30 rounded-full" /></div></div>;
    case 'color':
      return <div className={`${base} flex items-center gap-2`}><div className="h-4 w-8 rounded border border-border/60 bg-gradient-to-r from-primary/50 to-secondary/50" /><span>Color</span></div>;
    case 'file':
      return <div className={`${base} border-dashed flex items-center gap-2`}><FileUp className="h-3 w-3" /><span>Upload file…</span></div>;
    case 'signature':
      return <div className={`${base} h-12 border-dashed flex items-center justify-center`}><span className="italic text-[11px]">✍ Signature area</span></div>;
    case 'date': case 'datetime-local': case 'time':
      return <div className={`${base} flex items-center gap-2`}><Calendar className="h-3 w-3" /><span className="text-[11px]">{field.type === 'time' ? 'HH:MM' : 'DD / MM / YYYY'}</span></div>;
    case 'hidden':
      return <div className={`${base} opacity-40 border-dashed`}>Hidden field: {field.name}</div>;
    case 'image':
      return <div className={`${base} h-24 border-dashed flex items-center justify-center bg-muted/30`}><span className="text-xs text-muted-foreground">📷 Image Upload</span></div>;
    case 'video':
      return <div className={`${base} h-24 border-dashed flex items-center justify-center bg-muted/30`}><span className="text-xs text-muted-foreground">🎥 Video Upload</span></div>;
    case 'pdf-viewer':
      return <div className={`${base} h-20 border-dashed flex items-center justify-center bg-muted/30`}><span className="text-xs text-muted-foreground">📄 PDF Viewer</span></div>;
    case 'voice-recording':
      return <div className={`${base} border-dashed flex items-center gap-2`}><span className="text-xs">🎤</span><span className="text-xs text-muted-foreground">Voice Recording</span></div>;
    case 'social-links':
      return <div className={`${base} flex items-center gap-2`}><span className="text-xs">🔗</span><span className="text-xs text-muted-foreground">Social Media Links</span></div>;
    case 'address':
      return <div className={`${base} h-16`}>{field.placeholder || 'Street address, city, state, zip…'}</div>;
    case 'currency':
      return <div className={`${base} flex items-center gap-1`}><span className="text-xs text-muted-foreground">$</span><span>{field.placeholder || '0.00'}</span></div>;
    case 'ranking':
      return <div className="space-y-1"><div className={`${base} text-xs`}>1. Option A</div><div className={`${base} text-xs`}>2. Option B</div><div className={`${base} text-xs`}>3. Option C</div></div>;
    case 'star-rating':
      return <div className="flex gap-1">{Array.from({ length: field.max || 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>;
    case 'opinion-scale':
      return <div className={`${base} flex items-center gap-2`}><span className="text-xs">1</span><div className="flex-1 h-1.5 bg-border rounded-full"><div className="w-1/2 h-full bg-primary/30 rounded-full" /></div><span className="text-xs">10</span></div>;
    case 'date-range':
      return <div className={`${base} flex items-center gap-2`}><Calendar className="h-3 w-3" /><span className="text-[11px]">Start → End Date</span></div>;
    case 'picture-choice':
      return <div className="grid grid-cols-2 gap-1"><div className="aspect-square bg-muted/50 rounded border border-dashed border-border/60 flex items-center justify-center"><span className="text-[10px] text-muted-foreground">📷</span></div><div className="aspect-square bg-muted/50 rounded border border-dashed border-border/60 flex items-center justify-center"><span className="text-[10px] text-muted-foreground">📷</span></div></div>;
    case 'choice-matrix':
      return <div className="space-y-1"><div className="flex gap-1"><span className="text-[10px] w-12">Row 1</span><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-4 h-4 border border-border/60 rounded" />)}</div></div></div>;
    case 'multiselect':
      return <div className={`${base} flex items-center justify-between`}><span>{field.placeholder || 'Select multiple options'}</span><ChevronDown className="h-3 w-3" /></div>;
    case 'switch':
      return <div className="flex items-center gap-2"><div className="w-8 h-4 bg-border/60 rounded-full"><div className="w-3 h-3 bg-white rounded-full ml-0.5" /></div><span className="text-xs text-muted-foreground">Toggle</span></div>;
    case 'subform':
      return <div className={`${base} border-dashed bg-muted/20 h-16 flex items-center justify-center`}><span className="text-xs text-muted-foreground italic">Nested form fields</span></div>;
    case 'section-collapse':
      return <div className={`${base} border-dashed bg-muted/20 h-12 flex items-center justify-center`}><span className="text-xs text-muted-foreground italic">Collapsible section</span></div>;
    case 'divider':
      return <div className="flex items-center gap-2 py-1"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">Divider</span><div className="flex-1 h-px bg-border" /></div>;
    case 'html-snippet':
      return <div className={`${base} border-dashed bg-muted/20 h-12 flex items-center justify-center font-mono text-[10px]`}>&lt;div&gt;HTML Content&lt;/div&gt;</div>;
    case 'submission-picker':
      return <div className={`${base} border-dashed flex items-center gap-2`}><span className="text-xs">📋</span><span className="text-xs text-muted-foreground">Select from previous submissions</span></div>;
    case 'member-search':
      return <div className={`${base} flex items-center gap-2`}><span className="text-xs">👤</span><span className="text-xs text-muted-foreground">Search members…</span></div>;
    case 'momence-sessions':
      return <div className={`${base} flex items-center gap-2`}><span className="text-xs">📅</span><span className="text-xs text-muted-foreground">Select sessions…</span></div>;
    case 'rich-text':
      return <div className={`${base} h-20`}><div className="text-xs text-muted-foreground">Rich text editor with formatting options…</div></div>;
    case 'heading':
      return <div className="text-lg font-bold text-foreground">{field.label || 'Heading'}</div>;
    case 'paragraph':
      return <div className="text-sm text-muted-foreground leading-relaxed">{field.label || 'This is a paragraph of text that can be displayed on the form.'}</div>;
    case 'banner':
      return <div className={`${base} h-16 bg-gradient-to-r from-primary/10 to-secondary/10 border-dashed flex items-center justify-center`}><span className="text-xs text-muted-foreground">🖼️ Banner Image</span></div>;
    default:
      return <div className={base}>{field.placeholder || `${FIELD_TYPE_LABELS[field.type]}…`}</div>;
  }
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
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
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
      }`} style={{ padding: isLayoutField ? undefined : '10px 12px 10px 28px' }}>
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

          <FieldPreview field={field} />
        </div>

        {/* Action buttons */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={onDuplicate}
            className="h-6 w-6 rounded-md border border-border/60 bg-background/90 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            title="Duplicate"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={onEdit}
            className="h-6 w-6 rounded-md border border-border/60 bg-background/90 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="h-6 w-6 rounded-md border border-border/60 bg-background/90 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
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
}

export function FormCanvas({ form, onEdit, onDelete, onDuplicate, onAdd, onReorder }: FormCanvasProps) {
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

  return (
    <>
    <div className="h-[calc(100vh-168px)] overflow-hidden rounded-xl border border-border/60 shadow-sm bg-background">

      {/* ── Canvas Area ────────────────────────────────────────────────────── */}
      <div className="h-full overflow-hidden flex flex-col bg-muted/30">
        <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between bg-background/80">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Canvas — <span className="text-foreground">{form.title}</span>
          </p>
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            {sortedFields.length} field{sortedFields.length !== 1 ? 's' : ''}
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* Form card */}
            <div
              className="w-full rounded-xl overflow-hidden bg-card shadow-xl"
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
                className="px-7 pt-7 pb-4"
                style={{ textAlign: (form.theme.headerAlign || 'center') as any }}
              >
                {form.theme.showLogo && form.theme.logoUrl && (
                  <img
                    src={form.theme.logoUrl}
                    alt="Logo"
                    className="h-10 mx-auto mb-3 object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <h2 className="text-lg font-bold text-foreground leading-snug">{form.title}</h2>
                {form.subHeader && <p className="text-sm font-semibold mt-1.5 leading-snug" style={{ color: form.theme.primaryColor }}>{form.subHeader}</p>}
                {form.description && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{form.description}</p>}
              </div>

              {/* Fields */}
              <div className="px-6 pb-5">
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
                    <div className={gridClass} style={{ gap: fieldGap }}>
                      {sortedFields.map(field => (
                        <CanvasField
                          key={field.id}
                          field={field}
                          formLayout={form.theme.formLayout}
                          onEdit={() => onEdit(field)}
                          onDelete={() => setPendingDeleteId(field.id)}
                          onDuplicate={() => onDuplicate(field.id)}
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
                        <FieldPreview field={activeField} />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              </div>

              {/* Submit button */}
              <div className="px-6 pb-6 pt-1">
                <button
                  type="button"
                  className="w-full rounded-lg py-3 text-sm font-semibold text-white cursor-default leading-snug"
                  style={{ background: primaryGradient }}
                >
                  {form.submitButtonText}
                </button>
              </div>

              {/* Footer */}
              {form.footer && (
                <div className="px-6 pb-5 border-t border-border/40 pt-3 text-center">
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
