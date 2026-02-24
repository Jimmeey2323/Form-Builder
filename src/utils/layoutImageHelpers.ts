import { FormConfig } from '@/types/formField';
import { getRandomHeroImage } from '@/data/heroImages';

const IMAGE_LAYOUTS: FormConfig['layout'][] = [
  'split-left',
  'split-right',
  'banner-top',
  'floating',
];

export function layoutUsesHeroImage(layout?: FormConfig['layout']): boolean {
  return !!layout && IMAGE_LAYOUTS.includes(layout);
}

export function applyHeroImageForLayout(form: FormConfig, updates: Partial<FormConfig>): Partial<FormConfig> {
  if (!updates.layout || !layoutUsesHeroImage(updates.layout)) {
    return updates;
  }

  const candidateImageUrl = (updates.layoutImageUrl ?? form.layoutImageUrl ?? '').trim();
  if (candidateImageUrl) {
    return updates;
  }

  return {
    ...updates,
    layoutImageUrl: getRandomHeroImage().url,
  };
}
