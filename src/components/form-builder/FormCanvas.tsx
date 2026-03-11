import { useState, useCallback, Fragment, useEffect, MouseEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
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
import { FormConfig, FormField, FieldType, FIELD_TYPE_LABELS, LikertColumn } from '@/types/formField';
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
  FileUp, Plus, Lock, BookOpen, SplitSquareVertical,
  Heart, ThumbsUp, Flame, Smile, Award, Sun, Zap, Shield, Target, Code2,
  Dumbbell, Bike, Trophy, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHeroForPage, resolveHeroBackgroundStyle } from '@/utils/heroImageConfig';
import {
  getChoiceMatrixColumns,
  getFieldControlClassNames,
  getFieldWrapperClassNames,
} from '@/utils/formFieldStyling';

// ── Rating icon map ───────────────────────────────────────────────────────────────
const RATING_ICON_MAP: Record<string, typeof Star> = {
  star: Star,
  heart: Heart,
  'thumbs-up': ThumbsUp,
  flame: Flame,
  smile: Smile,
  zap: Zap,
  award: Award,
  shield: Shield,
  sun: Sun,
  target: Target,
  dumbbell: Dumbbell,
  bike: Bike,
  trophy: Trophy,
  activity: Activity,
};

// ── Real field input preview ───────────────────────────────────────────────────────
function RealFieldPreview({ field, onEdit, onDelete, onDuplicate }: { 
  field: FormField; 
  onEdit: (field: FormField) => void;
  onDelete: (fieldId: string) => void;
  onDuplicate: (fieldId: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(() => {
    const v = Number(field.defaultValue);
    return Number.isFinite(v) ? v : 0;
  });
  const [rangeValue, setRangeValue] = useState<number | null>(null);
  const [collapseOpen, setCollapseOpen] = useState<boolean>(field.collapseDefaultOpen ?? false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    const v = Number(field.defaultValue);
    if (field.type === 'star-rating') {
      setRatingValue(Number.isFinite(v) ? v : (field.max || 5));
    } else {
      setRatingValue(Number.isFinite(v) ? v : 0);
    }
    setRangeValue(null);
    setCollapseOpen(field.collapseDefaultOpen ?? false);
    setPasswordVisible(false);
  }, [field.id, field.defaultValue, field.collapseDefaultOpen, field.type, field.max]);

  const fieldWrapperClassName = getFieldWrapperClassNames(field, ['form-group', 'canvas-field-shell']);
  const baseClasses = getFieldControlClassNames(field.type, ['form-input']);

  const renderFieldInput = () => {
    const required = field.isRequired;
    const placeholder = field.placeholder || getDefaultPlaceholder(field.type);

    switch (field.type) {
      case 'textarea':
        return <textarea className={baseClasses} placeholder={placeholder} required={required} />;

      case 'email-otp':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input type="email" className={getFieldControlClassNames(field.type, ['form-input', 'email-otp-email'])} placeholder={placeholder || 'name@example.com'} required={required} />
              <button type="button" className="px-3 py-2 text-xs rounded-md border border-border bg-muted whitespace-nowrap">Send OTP</button>
            </div>
            <div className="flex gap-2">
              <input type="text" className={getFieldControlClassNames(field.type, ['form-input', 'email-otp-code'])} placeholder="Enter OTP" />
              <button type="button" className="px-3 py-2 text-xs rounded-md border border-border bg-muted whitespace-nowrap">Verify</button>
            </div>
          </div>
        );

      case 'tel':
        return (
          <div className="phone-input-group">
            <select className={`${baseClasses} country-code-select`} defaultValue="+91">
              <option value="+91">India (+91)</option>
              <option value="+1">United States (+1)</option>
              <option value="+44">United Kingdom (+44)</option>
              <option value="+971">UAE (+971)</option>
              <option value="+65">Singapore (+65)</option>
              <option value="+61">Australia (+61)</option>
              <option value="+49">Germany (+49)</option>
              <option value="+33">France (+33)</option>
              <option value="+81">Japan (+81)</option>
            </select>
            <input type="tel" className={`${baseClasses} phone-number-input`} placeholder={placeholder || 'Phone number'} required={required} />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-1.5">
            <select className={baseClasses} required={required} defaultValue="">
              <option value="" disabled>{placeholder || 'Select an option'}</option>
              {(field.options || []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              {field.allowOther && <option value="__other__">Other…</option>}
            </select>
            {field.allowOther && (
              <input type="text" className={`${baseClasses} text-muted-foreground`} placeholder="Specify other…" disabled />
            )}
          </div>
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
            {field.allowOther && (
              <label className="radio-option">
                <input type="radio" name={field.id} value="__other__" />
                <span className="flex items-center gap-2">Other… <input type="text" className={getFieldControlClassNames(field.type, ['form-input', 'text-xs', 'py-1', 'px-2', 'h-7'])} placeholder="Specify…" disabled style={{ width: '120px' }} /></span>
              </label>
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

      case 'checkboxes':
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
            {field.allowOther && (
              <label className="checkbox-option">
                <input type="checkbox" name={field.id} value="__other__" />
                <span className="flex items-center gap-2">Other… <input type="text" className="form-input text-xs py-1 px-2 h-7" placeholder="Specify…" disabled style={{ width: '120px' }} /></span>
              </label>
            )}
          </div>
        );

      case 'rating': {
        const count = field.max || 5;
        const IconComp = RATING_ICON_MAP[field.ratingIcon || 'star'] || Star;
        return (
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: count }).map((_, i) => {
              const val = i + 1;
              const active = ratingValue >= val;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRatingValue(val)}
                  className="p-0.5"
                  aria-label={`Set rating to ${val}`}
                >
                  <IconComp className={`h-6 w-6 transition-colors ${active ? 'text-yellow-400' : 'text-muted-foreground/25'}`} />
                </button>
              );
            })}
          </div>
        );
      }

      case 'range': {
        const minR = field.min ?? 0;
        const maxR = field.max ?? 100;
        const midVal = Math.round((minR + maxR) / 2);
        const parsedDefault = Number(field.defaultValue);
        const initialVal = Number.isFinite(parsedDefault) ? parsedDefault : midVal;
        const currentVal = rangeValue ?? initialVal;
        const suffix = field.rangeValueSuffix || '';
        return (
          <div className="space-y-2.5">
            <input
              type="range"
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
              min={minR}
              max={maxR}
              value={currentVal}
              step={field.step || 1}
              onChange={e => setRangeValue(Number(e.target.value))}
            />
            {field.rangeShowValue !== false && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">{minR}{suffix}</span>
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20">{currentVal}{suffix}</span>
                <span className="text-muted-foreground font-mono">{maxR}{suffix}</span>
              </div>
            )}
          </div>
        );
      }

      case 'color':
        return (
          <div className="flex gap-2 items-center">
            <input type="color" className="w-10 h-8 border border-border rounded cursor-pointer" defaultValue="#000000" />
            <input type="text" className={`${baseClasses} flex-1`} placeholder="#000000" />
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
        const sigHeight = field.signatureHeight ?? 200;
        return (
          <div className="border-2 border-dashed border-border rounded-md p-6 text-center bg-muted/20" style={{ height: sigHeight }}>
            <div className="text-sm text-muted-foreground italic">Signature area</div>
          </div>
        );
      case 'password':
        return (
          <div className="flex items-center gap-2">
            <input type={passwordVisible ? 'text' : 'password'} className={`${baseClasses} flex-1`} placeholder={placeholder || 'Enter password'} required={required} />
            {(field.passwordReveal ?? true) && (
              <button
                type="button"
                onClick={() => setPasswordVisible(v => !v)}
                className="px-2.5 py-2 text-xs rounded-md border border-border bg-muted hover:bg-muted/70"
              >
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
        );

      case 'date':
        return <input type="date" className={baseClasses} required={required} />;

      case 'datetime-local':
        return <input type="datetime-local" className={baseClasses} required={required} />;

      case 'time':
        return <input type="time" className={baseClasses} required={required} />;

      case 'hidden':
        return (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border border-dashed border-border">
            <div className="text-xs text-muted-foreground">Hidden field:</div>
            <code className="text-xs bg-background px-1 py-0.5 rounded">{field.name}</code>
          </div>
        );

      case 'image':
        const imgSrc = field.defaultValue || field.placeholder || '';
        const imgAlt = field.helpText || field.label || 'Image';
        return (
          imgSrc ? (
            <div className="border border-border rounded-md overflow-hidden bg-muted/10">
              <img src={imgSrc} alt={imgAlt} className="w-full h-auto block" />
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-md p-6 text-center bg-muted/20">
              <div className="text-2xl mb-2">📷</div>
              <div className="text-sm text-muted-foreground">Image URL not set</div>
            </div>
          )
        );

      case 'video':
        const vidSrc = field.defaultValue || field.placeholder || '';
        const isYoutube = vidSrc.includes('youtube.com') || vidSrc.includes('youtu.be');
        const isVimeo = vidSrc.includes('vimeo.com');
        let embedUrl = vidSrc;
        if (isYoutube) {
          const match = vidSrc.match(/(?:v=|youtu\.be\/)([^&?#]+)/);
          if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
        } else if (isVimeo) {
          const match = vidSrc.match(/vimeo\.com\/(\d+)/);
          if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
        }
        return (
          vidSrc ? (
            <div className="border border-border rounded-md overflow-hidden bg-muted/10">
              {isYoutube || isVimeo ? (
                <iframe
                  src={embedUrl}
                  className="w-full aspect-video"
                  allowFullScreen
                  title={field.label}
                />
              ) : (
                <video src={vidSrc} controls className="w-full" />
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-md p-6 text-center bg-muted/20">
              <div className="text-2xl mb-2">🎥</div>
              <div className="text-sm text-muted-foreground">Video URL not set</div>
            </div>
          )
        );

      case 'pdf-viewer':
        const pdfSrc = field.defaultValue || field.placeholder || '';
        return (
          pdfSrc ? (
            <div className="border border-border rounded-md overflow-hidden bg-muted/10">
              <iframe src={pdfSrc} className="w-full h-64" title={field.label} />
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-md p-6 text-center bg-muted/20">
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm text-muted-foreground">PDF URL not set</div>
            </div>
          )
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
        const rankOptions = (field.options && field.options.length > 0)
          ? field.options
          : [
              { label: 'Option A', value: 'option_a' },
              { label: 'Option B', value: 'option_b' },
              { label: 'Option C', value: 'option_c' },
            ];
        return (
          <div className="space-y-1">
            {rankOptions.slice(0, 4).map((opt, i) => (
              <div key={opt.value} className="flex items-center gap-2 p-2 border border-border rounded text-sm">
                <span className="w-6 h-6 rounded bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{i + 1}</span>
                {opt.label}
              </div>
            ))}
          </div>
        );

      case 'star-rating': {
        const count = field.max || 5;
        const IconComp = RATING_ICON_MAP[field.ratingIcon || 'star'] || Star;
        return (
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: count }).map((_, i) => {
              const val = i + 1;
              const active = ratingValue >= val;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRatingValue(val)}
                  className="p-0.5"
                  aria-label={`Set rating to ${val}`}
                >
                  <IconComp className={`h-6 w-6 ${active ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/25'}`} />
                </button>
              );
            })}
          </div>
        );
      }

      case 'opinion-scale':
        const scaleMin = field.min ?? 1;
        const scaleMax = field.max ?? 10;
        return (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
            <div className="flex justify-between gap-1">
              {Array.from({ length: scaleMax - scaleMin + 1 }).map((_, i) => (
                <button key={i} className="w-8 h-8 rounded-full border border-border hover:border-primary hover:bg-primary/10 text-xs font-medium transition-colors">
                  {scaleMin + i}
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
        const picOptions = (field.options && field.options.length > 0)
          ? field.options
          : [
              { label: 'Option A', value: 'option_a' },
              { label: 'Option B', value: 'option_b' },
            ];
        const isImgUrl = (val?: string) => !!val && (val.startsWith('http') || val.startsWith('data:image'));
        return (
          <div className="grid grid-cols-2 gap-2">
            {picOptions.slice(0, 4).map(opt => {
              const src = opt.imageUrl || (isImgUrl(opt.label) ? opt.label : '');
              return (
                <div key={opt.value} className="relative aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/20 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
                  {src ? (
                    <>
                      <img src={src} alt={opt.label} className="w-full h-full object-cover" />
                      {opt.label && !isImgUrl(opt.label) && (
                        <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white bg-black/40 rounded px-1 py-0.5 text-center">
                          {opt.label}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center px-2">
                      <div className="text-lg mb-1">📷</div>
                      <div className="text-xs text-muted-foreground">{opt.label}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'choice-matrix':
        const cmCols = getChoiceMatrixColumns(field);
        const cmRows = field.options && field.options.length > 0 ? field.options : [
          { label: 'Row 1', value: 'row1' },
          { label: 'Row 2', value: 'row2' },
        ];
        return (
          <div className="choice-matrix-group">
            <div className="choice-matrix-scale-labels">
              <span>{field.choiceMatrixMinLabel || 'Lowest'}</span>
              <span>{field.choiceMatrixMaxLabel || 'Highest'}</span>
            </div>
            <div
              className="choice-matrix-grid"
              style={{ gridTemplateColumns: `minmax(160px, 1.4fr) repeat(${cmCols.length}, minmax(56px, 1fr))` }}
            >
              <div className="choice-matrix-corner"></div>
              {cmCols.map(c => (
                <div key={`cmc_${c}`} className="choice-matrix-col">{c}</div>
              ))}
              {cmRows.map(row => (
                <Fragment key={row.value}>
                  <div className="choice-matrix-row">{row.label}</div>
                  {cmCols.map(c => (
                    <div key={`${row.value}_${c}`} className="flex justify-center">
                      <label className="choice-matrix-choice">
                        <input type="radio" name={row.value} className="sr-only" />
                        <span className="choice-matrix-choice-pill">{c}</span>
                      </label>
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        );

      case 'multiselect':
        return (
          <div className="space-y-1.5">
            <select className={baseClasses} multiple size={Math.min((field.options?.length ?? 0) + (field.allowOther ? 1 : 0), 5) || 4} required={required}>
              {(field.options || []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              {field.allowOther && <option value="__other__">Other…</option>}
            </select>
            {field.allowOther && (
              <input type="text" className={`${baseClasses} text-muted-foreground`} placeholder="Specify other…" disabled />
            )}
          </div>
        );

      case 'switch':
        return (
          <label className="switch-group">
            <input type="checkbox" defaultChecked={field.switchDefaultOn} className="sr-only" />
            <span className="switch-slider"></span>
            <span className="switch-label">{field.label}</span>
            {(field.switchOnLabel || field.switchOffLabel) && (
              <span className="switch-state-labels">
                <span className="switch-off-lbl">{field.switchOffLabel || ''}</span>
                <span className="switch-on-lbl">{field.switchOnLabel || ''}</span>
              </span>
            )}
          </label>
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
            {field.allowOther && (
              <label className="checkbox-option">
                <input type="checkbox" name={field.id} value="__other__" />
                <span className="flex items-center gap-2">Other… <input type="text" className={getFieldControlClassNames(field.type, ['form-input', 'text-xs', 'py-1', 'px-2', 'h-7'])} placeholder="Specify…" disabled style={{ width: '120px' }} /></span>
              </label>
            )}
          </div>
        );

      case 'subform':
        const subformId = field.subformTemplateId;
        return (
          <div className="border border-border rounded-md p-4 bg-muted/20">
            <div className="text-sm text-muted-foreground text-center">Subform: {field.label}</div>
            <div className="text-[11px] text-muted-foreground/70 text-center mt-1">
              {subformId ? `Template ID: ${subformId}` : 'No template linked'}
            </div>
          </div>
        );

      case 'section-collapse':
        return (
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setCollapseOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground">{field.label || 'Collapsible Section'}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${collapseOpen ? 'rotate-180' : ''}`} />
            </button>
            {collapseOpen && (
              <div className="px-3 py-2.5 border-t border-border bg-muted/10">
                <p className="text-xs text-muted-foreground italic">{field.collapseDescription || field.helpText || 'Content area — fields placed here will toggle visibility'}</p>
              </div>
            )}
          </div>
        );

      case 'divider':
        return (
          <div
            className="my-4"
            style={{
              borderTop: `${field.dividerThickness ?? 1}px ${field.dividerStyle ?? 'solid'} hsl(var(--border))`,
            }}
          />
        );

      case 'spacer': {
        const height = field.spacerHeight || field.helpText || '20px';
        return <div style={{ height }} />;
      }

      case 'html-snippet':
        return (
          <div className="border border-border rounded-md overflow-hidden text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800">
              <Code2 className="h-3 w-3 text-slate-400" />
              <span className="font-mono font-semibold text-slate-400 text-[10px]">HTML · {field.label}</span>
            </div>
            <pre className="p-3 font-mono text-green-400/90 bg-slate-900 overflow-auto max-h-[90px] leading-relaxed whitespace-pre-wrap break-all">
              {field.htmlContent || '<div>\n  <!-- Your HTML here -->\n</div>'}
            </pre>
          </div>
        );

      case 'submission-picker':
        return (
          <select className="form-input" required={required} defaultValue="">
            <option value="" disabled>{field.placeholder || 'Select a submission'}</option>
            {(field.options || []).length > 0 ? (
              (field.options || []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))
            ) : (
              <>
                <option value="sub1">Submission 1</option>
                <option value="sub2">Submission 2</option>
              </>
            )}
          </select>
        );

      case 'momence-sessions':
      case 'hosted-class':
        const isHostedSession = field.type === 'hosted-class';
        return (
          <div className={`session-preview-card ${isHostedSession ? 'session-preview-card-hosted' : ''}`}>
            <div className="session-preview-header">
              <div>
                <p className="session-preview-title">{field.label}</p>
                <p className="session-preview-subtitle">{isHostedSession ? 'Hosted session lookup' : 'Session picker'}</p>
              </div>
              <span className="session-preview-badge">{isHostedSession ? 'Manual' : 'Auto'}</span>
            </div>
            <div className="session-preview-controls">
              <input type="date" className="form-input session-preview-date" />
              <span className="session-preview-sep">to</span>
              <input type="date" className="form-input session-preview-date" />
              <button type="button" className="session-preview-load">Load Sessions</button>
            </div>
            <div className="session-preview-list">
              <div className="session-preview-item">
                <div>
                  <div className="session-preview-item-title">Morning Method Flow</div>
                  <div className="session-preview-item-meta">09:00 AM · 45 min · 6 spots left</div>
                </div>
              </div>
              <div className="session-preview-item">
                <div>
                  <div className="session-preview-item-title">Signature Burn</div>
                  <div className="session-preview-item-meta">11:30 AM · 50 min · Waitlist available</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appointment-slots': {
        const cfg = field.appointmentSlotsConfig || {};
        const services = cfg.services || [];
        const availDates = cfg.availableDates || [];

        if (services.length > 0) {
          // Helper: generate slot times for preview
          const timeToMins = (t: string) => {
            const [h, m = '0'] = (t || '00:00').split(':');
            return Number(h) * 60 + Number(m);
          };
          const pad = (n: number) => String(n).padStart(2, '0');
          const minsToStr = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
          const genSlots = (dur: number, buf: number, from: string, to: string) => {
            const step = dur + buf; let s = timeToMins(from); const e = timeToMins(to); const r: string[] = [];
            while (s + dur <= e) { r.push(minsToStr(s)); s += step; } return r;
          };

          return (
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              {cfg.bookingNote && <p className="text-xs italic text-muted-foreground border-b border-primary/10 pb-2">{cfg.bookingNote}</p>}
              <div className="flex flex-wrap gap-1.5">
                {services.map((svc, idx) => (
                  <span key={svc.id} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${idx === 0 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-foreground'}`}>
                    {svc.name || `Service ${idx + 1}`}
                    {svc.with && <span className="ml-1 font-normal opacity-75">w/ {svc.with}</span>}
                    <span className="ml-1 font-normal opacity-70">{svc.durationMinutes}min</span>
                  </span>
                ))}
              </div>
              {availDates.length > 0 ? (
                <div className="space-y-1">
                  {availDates.slice(0, 2).map(d => {
                    const svc = services[0];
                    const slots = svc ? genSlots(svc.durationMinutes, svc.bufferMinutes || 0, d.from, d.to) : [];
                    return (
                      <div key={d.id} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="font-medium shrink-0">{d.date}</span>
                        <span className="opacity-70">{d.from}–{d.to} · {slots.length} slot{slots.length !== 1 ? 's' : ''}{slots.length > 0 ? ` (${slots.slice(0, 3).join(', ')}${slots.length > 3 ? '…' : ''})` : ''}</span>
                      </div>
                    );
                  })}
                  {availDates.length > 2 && <div className="text-xs text-muted-foreground/60">+{availDates.length - 2} more date{availDates.length - 2 > 1 ? 's' : ''}</div>}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">No dates configured yet</div>
              )}
              {cfg.defaultTimezone && <div className="text-xs text-muted-foreground/60">⏱ {cfg.defaultTimezone} · {cfg.timeFormat === '24h' ? '24h' : 'AM/PM'}</div>}
            </div>
          );
        }

        // Legacy slots preview
        const slots = cfg.slots || [];
        return (
          <div className="space-y-2">
            {slots.slice(0, 3).map(slot => (
              <label key={slot.id} className="radio-option">
                <input type="radio" name={field.id} value={slot.id} />
                <span className="text-xs">
                  <strong>{slot.className}</strong> · {slot.teacherName} · {slot.startTime} · {slot.durationMinutes}m · {slot.maxBookings} seats
                </span>
              </label>
            ))}
            {slots.length > 3 && <div className="help-text">+{slots.length - 3} more slots</div>}
          </div>
        );
      }

      case 'rich-text':
        return (
          <div className="border border-border rounded-md overflow-hidden bg-background">
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/40 flex-wrap">
              {['B', 'I', 'U', 'S'].map(fmt => (
                <button key={fmt} className="h-6 w-6 rounded text-[11px] font-bold text-muted-foreground hover:bg-muted transition-colors">{fmt}</button>
              ))}
              <div className="w-px h-4 bg-border/60 mx-1" />
              {['H1', 'H2', 'P'].map(fmt => (
                <button key={fmt} className="h-6 px-1.5 rounded text-[10px] font-semibold text-muted-foreground hover:bg-muted transition-colors">{fmt}</button>
              ))}
              <div className="w-px h-4 bg-border/60 mx-1" />
              <button className="h-6 px-1.5 rounded text-xs text-muted-foreground hover:bg-muted transition-colors">≡</button>
              <button className="h-6 px-1.5 rounded text-xs text-muted-foreground hover:bg-muted transition-colors">⊞</button>
            </div>
            <div className="p-3 min-h-[72px] flex items-center">
              <p className="text-sm text-muted-foreground/50 italic">Rich text content area…</p>
            </div>
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

      case 'member-search':
        return (
          <div className="space-y-1">
            <input type="search" className={baseClasses} placeholder="Search members by name or email…" />
            <div className="border border-border rounded-md divide-y divide-border overflow-hidden shadow-sm mt-1">
              {[{ initials: 'AS', name: 'Aditi Sharma' }, { initials: 'RV', name: 'Rahul Verma' }].map(m => (
                <div key={m.name} className="flex items-center gap-2 p-2 text-xs hover:bg-muted/30 cursor-pointer">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0">{m.initials}</span>
                  <span className="text-foreground/80">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'lookup':
        return (
          <div className="space-y-1.5">
            <input type="text" className={baseClasses} readOnly placeholder="Auto-filled from lookup source" />
            <div className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5 px-0.5">
              <span className="font-mono font-bold text-blue-500/80">↪</span>
              <span>Lookup: <span className="font-mono text-blue-600/80">{field.lookupConfig?.sourceFieldId || 'source field'}</span></span>
            </div>
          </div>
        );

      case 'formula':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border border-border rounded-md">
              <span className="text-muted-foreground/60 text-base font-bold italic">ƒ</span>
              <code className="text-blue-600/90 text-xs flex-1 font-mono">{field.formulaConfig?.expression || 'field1 + field2'}</code>
            </div>
            <div className="text-[11px] text-muted-foreground px-0.5">Computed automatically — read-only output</div>
          </div>
        );

      case 'conditional':
        return (
          <div className="flex items-center gap-2.5 p-2.5 rounded-md border border-dashed border-amber-300/70 bg-amber-50/60">
            <div className="h-6 w-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 font-bold text-sm text-amber-600">?</div>
            <div>
              <div className="text-xs font-semibold text-amber-800">Conditional Branch</div>
              <div className="text-[11px] text-amber-600/80">Value evaluated based on conditions</div>
            </div>
          </div>
        );

      case 'dependent':
        const depOptions = (field.options && field.options.length > 0)
          ? field.options
          : [
              { label: 'Option A', value: 'option_a' },
              { label: 'Option B', value: 'option_b' },
            ];
        const depSource = field.dependentOptionsConfig?.sourceFieldId;
        return (
          <div className="space-y-1.5">
            <select className={baseClasses} defaultValue="">
              <option value="" disabled>
                {field.placeholder || (depSource ? `Select (depends on ${depSource})` : 'Select an option')}
              </option>
              {depOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="text-[11px] text-muted-foreground px-0.5">
              {depSource ? `Depends on: ${depSource}` : 'Options can be filtered based on another field'}
            </div>
          </div>
        );

      case 'likert-table': {
        const lcfg = field.likertTableConfig;
        const lRows = lcfg?.rows?.length ? lcfg.rows : [{ id: 'r1', label: 'Statement 1' }, { id: 'r2', label: 'Statement 2' }];
        const lCols = lcfg?.columns?.length ? lcfg.columns : [{ id: 'c1', label: 'Agreement', type: 'radio' as const, options: [{ label: 'Agree', value: 'agree' }, { label: 'Neutral', value: 'neutral' }, { label: 'Disagree', value: 'disagree' }] }];

        // Build flat column descriptor for spread layout
        interface SpreadCol { key: string; label: string; colIdx: number; optValue?: string; inputType?: string; colDef: LikertColumn; }
        const spreadCols: SpreadCol[] = [];
        lCols.forEach((col: LikertColumn, ci: number) => {
          const opts = col.options || [];
          if ((col.type === 'radio' || col.type === 'checkbox') && opts.length > 0) {
            opts.forEach(o => spreadCols.push({ key: `${col.id}_${o.value}`, label: o.label, colIdx: ci, optValue: o.value, inputType: col.type, colDef: col }));
          } else {
            spreadCols.push({ key: col.id, label: col.label, colIdx: ci, colDef: col });
          }
        });

        const hasSpreads = lCols.some((c: LikertColumn) => (c.type === 'radio' || c.type === 'checkbox') && (c.options || []).length > 0);

        return (
          <div className="overflow-x-auto rounded-lg border border-border text-xs">
            <table className="w-full border-collapse">
              <thead>
                {hasSpreads && (
                  <tr className="bg-muted/60">
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground border-r border-border min-w-[110px]"></th>
                    {lCols.map((col: LikertColumn) => {
                      const opts = col.options || [];
                      if ((col.type === 'radio' || col.type === 'checkbox') && opts.length > 0) {
                        return (
                          <th key={col.id} colSpan={opts.length} className="px-2 py-1.5 text-center font-semibold text-muted-foreground border-r border-border last:border-r-0 border-b border-border">
                            {col.label}{col.required && <span className="text-destructive ml-0.5">*</span>}
                          </th>
                        );
                      }
                      return (
                        <th key={col.id} rowSpan={2} className="px-2 py-1.5 text-center font-semibold text-muted-foreground border-r border-border last:border-r-0">
                          {col.label}{col.required && <span className="text-destructive ml-0.5">*</span>}
                          <span className="block font-normal text-[10px] opacity-60 capitalize">{col.type}</span>
                        </th>
                      );
                    })}
                  </tr>
                )}
                <tr className="bg-muted/40">
                  {!hasSpreads && <th className="px-3 py-2 text-left font-semibold text-muted-foreground min-w-[130px] border-r border-border">Statement</th>}
                  {spreadCols.map(sc => (
                    <th key={sc.key} className="px-2 py-1.5 text-center font-medium text-muted-foreground border-r border-border last:border-r-0 whitespace-nowrap">
                      {sc.optValue !== undefined ? sc.label : (
                        <>
                          {sc.label}
                          {sc.colDef.required && <span className="text-destructive ml-0.5">*</span>}
                          <span className="block font-normal text-[10px] opacity-60 capitalize">{sc.colDef.type}</span>
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lRows.map((row, ri) => (
                  <tr key={row.id} className={ri % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-3 py-2 font-medium text-foreground border-r border-border">{row.label}</td>
                    {spreadCols.map(sc => (
                      <td key={sc.key} className="px-2 py-2 text-center border-r border-border last:border-r-0">
                        {sc.optValue !== undefined ? (
                          <input type={sc.inputType} name={`lk_${field.id}_${row.id}_${sc.colDef.id}`} value={sc.optValue} className="w-3.5 h-3.5 cursor-pointer" />
                        ) : sc.colDef.type === 'select' ? (
                          <select className="text-xs py-0.5 px-1 border border-border rounded w-full max-w-[100px]">
                            <option value="">—</option>
                            {(sc.colDef.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : sc.colDef.type === 'rating' ? (
                          <div className="flex justify-center gap-0.5">
                            {Array.from({ length: sc.colDef.max || 5 }).map((_, si) => (
                              <Star key={si} className="h-3 w-3 text-yellow-400" />
                            ))}
                          </div>
                        ) : sc.colDef.type === 'date' ? (
                          <input type="date" className={getFieldControlClassNames(field.type, ['form-input', 'text-xs', 'py-0.5', 'px-1'])} />
                        ) : (
                          <input type={sc.colDef.type === 'number' ? 'number' : 'text'} className={getFieldControlClassNames(field.type, ['form-input', 'text-xs', 'py-0.5', 'px-1', 'w-16'])} placeholder={sc.colDef.placeholder || '…'} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

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
      className={`${fieldWrapperClassName} relative group form-field-preview`}
      data-field-id={field.id}
      data-field-name={field.name}
      data-field-type={field.type}
      data-field-width={field.width || '100'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Field Label */}
      <label className="field-label block">
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
  isLocked,
}: {
  field: FormField;
  formLayout?: string;
  onEdit: (field: FormField) => void;
  onDelete: (fieldId: string) => void;
  onDuplicate: (fieldId: string) => void;
  insertDropActive: boolean;
  isLocked?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    disabled: !!isLocked,
  });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
  };

  const colSpan = fieldColSpan(field, formLayout);
  const isPageBreak = field.type === 'page-break';
  const isSectionBreak = field.type === 'section-break';
  const handleOpenField = (e: MouseEvent<HTMLElement>) => {
    if (isLocked) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, [role="button"]')) return;
    onEdit(field);
  };

  // ── Page-break: dramatic horizontal divider ───────────────────────────
  if (isPageBreak) {
    return (
      <div
        ref={setNodeRef}
        style={sortableStyle}
        className={`col-span-12 ${isDragging ? 'opacity-30' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleOpenField}
      >
        <div className="py-1.5">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200/80 to-transparent" />
            <div
              {...(!isLocked ? listeners : {})}
              {...(!isLocked ? attributes : {})}
              className={`group flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200/70 px-3 py-1.5 shadow-sm ${
                isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
              }`}
            >
              <GripVertical className="h-3 w-3 text-indigo-300 group-hover:text-indigo-400" />
              <SplitSquareVertical className="h-3 w-3 text-indigo-400" />
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                {field.label && field.label !== 'Page Break' ? field.label : 'Page Break'}
              </span>
            </div>
            <div
              className="flex items-center gap-0.5 transition-opacity"
              style={{ opacity: hovered ? 1 : 0 }}
            >
              <Button
                size="icon" variant="ghost"
                className="h-6 w-6 text-indigo-400/70 hover:text-indigo-700 hover:bg-indigo-50"
                onClick={() => onEdit(field)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className="h-6 w-6 text-red-400/70 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(field.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200/80 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  // ── Section-break: horizontal ruler with title ────────────────────────
  if (isSectionBreak) {
    return (
      <div
        ref={setNodeRef}
        style={sortableStyle}
        className={`col-span-12 ${isDragging ? 'opacity-30' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleOpenField}
      >
        <div className="pt-2 pb-1 group">
          <div className="flex items-center gap-3">
            <div
              {...(!isLocked ? listeners : {})}
              {...(!isLocked ? attributes : {})}
              className={`text-muted-foreground/30 hover:text-muted-foreground/60 ${isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-foreground/80 shrink-0">{field.label || 'Section'}</span>
            <div className="h-px flex-1 bg-border/60" />
            <div
              className="flex items-center gap-0.5 transition-opacity"
              style={{ opacity: hovered ? 1 : 0 }}
            >
              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground/50 hover:text-foreground" onClick={() => onEdit(field)}><Pencil className="h-3 w-3" /></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground/50 hover:text-foreground" onClick={() => onDuplicate(field.id)}><Copy className="h-3 w-3" /></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400/60 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(field.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground mt-1 ml-7">{field.helpText}</p>}
        </div>
      </div>
    );
  }

  // ── Regular field card ────────────────────────────────────────────────
  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`${colSpan} ${isDragging ? 'opacity-30 z-50' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {insertDropActive && (
        <div className="mb-2 flex items-center gap-2 px-2 transition-all">
          <div className="h-[3px] flex-1 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shadow-[0_0_18px_rgba(99,102,241,0.28)]" />
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
            Drop Here
          </span>
          <div className="h-[3px] flex-1 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shadow-[0_0_18px_rgba(99,102,241,0.28)]" />
        </div>
      )}
      <div className={`rounded-xl border overflow-hidden transition-all duration-200 ${
        insertDropActive
          ? 'border-primary/45 shadow-[0_12px_28px_rgba(59,130,246,0.16)] bg-blue-50/30'
          : hovered
            ? 'border-indigo-200/80 shadow-[0_4px_20px_rgba(99,102,241,0.09)] bg-white'
            : 'border-slate-200/80 shadow-sm bg-white'
      }`} onClick={handleOpenField}>
        {/* Card header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/70">
          <div
            {...(!isLocked ? listeners : {})}
            {...(!isLocked ? attributes : {})}
            className={`text-slate-300 hover:text-slate-400 transition-colors shrink-0 ${
              isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-500/90 border border-blue-100 leading-none whitespace-nowrap">
            {FIELD_TYPE_LABELS[field.type as FieldType] ?? field.type}
          </span>
          {field.isRequired && (
            <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 rounded px-1 py-0.5 leading-none">required</span>
          )}
          {field.isHidden && (
            <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1 py-0.5 leading-none">hidden</span>
          )}
          <div
            className="ml-auto flex items-center gap-0.5 transition-opacity"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            <Button
              size="icon" variant="ghost"
              className="h-6 w-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              title="Edit field"
              onClick={() => onEdit(field)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon" variant="ghost"
              className="h-6 w-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              title="Duplicate field"
              onClick={() => onDuplicate(field.id)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="icon" variant="ghost"
              className="h-6 w-6 text-red-400/70 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete field"
              onClick={() => onDelete(field.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Field preview area */}
        <div className="px-4 py-3.5">
          <RealFieldPreview field={field} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
        </div>

        {/* Footer: field name */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 border-t border-slate-100 bg-slate-50/50 transition-opacity"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <code className="text-[9px] font-mono text-slate-400">{field.name}</code>
          <span className="text-[9px] text-slate-300">·</span>
          <code className="text-[9px] font-mono text-slate-300">{field.id}</code>
        </div>
      </div>
    </div>
  );
}

// ── Drop zone (empty canvas or after all fields) ──────────────────────────────
function DropZone({ onDrop, isLocked }: { onDrop: (type: FieldType) => void; isLocked?: boolean }) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`col-span-12 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center py-5 gap-2 cursor-default ${
        isLocked
          ? 'border-border/40 bg-muted/10 opacity-70'
          : over
            ? 'border-primary bg-primary/5'
            : 'border-border/50 bg-muted/20'
      }`}
      onDragOver={e => {
        if (isLocked) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        if (isLocked) return;
        e.preventDefault();
        setOver(false);
        const t = e.dataTransfer.getData('palette-field-type') as FieldType;
        if (t) onDrop(t);
      }}
    >
      <Plus className={`h-5 w-5 ${over ? 'text-primary' : 'text-muted-foreground/40'}`} />
      <p className={`text-xs font-medium ${over ? 'text-primary' : 'text-muted-foreground/50'}`}>
        {isLocked ? 'Unlock form to add fields' : over ? 'Release to add field' : 'Drag a field here'}
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
  onAdd: (type: FieldType, options?: { openEditor?: boolean; source?: 'drop' | 'click' }) => void;
  onReorder: (orderedIds: string[]) => void;
  isLocked?: boolean;
  onBulkFieldWidth?: (width: string) => void;
  onBulkApplyCssClass?: (cssClass: string) => void;
  onBulkArrange?: (preset: 'single' | 'halves' | 'thirds' | 'feature-first') => void;
  onUpdateTheme?: (updates: Partial<FormConfig['theme']>) => void;
}

export function FormCanvas({
  form,
  onEdit,
  onDelete,
  onDuplicate,
  onAdd,
  onReorder,
  isLocked,
  onBulkFieldWidth,
  onBulkApplyCssClass,
  onBulkArrange,
  onUpdateTheme,
}: FormCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [bulkCssClass, setBulkCssClass] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  // Compute per-field page numbers (page-break fields separate pages)
  const { fieldPageNums, totalPages } = (() => {
    const nums: Record<string, number> = {};
    let page = 1;
    for (const f of sortedFields) {
      nums[f.id] = page;
      if (f.type === 'page-break') page++;
    }
    return { fieldPageNums: nums, totalPages: page };
  })();

  const isSplitLayout =
    form.layout === 'split-left' ||
    form.layout === 'split-right' ||
    form.layout === 'editorial-left' ||
    form.layout === 'editorial-right';
  const imagePanelWidth = Math.max(20, Math.min(80, form.layoutImagePanelWidth ?? 45));
  const splitCols =
    form.layout === 'split-right' || form.layout === 'editorial-right'
      ? `minmax(0, 1fr) ${imagePanelWidth}%`
      : `${imagePanelWidth}% minmax(0, 1fr)`;
  const panelHero = getHeroForPage(form, 0, { defaultHeight: 760 });
  const panelHeroBg = resolveHeroBackgroundStyle(form.layoutImageFit, panelHero?.zoom ?? 100);
  const splitPanelHeight = panelHero?.height ?? 760;

  const handleDragStart = (e: DragStartEvent) => {
    if (isLocked) return;
    setActiveId(String(e.active.id));
  };
  const handleDragOver = (e: DragOverEvent) => {
    if (isLocked) return;
    setOverId(e.over ? String(e.over.id) : null);
  };
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    if (isLocked) return;
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
    if (isLocked) return;
    onAdd(type, { openEditor: true, source: 'drop' });
  }, [isLocked, onAdd]);

  const activeField = activeId ? sortedFields.find(f => f.id === activeId) : null;

  const fieldGap = form.theme.fieldGap || '16px';
  const gridTemplateColumns = (() => {
    switch (form.theme.formLayout) {
      case 'two-column':
        return 'repeat(2, minmax(0, 1fr))';
      case 'three-column':
        return 'repeat(3, minmax(0, 1fr))';
      case 'custom':
        return 'repeat(12, minmax(0, 1fr))';
      default:
        return '1fr';
    }
  })();

  const primaryGradient = `linear-gradient(135deg, ${form.theme.primaryColor} 0%, ${form.theme.secondaryColor} 100%)`;
  const submitButtonBackground = form.theme.submitButtonBackground || primaryGradient;
  const formCardStyle = {
    ...(isSplitLayout ? { gridTemplateColumns: splitCols } : {}),
    borderWidth: form.theme.formBorderWidth || '1px',
    borderColor: form.theme.formBorderColor || form.theme.inputBorderColor,
    minHeight: form.theme.formMinHeight || undefined,
  } as const;

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
      --form-padding: ${form.theme.formPadding || '32px'};
      --btn-radius: ${form.theme.buttonRadius || '8px'};
      --btn-padding-y: ${form.theme.buttonPaddingY || '12px'};
      --btn-padding-x: ${form.theme.buttonPaddingX || '14px'};
      --submit-btn-bg: ${submitButtonBackground};
    }
    .form-canvas-wrapper * { box-sizing: border-box; }
    .form-canvas-wrapper.form-container {
      position: relative;
      width: 100%;
      background: transparent;
    }
    .form-canvas-wrapper .form-header,
    .form-canvas-wrapper .form-body {
      position: relative;
      z-index: 1;
    }
    .form-canvas-wrapper .form-group {
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      border: 0 !important;
      line-height: ${form.theme.lineHeight || '1.6'};
      position: relative;
    }
    .form-canvas-wrapper .form-fields-grid {
      display: grid;
      grid-template-columns: ${gridTemplateColumns};
      gap: ${form.theme.fieldGap || '16px'};
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
    .form-canvas-wrapper .field-shell { position: relative; }
    .form-canvas-wrapper .field-control { display: block; }
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
    .form-canvas-wrapper .phone-input-group { display: flex; gap: 10px; }
    .form-canvas-wrapper .country-code-select { width: 170px !important; font-size: 13px !important; }
    .form-canvas-wrapper .phone-number-input { flex: 1; min-width: 0; }
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
    .form-canvas-wrapper .switch-group {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      min-height: 54px;
      padding: 12px 14px;
      border: 2px solid var(--border-color);
      border-radius: 16px;
      background: color-mix(in srgb, var(--bg-primary) 84%, white);
      cursor: pointer;
      transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
    }
    .form-canvas-wrapper .switch-group:hover { border-color: var(--primary-color); transform: translateY(-1px); }
    .form-canvas-wrapper .switch-slider {
      position: relative;
      width: 52px;
      height: 30px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--border-color) 72%, white);
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
      flex-shrink: 0;
    }
    .form-canvas-wrapper .switch-slider::after {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
      transition: transform 0.2s ease;
    }
    .form-canvas-wrapper .switch-group input:checked + .switch-slider {
      background: var(--submit-btn-bg);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.18);
    }
    .form-canvas-wrapper .switch-group input:checked + .switch-slider::after { transform: translateX(22px); }
    .form-canvas-wrapper .switch-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .form-canvas-wrapper .switch-state-labels { display: flex; gap: 6px; margin-left: auto; font-size: 12px; color: var(--text-secondary); }
    .form-canvas-wrapper .switch-group input:not(:checked) ~ .switch-state-labels .switch-on-lbl { opacity: 0.35; }
    .form-canvas-wrapper .switch-group input:checked ~ .switch-state-labels .switch-off-lbl { opacity: 0.35; }
    .form-canvas-wrapper .switch-group input:checked ~ .switch-state-labels .switch-on-lbl { color: var(--primary-color); font-weight: 600; }
    .form-canvas-wrapper .choice-matrix-group {
      border: 1px solid var(--border-color);
      border-radius: 18px;
      padding: 14px;
      background: linear-gradient(180deg, color-mix(in srgb, var(--bg-secondary) 82%, white), color-mix(in srgb, var(--bg-primary) 92%, transparent));
      box-shadow: var(--shadow-sm);
      overflow-x: auto;
    }
    .form-canvas-wrapper .choice-matrix-scale-labels {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--text-light);
    }
    .form-canvas-wrapper .choice-matrix-corner { min-width: 160px; }
    .form-canvas-wrapper .choice-matrix-grid { display: grid; gap: 10px; align-items: center; }
    .form-canvas-wrapper .choice-matrix-col {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      padding: 8px 6px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.12);
    }
    .form-canvas-wrapper .choice-matrix-row {
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: var(--bg-primary);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }
    .form-canvas-wrapper .choice-matrix-choice {
      display: flex;
      width: 100%;
      justify-content: center;
      cursor: pointer;
    }
    .form-canvas-wrapper .choice-matrix-choice-pill {
      min-width: 42px;
      min-height: 38px;
      padding: 8px 10px;
      border-radius: 12px;
      border: 1.5px solid var(--border-color);
      background: rgba(255, 255, 255, 0.92);
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      transition: all 0.18s ease;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
    }
    .form-canvas-wrapper .choice-matrix-choice:hover .choice-matrix-choice-pill {
      border-color: var(--primary-color);
      color: var(--text-primary);
      transform: translateY(-1px);
    }
    .form-canvas-wrapper .choice-matrix-choice input:checked + .choice-matrix-choice-pill {
      background: var(--submit-btn-bg);
      border-color: transparent;
      color: white;
      box-shadow: 0 10px 20px rgba(99, 102, 241, 0.22);
    }
    .form-canvas-wrapper .session-preview-card {
      position: relative;
      border: 2px solid var(--border-color);
      border-radius: 18px;
      background: linear-gradient(180deg, color-mix(in srgb, var(--bg-secondary) 88%, white), var(--bg-primary));
      padding: 16px 16px 16px 22px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .form-canvas-wrapper .session-preview-card::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 8px;
      background: var(--submit-btn-bg);
      box-shadow: 10px 0 22px rgba(99, 102, 241, 0.16);
    }
    .form-canvas-wrapper .session-preview-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .form-canvas-wrapper .session-preview-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
    .form-canvas-wrapper .session-preview-subtitle { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
    .form-canvas-wrapper .session-preview-badge {
      border-radius: 999px;
      padding: 4px 9px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary-color);
      border: 1px solid rgba(99, 102, 241, 0.18);
    }
    .form-canvas-wrapper .session-preview-controls {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      margin-bottom: 12px;
    }
    .form-canvas-wrapper .session-preview-date {
      min-height: 46px;
      padding-inline: 14px !important;
      border-radius: 12px !important;
    }
    .form-canvas-wrapper .session-preview-sep { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .form-canvas-wrapper .session-preview-load {
      min-height: 46px;
      padding: 0 18px;
      border-radius: 12px;
      border: none;
      background: var(--submit-btn-bg);
      color: white;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.16);
    }
    .form-canvas-wrapper .session-preview-list { display: grid; gap: 8px; }
    .form-canvas-wrapper .session-preview-item {
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(255, 255, 255, 0.8);
      padding: 12px 14px;
    }
    .form-canvas-wrapper .session-preview-item-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
    .form-canvas-wrapper .session-preview-item-meta { margin-top: 4px; font-size: 11px; color: var(--text-secondary); }
    .form-canvas-wrapper .section-break {
      margin: 8px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border-color);
      grid-column: 1 / -1;
    }
    .form-canvas-wrapper .section-break h3 { font-size: 16px; font-weight: 600; }
    .form-canvas-wrapper .submit-btn {
      width: 100%;
      padding: var(--btn-padding-y) var(--btn-padding-x);
      border: none;
      border-radius: var(--btn-radius);
      background: var(--submit-btn-bg);
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
      .form-canvas-wrapper .session-preview-controls {
        grid-template-columns: 1fr;
      }
    }
    ${form.theme.customCss || ''}
  `;

  return (
    <>
    <style>{formCss}</style>
    <div className="premium-surface h-[calc(100vh-168px)] overflow-hidden rounded-[24px]">

      {/* ── Canvas Area ────────────────────────────────────────────────────── */}
      <div className="h-full overflow-hidden flex flex-col bg-gradient-to-b from-slate-50/65 via-white/55 to-slate-50/40">
        <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between bg-white/70 backdrop-blur-md">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Canvas — <span className="text-foreground">{form.title}</span>
          </p>
          <div className="flex items-center gap-2">
            {!isLocked && onUpdateTheme && (
              <div className="flex items-center gap-1 border-r border-border/30 mr-1 pr-2">
                <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Grid:</span>
                {([
                  { value: 'single', label: '1' },
                  { value: 'two-column', label: '2' },
                  { value: 'three-column', label: '3' },
                  { value: 'custom', label: '12' },
                ] as const).map(layout => (
                  <button
                    key={layout.value}
                    onClick={() => onUpdateTheme({ formLayout: layout.value })}
                    className={`h-6 px-1.5 rounded text-[10px] font-bold transition-colors border ${
                      (form.theme.formLayout || 'single') === layout.value
                        ? 'text-blue-700 border-blue-300 bg-blue-50'
                        : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 border-border/40'
                    }`}
                    title={`Set grid to ${layout.value}`}
                  >
                    {layout.label}
                  </button>
                ))}
                <input
                  value={fieldGap}
                  onChange={e => onUpdateTheme({ fieldGap: e.target.value })}
                  className="h-6 w-[62px] rounded border border-border/40 bg-white px-1.5 text-[10px] font-mono text-muted-foreground"
                  placeholder="16px"
                  title="Grid gap (e.g., 12px)"
                />
              </div>
            )}
            {!isLocked && onBulkFieldWidth && (
              <div className="flex items-center gap-1 border-r border-border/30 mr-1 pr-2">
                <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Width:</span>
                {([
                  {w:'100',label:'Full'},
                  {w:'75',label:'¾'},
                  {w:'66',label:'⅔'},
                  {w:'50',label:'½'},
                  {w:'33',label:'⅓'},
                  {w:'25',label:'¼'},
                ] as {w:string,label:string}[]).map(({w,label}) => (
                  <button key={w} onClick={() => onBulkFieldWidth(w)}
                    className="h-6 px-1.5 rounded text-[10px] font-bold text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors border border-border/40"
                    title={`Set all fields to ${label} width`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            {!isLocked && onBulkArrange && (
              <div className="flex items-center gap-1 border-r border-border/30 mr-1 pr-2">
                <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Arrange:</span>
                {([
                  { preset: 'single', label: 'Stack' },
                  { preset: 'halves', label: '2-up' },
                  { preset: 'thirds', label: '3-up' },
                  { preset: 'feature-first', label: 'Feature' },
                ] as const).map(({ preset, label }) => (
                  <button
                    key={preset}
                    onClick={() => onBulkArrange(preset)}
                    className="h-6 px-1.5 rounded text-[10px] font-bold text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors border border-border/40"
                    title={`Apply ${label.toLowerCase()} positioning to all eligible fields`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {!isLocked && onBulkApplyCssClass && (
              <div className="flex items-center gap-1.5 border-r border-border/30 mr-1 pr-2">
                <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Class:</span>
                <input
                  value={bulkCssClass}
                  onChange={e => setBulkCssClass(e.target.value)}
                  className="h-6 w-[120px] rounded border border-border/40 bg-white px-1.5 text-[10px] font-mono text-muted-foreground"
                  placeholder="vip-field"
                  title="Append a CSS class to all non-structural fields"
                />
                <button
                  onClick={() => {
                    const nextClass = bulkCssClass.trim();
                    if (!nextClass) return;
                    onBulkApplyCssClass(nextClass);
                    setBulkCssClass('');
                  }}
                  className="h-6 px-2 rounded text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200/70"
                  title="Apply class to all non-structural fields"
                >
                  Apply
                </button>
              </div>
            )}
            {isLocked && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                <Lock className="h-2.5 w-2.5" /> Locked — read only
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60 font-mono">
              {sortedFields.filter(f => f.type !== 'page-break' && f.type !== 'section-break').length} field{sortedFields.filter(f => f.type !== 'page-break' && f.type !== 'section-break').length !== 1 ? 's' : ''}
            </span>
            {totalPages > 1 && (
              <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                {totalPages} pages
              </span>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* Form card */}
            <div
              className={`w-full rounded-2xl overflow-hidden bg-card shadow-[0_20px_38px_hsl(220_38%_12%_/_0.12)] ring-1 ring-border/45 ${isSplitLayout ? 'md:grid' : ''}`}
              style={formCardStyle}
            >
              {isSplitLayout && (
                <div
                  className="min-h-[320px] bg-slate-200"
                  style={{
                    backgroundImage: panelHero?.url ? `url(${panelHero.url})` : undefined,
                    backgroundSize: panelHeroBg.size,
                    backgroundPosition: `${panelHero?.cropX ?? form.layoutImagePositionX ?? '50'}% ${panelHero?.cropY ?? form.layoutImagePositionY ?? '50'}%`,
                    backgroundRepeat: panelHeroBg.repeat,
                  }}
                />
              )}
              <div
                className="w-full form-canvas-wrapper form-container"
                style={{
                  maxWidth: isSplitLayout ? '100%' : form.theme.formMaxWidth || '100%',
                  lineHeight: form.theme.lineHeight || '1.6',
                }}
                onDragOver={e => {
                  if (isLocked) return;
                  e.preventDefault();
                }}
                onDrop={e => {
                  if (isLocked) return;
                  e.preventDefault();
                  const t = e.dataTransfer.getData('palette-field-type') as FieldType;
                  if (t) handleCanvasDrop(t);
                }}
              >
              {/* Top accent bar */}
              <div className="h-1" style={{ background: primaryGradient }} />

              {/* Header */}
              <div
                className="form-header pt-8 pb-6 bg-muted"
                style={{
                  paddingLeft: 'var(--form-padding)',
                  paddingRight: 'var(--form-padding)',
                  textAlign: (form.theme.headerAlign || 'center') as any,
                  borderBottom: `1px solid ${form.theme.inputBorderColor}`,
                }}
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

              <div
                className="form-body"
                style={{ paddingLeft: 'var(--form-padding)', paddingRight: 'var(--form-padding)', paddingBottom: 'var(--form-padding)' }}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedFields.map(f => f.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="form-fields-grid">
                      {sortedFields.map((field, fi) => {
                        const pageNum = fieldPageNums[field.id];
                        const prevField = fi > 0 ? sortedFields[fi - 1] : null;
                        const isFirstInPage = fi === 0 || (prevField?.type === 'page-break');
                        const showPageHeader = totalPages > 1 && isFirstInPage && field.type !== 'page-break';
                        const fieldsOnPage = sortedFields.filter(f => fieldPageNums[f.id] === pageNum && f.type !== 'page-break').length;
                        return (
                          <Fragment key={field.id}>
                            {showPageHeader && (
                              <div className="col-span-12 flex items-center gap-3 pt-2 pb-0.5">
                                <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full px-3 py-1 shadow-sm shadow-blue-700/30">
                                  <BookOpen className="h-3 w-3" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Page {pageNum}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground/50 font-medium">
                                  {fieldsOnPage} field{fieldsOnPage !== 1 ? 's' : ''}
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-r from-indigo-100 to-transparent" />
                              </div>
                            )}
                            <CanvasField
                              field={field}
                              formLayout={form.theme.formLayout}
                              isLocked={isLocked}
                              onEdit={(field) => onEdit(field)}
                              onDelete={(fieldId) => setPendingDeleteId(fieldId)}
                              onDuplicate={(fieldId) => onDuplicate(fieldId)}
                              insertDropActive={overId === field.id && activeId !== field.id}
                            />
                          </Fragment>
                        );
                      })}

                      {/* Drop zone always visible at the bottom */}
                      <DropZone onDrop={handleCanvasDrop} isLocked={isLocked} />
                    </div>
                  </SortableContext>

                  <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.18, 0.67, 0.4, 1.18)' }}>
                    {activeField && (
                      <div className="rounded-2xl border-2 border-primary/80 bg-card shadow-[0_22px_48px_rgba(15,23,42,0.22)] p-3 opacity-95 w-56 backdrop-blur-sm">
                        <div className="text-[11px] font-semibold text-foreground/80 mb-1.5">{activeField.label}</div>
                        <RealFieldPreview field={activeField} onEdit={() => {}} onDelete={() => {}} onDuplicate={() => {}} />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              </div>

              {/* Submit button */}
              <div style={{ paddingLeft: 'var(--form-padding)', paddingRight: 'var(--form-padding)', paddingBottom: 'var(--form-padding)', paddingTop: '8px' }}>
                <button
                  type="button"
                  className="w-full text-sm font-semibold text-white cursor-default leading-snug transition-all hover:opacity-90"
                  style={{
                    background: submitButtonBackground,
                    borderRadius: form.theme.buttonRadius || '8px',
                    padding: `${form.theme.buttonPaddingY || '12px'} ${form.theme.buttonPaddingX || '14px'}`,
                  }}
                >
                  {form.submitButtonText}
                </button>
              </div>

              {/* Footer */}
              {form.footer && (
                <div className="border-t border-border/40 pt-4 text-center" style={{ paddingLeft: 'var(--form-padding)', paddingRight: 'var(--form-padding)', paddingBottom: '24px' }}>
                  <p className="text-xs text-muted-foreground leading-relaxed">{form.footer}</p>
                </div>
              )}
              </div>
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
