import { FormField } from '@/types/formField';

export function sanitizeCssToken(value?: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'default';
}

export function getFieldWrapperClassNames(
  field: Pick<FormField, 'type' | 'id' | 'name' | 'cssClass'>,
  extra: string[] = [],
): string {
  const customClasses = (field.cssClass || '').split(/\s+/).filter(Boolean);
  return [
    ...extra,
    'field-shell',
    `field-type-${sanitizeCssToken(field.type)}`,
    `field-id-${sanitizeCssToken(field.id)}`,
    `field-name-${sanitizeCssToken(field.name)}`,
    ...customClasses,
  ].join(' ');
}

export function getFieldControlClassNames(fieldType: string, extra: string[] = []): string {
  return [
    'field-control',
    `field-control-${sanitizeCssToken(fieldType)}`,
    ...extra,
  ].join(' ');
}

export function getChoiceMatrixColumns(
  field: Pick<FormField, 'choiceMatrixColumns' | 'max'>,
): string[] {
  const customColumns = (field.choiceMatrixColumns || []).map(value => value.trim()).filter(Boolean);
  if (customColumns.length > 0) {
    return customColumns;
  }

  const count = Math.max(2, field.max || 5);
  return Array.from({ length: count }, (_, index) => String(index + 1));
}
