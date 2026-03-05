import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Check, Trash2, ImageIcon, ScanSearch } from 'lucide-react';
import { heroImages } from '@/data/heroImages';
import { PageHeroImageValue } from '@/types/formField';
import { hasHeroImage, normalizeHeroImageValue, resolveHeroBackgroundStyle } from '@/utils/heroImageConfig';

// ── Branded image library (from src/data/heroImages.ts) ───────────────────────
const LIBRARY = heroImages.map((img, i) => ({
  id: img.id,
  url: img.url,
  label: `${img.category.charAt(0).toUpperCase()}${img.category.slice(1)} ${i + 1}`,
}));

const DEFAULT_HERO_HEIGHT = 420;

interface HeroImagePickerDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** 0-based page indices that should have a selector tab */
  pageCount: number;
  /** Currently saved hero images per page */
  pageHeroImages: Record<number, PageHeroImageValue>;
  onSave: (updated: Record<number, PageHeroImageValue>) => void;
  /** Open the picker with this page pre-selected (0-based) */
  initialPage?: number;
}

export function HeroImagePickerDialog({
  open,
  onOpenChange,
  pageCount,
  pageHeroImages,
  onSave,
  initialPage = 0,
}: HeroImagePickerDialogProps) {
  const totalPages = Math.max(pageCount, 1);
  const [selectedPage, setSelectedPage] = useState(initialPage);
  // Local draft — committed on "Save"
  const [draft, setDraft] = useState<Record<number, PageHeroImageValue>>(() => ({ ...pageHeroImages }));

  // Reset draft and selected page when dialog opens
  const handleOpen = (v: boolean) => {
    if (v) {
      setDraft({ ...pageHeroImages });
      setSelectedPage(initialPage);
    }
    onOpenChange(v);
  };

  const currentHero = normalizeHeroImageValue(draft[selectedPage], { defaultHeight: DEFAULT_HERO_HEIGHT });
  const currentUrl = currentHero?.url || '';

  const pickImage = (url: string) => {
    if (currentUrl === url) {
      const next = { ...draft };
      delete next[selectedPage];
      setDraft(next);
      return;
    }

    setDraft({
      ...draft,
      [selectedPage]: {
        ...(currentHero || {
          cropX: 50,
          cropY: 50,
          zoom: 100,
          height: DEFAULT_HERO_HEIGHT,
        }),
        url,
      },
    });
  };

  const updateCurrentHero = (updates: Partial<NonNullable<typeof currentHero>>) => {
    if (!currentHero) return;
    setDraft({
      ...draft,
      [selectedPage]: {
        ...currentHero,
        ...updates,
      },
    });
  };

  const clearPage = () => {
    const next = { ...draft };
    delete next[selectedPage];
    setDraft(next);
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const previewBg = resolveHeroBackgroundStyle('cover', currentHero?.zoom ?? 100);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-6xl max-h-[94vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Hero Image Library
          </DialogTitle>
          <DialogDescription>
            Choose image per page, then set focal crop, zoom, and hero panel height.
          </DialogDescription>
        </DialogHeader>

        {/* Page tabs — only show if > 1 page */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 px-6 py-2.5 border-b border-border/40 bg-muted/30 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedPage(i)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedPage === i
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background border border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                Page {i + 1}
                {hasHeroImage(draft[i]) && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Current selection preview + controls */}
        {currentUrl ? (
          <div className="mx-6 mt-4 rounded-xl border border-border/50 bg-muted/10 p-3 space-y-3">
            <div className="relative rounded-lg overflow-hidden h-44 border border-border/50 bg-muted/30">
              <div
                className="absolute inset-0 cursor-crosshair"
                style={{
                  backgroundImage: `url(${currentUrl})`,
                  backgroundSize: previewBg.size,
                  backgroundPosition: `${currentHero.cropX}% ${currentHero.cropY}%`,
                  backgroundRepeat: previewBg.repeat,
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  updateCurrentHero({ cropX: Math.round(x), cropY: Math.round(y) });
                }}
              />
              <div
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow bg-primary/80 pointer-events-none"
                style={{ left: `${currentHero.cropX}%`, top: `${currentHero.cropY}%` }}
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                <Badge className="gap-1 bg-white/90 text-black hover:bg-white/90">
                  <ScanSearch className="h-3 w-3 text-primary" /> Focus Point Preview
                </Badge>
              </div>
              <button
                onClick={clearPage}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                title="Remove hero image for this page"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Crop Position X</span>
                  <span>{Math.round(currentHero.cropX)}%</span>
                </div>
                <Slider value={[currentHero.cropX]} min={0} max={100} step={1} onValueChange={(v) => updateCurrentHero({ cropX: v[0] })} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Crop Position Y</span>
                  <span>{Math.round(currentHero.cropY)}%</span>
                </div>
                <Slider value={[currentHero.cropY]} min={0} max={100} step={1} onValueChange={(v) => updateCurrentHero({ cropY: v[0] })} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Zoom</span>
                  <span>{Math.round(currentHero.zoom)}%</span>
                </div>
                <Slider value={[currentHero.zoom]} min={50} max={240} step={1} onValueChange={(v) => updateCurrentHero({ zoom: v[0] })} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Hero Height</span>
                  <span>{Math.round(currentHero.height)}px</span>
                </div>
                <Slider value={[currentHero.height]} min={180} max={1200} step={10} onValueChange={(v) => updateCurrentHero({ height: v[0] })} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-6 mt-4 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">Pick an image below to enable crop and dimension controls for page {selectedPage + 1}.</p>
          </div>
        )}

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs text-muted-foreground mb-3">
            Showing {LIBRARY.length} curated fitness &amp; studio images. Click to select.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {LIBRARY.map(img => {
              const isSelected = currentUrl === img.url;
              return (
                <button
                  key={img.id}
                  onClick={() => pickImage(img.url)}
                  className={`relative rounded-xl overflow-hidden h-36 border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? 'border-primary shadow-[0_0_0_3px] shadow-primary/30 scale-[0.97]'
                      : 'border-transparent hover:border-primary/50 hover:scale-[0.98]'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-cover bg-muted/30"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary rounded-full p-1">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                    <p className="text-[10px] text-white font-medium truncate">{img.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-6 py-4 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {Object.values(draft).filter(hasHeroImage).length} of {totalPages} page(s) have a hero image
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1.5">
              <Check className="h-3.5 w-3.5" /> Save Images
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
