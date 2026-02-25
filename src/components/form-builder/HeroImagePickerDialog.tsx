import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Trash2, ImageIcon } from 'lucide-react';
import { heroImages } from '@/data/heroImages';

// ── Branded image library (from src/data/heroImages.ts) ───────────────────────
const LIBRARY = heroImages.map((img, i) => ({
  id: img.id,
  url: img.url,
  label: `${img.category.charAt(0).toUpperCase()}${img.category.slice(1)} ${i + 1}`,
}));

interface HeroImagePickerDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** 0-based page indices that should have a selector tab */
  pageCount: number;
  /** Currently saved hero images per page */
  pageHeroImages: Record<number, string>;
  onSave: (updated: Record<number, string>) => void;
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
  const [draft, setDraft] = useState<Record<number, string>>(() => ({ ...pageHeroImages }));

  // Reset draft and selected page when dialog opens
  const handleOpen = (v: boolean) => {
    if (v) {
      setDraft({ ...pageHeroImages });
      setSelectedPage(initialPage);
    }
    onOpenChange(v);
  };

  const pickImage = (url: string) => {
    if (draft[selectedPage] === url) {
      // Clicking same image de-selects it
      const next = { ...draft };
      delete next[selectedPage];
      setDraft(next);
    } else {
      setDraft({ ...draft, [selectedPage]: url });
    }
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

  const currentUrl = draft[selectedPage];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Hero Image Library
          </DialogTitle>
          <DialogDescription>
            Choose a full-width banner image to display at the top of each form page. Images are saved with the form.
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
                {(draft[i] != null) && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Current selection preview */}
        {currentUrl && (
          <div className="relative mx-6 mt-4 rounded-xl overflow-hidden h-24 flex-shrink-0 border border-border/50 bg-muted/40">
            <img src={currentUrl} alt="Selected hero" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Badge className="gap-1 bg-white/90 text-black hover:bg-white/90">
                <Check className="h-3 w-3 text-green-600" /> Selected for Page {selectedPage + 1}
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
        )}

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs text-muted-foreground mb-3">
            Showing {LIBRARY.length} curated fitness &amp; studio images. Click to select.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {LIBRARY.map(img => {
              const isSelected = draft[selectedPage] === img.url;
              return (
                <button
                  key={img.id}
                  onClick={() => pickImage(img.url)}
                  className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? 'border-primary shadow-[0_0_0_3px] shadow-primary/30 scale-[0.97]'
                      : 'border-transparent hover:border-primary/50 hover:scale-[0.98]'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-contain bg-muted/30"
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
            {Object.keys(draft).filter(k => draft[+k]).length} of {totalPages} page(s) have a hero image
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
