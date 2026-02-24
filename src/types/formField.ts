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
  customCss?: string;
}

export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  fields: FormField[];
  theme: FormTheme;
  webhookConfig: WebhookConfig;
  pixelConfig: PixelConfig;
  googleSheetsConfig: GoogleSheetsConfig;
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
