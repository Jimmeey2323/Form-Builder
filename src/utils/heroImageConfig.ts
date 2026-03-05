import type { FormConfig, PageHeroImageValue } from '@/types/formField';

export interface NormalizedHeroImageConfig {
  url: string;
  cropX: number;
  cropY: number;
  zoom: number;
  height: number;
}

interface NormalizeHeroOptions {
  fallbackCropX?: number;
  fallbackCropY?: number;
  defaultHeight?: number;
}

const DEFAULT_CROP_X = 50;
const DEFAULT_CROP_Y = 50;
const DEFAULT_ZOOM = 100;
const DEFAULT_HEIGHT = 420;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function getHeroImageUrl(value?: PageHeroImageValue | null): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return (value.url || '').trim();
}

export function hasHeroImage(value?: PageHeroImageValue | null): boolean {
  return getHeroImageUrl(value).length > 0;
}

export function normalizeHeroImageValue(
  value?: PageHeroImageValue | null,
  options: NormalizeHeroOptions = {},
): NormalizedHeroImageConfig | null {
  const fallbackCropX = options.fallbackCropX ?? DEFAULT_CROP_X;
  const fallbackCropY = options.fallbackCropY ?? DEFAULT_CROP_Y;
  const defaultHeight = options.defaultHeight ?? DEFAULT_HEIGHT;
  const url = getHeroImageUrl(value);
  if (!url) return null;

  if (typeof value === 'string') {
    return {
      url,
      cropX: clamp(fallbackCropX, 0, 100),
      cropY: clamp(fallbackCropY, 0, 100),
      zoom: DEFAULT_ZOOM,
      height: clamp(defaultHeight, 180, 1200),
    };
  }

  const cropX = toNumber(value.cropX);
  const cropY = toNumber(value.cropY);
  const zoom = toNumber(value.zoom);
  const height = toNumber(value.height);

  return {
    url,
    cropX: clamp(cropX ?? fallbackCropX, 0, 100),
    cropY: clamp(cropY ?? fallbackCropY, 0, 100),
    zoom: clamp(zoom ?? DEFAULT_ZOOM, 50, 240),
    height: clamp(height ?? defaultHeight, 180, 1200),
  };
}

function parsePositionPercent(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return clamp(parsed, 0, 100);
}

export function getHeroForPage(
  config: Pick<FormConfig, 'pageHeroImages' | 'layoutImageUrl' | 'layoutImagePositionX' | 'layoutImagePositionY'>,
  pageIndex: number,
  options: NormalizeHeroOptions = {},
): NormalizedHeroImageConfig | null {
  const fallbackCropX = options.fallbackCropX ?? parsePositionPercent(config.layoutImagePositionX);
  const fallbackCropY = options.fallbackCropY ?? parsePositionPercent(config.layoutImagePositionY);
  const defaultHeight = options.defaultHeight ?? DEFAULT_HEIGHT;

  const perPage = normalizeHeroImageValue(config.pageHeroImages?.[pageIndex], {
    fallbackCropX,
    fallbackCropY,
    defaultHeight,
  });
  if (perPage) return perPage;

  const fallbackUrl = (config.layoutImageUrl || '').trim();
  if (!fallbackUrl) return null;
  return {
    url: fallbackUrl,
    cropX: fallbackCropX,
    cropY: fallbackCropY,
    zoom: DEFAULT_ZOOM,
    height: clamp(defaultHeight, 180, 1200),
  };
}

export function resolveHeroBackgroundStyle(
  fit: FormConfig['layoutImageFit'] | undefined,
  zoom: number,
): { size: string; repeat: string } {
  const safeZoom = clamp(zoom, 50, 240);
  const useFit = fit || 'cover';

  if (useFit === 'tile') {
    return {
      size: safeZoom === 100 ? 'auto' : `${safeZoom}%`,
      repeat: 'repeat',
    };
  }

  if (useFit === 'fill') {
    return {
      size: safeZoom === 100 ? '100% 100%' : `${safeZoom}% ${safeZoom}%`,
      repeat: 'no-repeat',
    };
  }

  if (useFit === 'natural') {
    return {
      size: safeZoom === 100 ? 'auto' : `${safeZoom}%`,
      repeat: 'no-repeat',
    };
  }

  if (useFit === 'zoom-in') {
    return {
      size: `${Math.round(130 * (safeZoom / 100))}%`,
      repeat: 'no-repeat',
    };
  }

  if (useFit === 'zoom-out') {
    return {
      size: `${Math.round(70 * (safeZoom / 100))}%`,
      repeat: 'no-repeat',
    };
  }

  if (safeZoom !== 100) {
    return {
      size: `${safeZoom}%`,
      repeat: 'no-repeat',
    };
  }

  if (useFit === 'contain') {
    return { size: 'contain', repeat: 'no-repeat' };
  }

  return { size: 'cover', repeat: 'no-repeat' };
}
