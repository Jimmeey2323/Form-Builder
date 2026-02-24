export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'url'
  | 'password'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'file'
  | 'range'
  | 'color'
  | 'hidden'
  | 'lookup'
  | 'formula'
  | 'conditional'
  | 'dependent'
  | 'rating'
  | 'signature'
  | 'section-break'
  | 'page-break';

export interface FieldOption {
  label: string;
  value: string;
  /** Full address to display below the form when this option is selected */
  address?: string;
  /** Optional rule to conditionally show/hide this option */
  conditionalRule?: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: string;
  };
}

/** One "branch" inside a DependentOptionsConfig: when the source field = sourceValue, show these options */
export interface OptionGroupRule {
  sourceValue: string;
  visibleOptionValues: string[];
}

/**
 * Field-level config that drives conditional option filtering.
 * When a user selects a value in `sourceFieldId`, only the options
 * listed in the matching group are shown in this field.
 */
export interface DependentOptionsConfig {
  /** The field whose value controls which option group is active */
  sourceFieldId: string;
  /** For source fields without predefined options (e.g. text), the user can add custom trigger values */
  customSourceValues?: string[];
  groups: OptionGroupRule[];
}

export interface ConditionalRule {
  dependsOnFieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string;
  action: 'show' | 'hide' | 'require' | 'set_value';
  actionValue?: string;
}

export interface LookupConfig {
  sourceFieldId: string;
  lookupData: Record<string, string>;
}

export interface FormulaConfig {
  expression: string;
  referencedFieldIds: string[];
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  
  // Validation
  isRequired: boolean;
  isHidden: boolean;
  isReadOnly: boolean;
  isDisabled: boolean;
  
  // Constraints
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  accept?: string;
  
  // Options (for select, radio, checkbox)
  options?: FieldOption[];
  
  // Advanced
  conditionalRules?: ConditionalRule[];
  lookupConfig?: LookupConfig;
  formulaConfig?: FormulaConfig;
  dependsOnFieldId?: string;
  /** Filters the visible options of this select/radio/checkbox based on another field's value */
  dependentOptionsConfig?: DependentOptionsConfig;
  
  // Styling
  cssClass?: string;
  width?: '25' | '33' | '50' | '66' | '75' | '100';
  
  // Autocomplete
  autocomplete?: string;
  
  // Order
  order: number;
}

// Webhook configuration
export interface WebhookConfig {
  enabled: boolean;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  includeUtmParams: boolean;
  token?: string;
  sourceId?: string;
  redirectUrl?: string;
  /** Static UTM parameter defaults to embed in every submission */
  utmParamDefaults?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

// Tracking pixel configuration
export interface PixelConfig {
  snapPixelId?: string;
  metaPixelId?: string;
  googleAdsId?: string;
  googleAdsConversionLabel?: string;
  customScripts?: string;
}

// Google Sheets configuration
export interface GoogleSheetsConfig {
  enabled: boolean;
  spreadsheetId?: string;
  sheetName?: string;
}

export interface FormTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  showLogo: boolean;
  logoUrl?: string;
  // Advanced theme
  backgroundColor: string;
  formBackgroundColor: string;
  textColor: string;
  labelColor: string;
  inputBorderColor: string;
  inputBackgroundColor: string;
  buttonTextColor: string;
  formWidth: string;
  formMaxWidth: string;
  formPadding: string;
  inputPadding: string;
  labelFontSize: string;
  inputFontSize: string;
  formShadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  formLayout: 'single' | 'two-column' | 'three-column' | 'custom';
  /** Logo max-width (e.g. '72px') */
  logoMaxWidth?: string;
  /** Top padding of the logo/header area (e.g. '16px') */
  logoTopPadding?: string;
  /** Side padding of the logo/header area (e.g. '32px') */
  logoSidePadding?: string;
  /** Form title font size (e.g. '22px') */
  headerFontSize?: string;
  /** Form title font weight (e.g. '700') */
  headerFontWeight?: string;
  /** Form title font style */
  headerFontStyle?: 'normal' | 'italic';
  /** Text alignment for form header, logo container, and footer */
  headerAlign?: 'left' | 'center' | 'right';
  /** Text alignment for field labels */
  labelAlign?: 'left' | 'center' | 'right';
  /** Gap between fields (e.g. '16px', '24px') */
  fieldGap?: string;
  /** Line height for form text (e.g. '1.5', '1.8') */
  lineHeight?: string;
  customCss?: string;
}

/** Animation configuration per element on the generated form */
export interface FormAnimations {
  /** Master on/off */
  enabled: boolean;
  /** Animation style for the form logo */
  logo?: 'none' | 'fadeIn' | 'zoomIn' | 'spinIn' | 'floatIn' | 'glowPulse' | 'revealClip';
  /** Animation style for the form title / sub-header */
  title?: 'none' | 'fadeIn' | 'slideDown' | 'bounceIn' | 'typewriter' | 'splitReveal' | 'glitchIn' | 'perspectiveFlip';
  /** Animation style for the venue/date-stamp meta strip */
  header?: 'none' | 'fadeIn' | 'slideDown' | 'expandIn' | 'blurIn';
  /** Animation style for each field as it enters the viewport */
  fields?: 'none' | 'fadeIn' | 'slideUp' | 'stagger' | 'cascadeIn' | 'flipIn' | 'springIn';
  /** Animation style for the footer */
  footer?: 'none' | 'fadeIn' | 'slideUp' | 'expandIn';
  /** Easing curve applied to all transitions */
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce';
  /** Individual animation duration in ms (default 500) */
  duration?: number;
  /** Stagger delay between fields in ms (default 80) */
  staggerDelay?: number;
}

export interface FormConfig {
  id: string;
  title: string;
  /** Short sub-headline displayed below the form title */
  subHeader?: string;
  description?: string;
  /** Venue name / location label shown at the top of the form */
  venue?: string;
  /** Date & time stamp text shown at the top of the form (free text, e.g. "Saturday, 1 Mar 2026 · 9:00 AM") */
  dateTimeStamp?: string;
  /** Footer text shown at the bottom of the form card */
  footer?: string;
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  fields: FormField[];
  theme: FormTheme;
  animations?: FormAnimations;
  /** Page layout mode — controls split panels, banner, floating, etc. */
  layout?: 'classic' | 'card' | 'split-left' | 'split-right' | 'banner-top' | 'floating' | 'fullscreen';
  /** Background / panel image URL used by split, banner-top, and floating layouts */
  layoutImageUrl?: string;
  /** How the layout background image is sized */
  layoutImageFit?: 'cover' | 'contain' | 'fill' | 'natural' | 'zoom-in' | 'zoom-out' | 'tile';
  /** Horizontal focal point of the layout image (0–100, default 50) */
  layoutImagePositionX?: string;
  /** Vertical focal point of the layout image (0–100, default 50) */
  layoutImagePositionY?: string;
  /** Width % of the image panel in split layouts (default 45). Form panel gets the rest. */
  layoutImagePanelWidth?: number;
  webhookConfig: WebhookConfig;
  pixelConfig: PixelConfig;
  googleSheetsConfig: GoogleSheetsConfig;
  /** The last successfully deployed Vercel URL for this form */
  deployedUrl?: string;
  /** Domain of the existing Vercel project to deploy to (e.g. mysite.vercel.app or mycustomdomain.com) */
  vercelProjectDomain?: string;
  createdAt: string;
  updatedAt: string;
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text Input',
  email: 'Email',
  tel: 'Phone Number',
  number: 'Number',
  url: 'URL',
  password: 'Password',
  textarea: 'Text Area',
  select: 'Dropdown Select',
  radio: 'Radio Buttons',
  checkbox: 'Checkboxes',
  date: 'Date',
  time: 'Time',
  'datetime-local': 'Date & Time',
  file: 'File Upload',
  range: 'Range Slider',
  color: 'Color Picker',
  hidden: 'Hidden Field',
  lookup: 'Lookup Field',
  formula: 'Formula Field',
  conditional: 'Conditional Field',
  dependent: 'Dependent Field',
  rating: 'Rating',
  signature: 'Signature',
  'section-break': 'Section Break',
  'page-break': 'Page Break',
};

export const FIELD_TYPE_CATEGORIES: Record<string, FieldType[]> = {
  'Basic': ['text', 'email', 'tel', 'number', 'url', 'password', 'textarea'],
  'Choice': ['select', 'radio', 'checkbox', 'rating'],
  'Date & Time': ['date', 'time', 'datetime-local'],
  'Media': ['file', 'color', 'signature'],
  'Layout': ['section-break', 'page-break', 'hidden'],
  'Advanced': ['lookup', 'formula', 'conditional', 'dependent', 'range'],
};

export function createDefaultField(type: FieldType, order: number): FormField {
  const id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const base: FormField = {
    id,
    name: id,
    label: FIELD_TYPE_LABELS[type],
    type,
    isRequired: false,
    isHidden: false,
    isReadOnly: false,
    isDisabled: false,
    width: '100',
    order,
  };
  
  if (['select', 'radio', 'checkbox'].includes(type)) {
    base.options = [
      { label: 'Option 1', value: 'option_1' },
      { label: 'Option 2', value: 'option_2' },
    ];
  }
  
  if (type === 'rating') {
    base.max = 5;
    base.min = 1;
  }
  
  return base;
}
