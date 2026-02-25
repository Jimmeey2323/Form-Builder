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
  | 'page-break'
  | 'heading'
  | 'paragraph'
  | 'banner'
  | 'picture-choice'
  | 'multiselect'
  | 'switch'
  | 'multiple-choice'
  | 'checkboxes'
  | 'choice-matrix'
  | 'date-range'
  | 'ranking'
  | 'star-rating'
  | 'opinion-scale'
  | 'rich-text'
  | 'address'
  | 'currency'
  | 'voice-recording'
  | 'submission-picker'
  | 'subform'
  | 'section-collapse'
  | 'divider'
  | 'html-snippet'
  | 'image'
  | 'video'
  | 'pdf-viewer'
  | 'social-links'
  | 'member-search'
  | 'momence-sessions';

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

/** Config for the Momence member search / autofill field */
export interface MomenceSearchConfig {
  /** Momence hostId to search members within (default 33905 for Bengaluru) */
  hostId: number;
  /**
   * Name of another form field whose value drives the hostId at runtime.
   * If value contains "kenkere" or "copper" → 33905, else → 13752.
   * When set this overrides the static hostId above at search time.
   */
  locationFieldName?: string;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Name of the form field to auto-fill with First Name */
  autoFillFirstName?: string;
  /** Name of the form field to auto-fill with Last Name */
  autoFillLastName?: string;
  /** Name of the form field to auto-fill with Email */
  autoFillEmail?: string;
  /** Name of the form field to auto-fill with Phone */
  autoFillPhone?: string;
  /** Name of field to fill with total sessions booked */
  autoFillSessionsBooked?: string;
  /** Name of field to fill with sessions checked-in count */
  autoFillSessionsCheckedIn?: string;
  /** Name of field to fill with late-cancelled count */
  autoFillLateCancelled?: string;
  /** Name of field to fill with home location */
  autoFillHomeLocation?: string;
  /** Name of field to fill with member tags (comma-separated) */
  autoFillTags?: string;
  // ── Detail-call fields (from action:'detail') ──────────────────────────
  /** ISO date member first seen */
  autoFillFirstSeen?: string;
  /** ISO date member last seen */
  autoFillLastSeen?: string;
  /** Total visit count */
  autoFillTotalVisits?: string;
  /** Customer tags (comma-separated, with colour context) */
  autoFillCustomerTags?: string;
  /** Active membership name */
  autoFillActiveMembershipName?: string;
  /** Active membership type (subscription / package etc.) */
  autoFillActiveMembershipType?: string;
  /** Active membership end date */
  autoFillActiveMembershipEndDate?: string;
  /** Sessions used against current membership */
  autoFillActiveMembershipSessionsUsed?: string;
  /** Session limit on current membership */
  autoFillActiveMembershipSessionsLimit?: string;
  /** 'true'/'false' — whether current membership is frozen */
  autoFillActiveMembershipFrozen?: string;
  /** Total recent session bookings count */
  autoFillRecentSessionsCount?: string;
  /** Name of the most recent session */
  autoFillLastSessionName?: string;
  /** Start time ISO of the most recent session */
  autoFillLastSessionDate?: string;
}

/** Config for the Momence sessions picker field */
export interface MomenceSessionsConfig {
  /** Default look-ahead window in days from today (default 30) */
  dateRangeDays?: number;
  /** Show a date range picker so the user can adjust the window */
  showDatePicker?: boolean;
  /** Allow selecting more than one session */
  allowMultiple?: boolean;
  // ── auto-fill mappings (each value = target field name) ──────────────
  /** Comma-separated session IDs */
  autoFillSessionId?: string;
  /** Session name(s) */
  autoFillSessionNames?: string;
  /** Start date/time ISO string(s) */
  autoFillStartTime?: string;
  /** End date/time ISO string(s) */
  autoFillEndTime?: string;
  /** Instructor name(s) */
  autoFillInstructor?: string;
  /** Location name(s) */
  autoFillLocation?: string;
  /** Capacity (total spots) */
  autoFillCapacity?: string;
  /** Spots remaining */
  autoFillSpotsLeft?: string;
  /** Booked / registered count */
  autoFillBookedCount?: string;
  /** Late-cancelled count */
  autoFillLateCancelled?: string;
  /** Difficulty / level */
  autoFillLevel?: string;
  /** Category / activity type */
  autoFillCategory?: string;
  /** Duration in minutes */
  autoFillDuration?: string;
  /** Session price */
  autoFillPrice?: string;
  // ── Detail-call fields (from secondary /sessions/{id} call) ─────────────
  /** Session tags (comma-separated) */
  autoFillTags?: string;
  /** Waitlist capacity */
  autoFillWaitlistCapacity?: string;
  /** Waitlist booking count */
  autoFillWaitlistBooked?: string;
  /** 'true'/'false' — whether session is recurring */
  autoFillIsRecurring?: string;
  /** 'true'/'false' — whether session is in-person */
  autoFillIsInPerson?: string;
  /** Zoom meeting link */
  autoFillZoomLink?: string;
  /** Online stream URL */
  autoFillOnlineStreamUrl?: string;
  /** Original (substitute) teacher name */
  autoFillOriginalTeacher?: string;
  /** Additional teachers (comma-separated) */
  autoFillAdditionalTeachers?: string;
  /** Primary teacher email */
  autoFillTeacherEmail?: string;
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
  momenceSearchConfig?: MomenceSearchConfig;
  momenceSessionsConfig?: MomenceSessionsConfig;
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
  /** Per-page hero image URLs — key = page index (0-based) */
  pageHeroImages?: Record<number, string>;
  /** Domain of the existing Vercel project to deploy to (e.g. mysite.vercel.app or mycustomdomain.com) */
  vercelProjectDomain?: string;
  createdAt: string;
  updatedAt: string;
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Short Answer',
  textarea: 'Long Answer',
  'rich-text': 'Rich Text',
  heading: 'Heading',
  paragraph: 'Paragraph',
  banner: 'Banner',
  select: 'Dropdown',
  radio: 'Multiple Choice',
  'multiple-choice': 'Multiple Choice',
  'picture-choice': 'Picture Choice',
  multiselect: 'Multiselect',
  checkboxes: 'Checkbox Grid',
  checkbox: 'Single Checkbox',
  'choice-matrix': 'Choice Matrix',
  switch: 'Switch',
  date: 'Date Picker',
  'datetime-local': 'Date & Time Picker',
  time: 'Time Picker',
  'date-range': 'Date Range Picker',
  rating: 'Rating',
  ranking: 'Ranking',
  'star-rating': 'Star Rating',
  'opinion-scale': 'Opinion Scale',
  email: 'Email Input',
  tel: 'Phone Number',
  address: 'Address',
  number: 'Number',
  currency: 'Currency',
  url: 'URL Input',
  password: 'Password',
  file: 'File Upload',
  'voice-recording': 'Voice Recording',
  'submission-picker': 'Submission Picker',
  subform: 'Subform',
  color: 'Color Picker',
  image: 'Image',
  video: 'Video',
  'pdf-viewer': 'PDF Viewer',
  'social-links': 'Social Media Links',
  'member-search': 'Member Search (Momence)',
  'momence-sessions': 'Sessions Picker (Momence)',
  'section-break': 'Section Break',
  'section-collapse': 'Section Collapse',
  divider: 'Divider',
  'html-snippet': 'HTML Snippet',
  hidden: 'Hidden Field',
  lookup: 'Lookup Field',
  formula: 'Formula Field',
  conditional: 'Conditional Field',
  dependent: 'Dependent Field',
  signature: 'Signature',
  'page-break': 'Page Break',
  range: 'Slider',
};

export const FIELD_TYPE_CATEGORIES: Record<string, FieldType[]> = {
  'Display Text': ['heading', 'paragraph', 'banner'],
  'Text': ['text', 'textarea', 'rich-text'],
  'Choices': ['select', 'picture-choice', 'multiselect', 'switch', 'multiple-choice', 'checkbox', 'checkboxes', 'choice-matrix'],
  'Time': ['date', 'datetime-local', 'time', 'date-range'],
  'Rating & Ranking': ['rating', 'ranking', 'star-rating', 'range', 'opinion-scale'],
  'Contact Info': ['email', 'tel', 'address'],
  'Number': ['number', 'currency'],
  'Miscellaneous': ['url', 'color', 'password', 'file', 'signature', 'voice-recording', 'submission-picker', 'subform'],
  'Navigation & Layout': ['section-break', 'section-collapse', 'divider', 'html-snippet', 'page-break', 'hidden'],
  'Media': ['image', 'video', 'pdf-viewer', 'social-links'],
  'Advanced': ['lookup', 'formula', 'conditional', 'dependent'],
  'Integrations': ['member-search', 'momence-sessions'],
};

export function createDefaultField(type: FieldType, order: number): FormField {
  const id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const base: FormField = {
    id,
    name: id,
    label: FIELD_TYPE_LABELS[type] ?? 'Field',
    type,
    placeholder: '',
    isRequired: false,
    isHidden: false,
    isReadOnly: false,
    isDisabled: false,
    width: '100',
    order,
  };

  const optionTypes: FieldType[] = ['select', 'radio', 'multiple-choice', 'picture-choice', 'multiselect', 'choice-matrix', 'checkbox', 'checkboxes', 'switch'];
  if (optionTypes.includes(type)) {
    base.options = [
      { label: 'Option 1', value: 'option_1' },
      { label: 'Option 2', value: 'option_2' },
    ];
  }

  if (['rating', 'ranking', 'star-rating'].includes(type)) {
    base.max = 5;
    base.min = 1;
  }

  if (type === 'range' || type === 'opinion-scale') {
    base.min = 0;
    base.max = 10;
    base.step = 1;
  }

  if (type === 'currency') {
    base.step = 0.01;
    base.placeholder = 'Enter an amount';
  }

  if (type === 'date-range') {
    base.placeholder = 'Start → End';
  }

  if (type === 'subform' || type === 'section-collapse') {
    base.helpText = 'Drop your nested fields here';
  }

  if (type === 'momence-sessions') {
    base.label = 'Select Sessions';
    base.momenceSessionsConfig = {
      dateRangeDays: 30,
      showDatePicker: true,
      allowMultiple: true,
      autoFillSessionNames: '',
    };
  }

  if (type === 'member-search') {
    base.label = 'Search Member';
    base.momenceSearchConfig = {
      hostId: 33905,
      locationFieldName: '',
      searchPlaceholder: 'Type a name, email or phone…',
      autoFillFirstName: 'firstName',
      autoFillLastName: 'lastName',
      autoFillEmail: 'email',
      autoFillPhone: 'phoneNumber',
      autoFillSessionsBooked: '',
      autoFillSessionsCheckedIn: '',
      autoFillLateCancelled: '',
      autoFillHomeLocation: '',
      autoFillTags: '',
    };
  }

  return base;
}
