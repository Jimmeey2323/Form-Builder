export type FieldType =
  | 'text'
  | 'email'
  | 'email-otp'
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
  | 'spacer'
  | 'html-snippet'
  | 'image'
  | 'video'
  | 'pdf-viewer'
  | 'social-links'
  | 'member-search'
  | 'momence-sessions'
  | 'hosted-class'
  | 'appointment-slots'
  | 'likert-table';

export interface FieldOption {
  label: string;
  value: string;
  /** Full address to display below the form when this option is selected */
  address?: string;
  /** Optional image URL for picture-choice options */
  imageUrl?: string;
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

export interface AppointmentSlot {
  id: string;
  className: string;
  teacherName: string;
  sessionType: 'group' | 'personal';
  date: string;
  startTime: string;
  durationMinutes: number;
  maxBookings: number;
}

/** One repeating weekly interval for appointment availability */
export interface AppointmentInterval {
  id: string;
  /** Start time, e.g. "09:00" */
  from: string;
  /** End time, e.g. "17:00" */
  to: string;
  /**
   * Applies to which days: "Every Day" | "Weekdays" | "Weekends" |
   * "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
   * Ignored when `specificDate` is set.
   */
  days: string;
  /** When set, this interval only applies on this exact date (YYYY-MM-DD). Overrides `days`. */
  specificDate?: string;
}

/** A blocked-out vacation/holiday date range */
export interface AppointmentVacation {
  id: string;
  startDate: string;
  endDate: string;
}

export interface AppointmentSlotExclusion {
  id: string;
  date: string;
  startTime: string;
}

/** A bookable service / appointment type configured by the form builder */
export interface AppointmentService {
  id: string;
  /** Display name of the service, e.g. "Haircut" (optional) */
  name?: string;
  /** Person providing the service, e.g. "John" (optional) */
  with?: string;
  /** Duration of one slot for this service, in minutes (default 30) */
  durationMinutes: number;
  /** Gap/buffer between consecutive slots in minutes (default 0) */
  bufferMinutes?: number;
  /** How many people can book the same time slot for this service (default 1) */
  maxBookingsPerSlot?: number;
}

/** A specific date window during which appointments can be booked */
export interface AppointmentAvailableDate {
  id: string;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Availability window start time in HH:MM (24h) */
  from: string;
  /** Availability window end time in HH:MM (24h) */
  to: string;
}

export interface AppointmentSlotsConfig {
  // ── Simplified services mode (primary UI) ─────────────────────────────
  /** List of bookable services. When present, the simplified services UI is used. */
  services?: AppointmentService[];
  /** Specific date windows during which appointments can be booked */
  availableDates?: AppointmentAvailableDate[];
  /** Optional instructional note displayed above the slot picker */
  bookingNote?: string;
  /** When true, fully-booked slots are hidden instead of shown as "Full" */
  hideFullSlots?: boolean;

  // ── General display ───────────────────────────────────────────────────
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY/MM/DD';
  startWeekOn?: 'sunday' | 'monday';
  timeFormat?: '12h' | '24h';

  // ── Availability ──────────────────────────────────────────────────────
  /** Third-party calendar integrations to check for conflicts */
  calIntegrations?: { google?: boolean; outlook?: boolean; calendly?: boolean };
  /** Duration of each appointment slot in minutes */
  slotDuration?: 15 | 30 | 45 | 60 | 'custom';
  customSlotDuration?: number;
  /** Weekly repeating availability windows */
  intervals?: AppointmentInterval[];
  /** Rest/buffer period (minutes) added after each slot before the next one starts */
  bufferMinutes?: number;
  lunchtimeEnabled?: boolean;
  lunchtimeFrom?: string;
  lunchtimeTo?: string;

  // ── Limits ────────────────────────────────────────────────────────────
  bookingStartDate?: string;
  bookingEndDate?: string;
  /** Allow booking only this many days into the future */
  rollingDays?: number;
  vacations?: AppointmentVacation[];
  /** Exclude individual auto-generated interval slots on specific dates */
  excludedSlots?: AppointmentSlotExclusion[];
  /** Maximum number of bookings allowed per auto-generated interval slot */
  maxBookingsPerSlot?: number;
  /** Maximum number of appointments allowed per day (null = unlimited) */
  maxAppointmentsPerDay?: number;
  /** Minimum advance notice required (hours + minutes) */
  minSchedulingNoticeHours?: number;
  minSchedulingNoticeMinutes?: number;

  // ── Advanced ──────────────────────────────────────────────────────────
  appointmentType?: 'one-on-one' | 'group';
  groupMaxAttendees?: number;
  sendReminderEmails?: boolean;
  defaultTimezone?: string;
  lockTimezone?: boolean;

  // ── Legacy (backward-compat — manually defined slots) ─────────────────
  timezone?: string;
  stopBookingsAt?: string;
  slots?: AppointmentSlot[];
}

/** A single row (statement/question) in a Likert table */
export interface LikertRow {
  id: string;
  label: string;
}

/** Supported input types for a Likert table column */
export type LikertColumnType = 'radio' | 'checkbox' | 'text' | 'number' | 'select' | 'date' | 'rating';

/** A single column definition in a Likert table */
export interface LikertColumn {
  id: string;
  label: string;
  type: LikertColumnType;
  /** Options for radio / checkbox / select column types */
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  /** Max value for rating columns (default 5) */
  max?: number;
  /** Minimum width hint (e.g. '120px') */
  minWidth?: string;
}

/** Config for the likert-table field type */
export interface LikertTableConfig {
  rows: LikertRow[];
  columns: LikertColumn[];
}

export interface EmailOtpConfig {
  fromName?: string;
  fromEmail?: string;
  mailtrapToken?: string;
  otpLength?: number;
  otpExpiryMinutes?: number;
  subject?: string;
  sendButtonText?: string;
  verifyButtonText?: string;
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
  /** When true, appends an "Other…" option that reveals a free-text input */
  allowOther?: boolean;

  // Advanced
  conditionalRules?: ConditionalRule[];
  lookupConfig?: LookupConfig;
  formulaConfig?: FormulaConfig;
  momenceSearchConfig?: MomenceSearchConfig;
  momenceSessionsConfig?: MomenceSessionsConfig;
  appointmentSlotsConfig?: AppointmentSlotsConfig;
  emailOtpConfig?: EmailOtpConfig;
  likertTableConfig?: LikertTableConfig;
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
  // Rating
  ratingIcon?: string;
  // Range/Slider
  rangeShowValue?: boolean;
  rangeValueSuffix?: string;
  // Switch
  switchDefaultOn?: boolean;
  switchOnLabel?: string;
  switchOffLabel?: string;
  // Password
  passwordReveal?: boolean;
  // Section Collapse
  collapseDefaultOpen?: boolean;
  collapseDescription?: string;
  // Divider
  dividerStyle?: 'solid' | 'dashed' | 'dotted';
  dividerThickness?: number;
  // Spacer
  spacerHeight?: string;
  // Signature
  signatureHeight?: number;
  // Subform
  subformTemplateId?: string;
  // Content
  htmlContent?: string;
}

// Email notification configuration
export interface EmailNotificationConfig {
  enabled: boolean;
  /** Mailtrap API token (Bearer auth for send.api.mailtrap.io) */
  mailtrapToken: string;
  /** Google OAuth Client ID (optional, for reference) */
  clientId?: string;
  /** Google OAuth Client Secret (optional, for reference) */
  clientSecret?: string;
  /** Google OAuth Refresh Token (optional, for reference) */
  refreshToken?: string;
  /** Sender email address */
  from: string;
  /** Sender display name */
  fromName?: string;
  /** Recipient email(s) — comma-separated. Supports {{fieldName}} placeholders */
  to: string;
  /** CC email(s) — comma-separated */
  cc?: string;
  /** BCC email(s) — comma-separated */
  bcc?: string;
  /** Email subject. Supports {{fieldName}} placeholders */
  subject: string;
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
  /** Enable cursive styling for part of the header */
  headerCursiveEnabled?: boolean;
  /** Which part of the header should be cursive: 'left', 'right', 'all' */
  headerCursivePart?: 'left' | 'right' | 'all';
  /** Cursive font family to use (e.g., 'Great Vibes', 'Brush Script MT') */
  headerCursiveFont?: string;
  /** Text alignment for form header, logo container, and footer */
  headerAlign?: 'left' | 'center' | 'right';
  /** Text alignment for field labels */
  labelAlign?: 'left' | 'center' | 'right';
  /** Gap between fields (e.g. '16px', '24px') */
  fieldGap?: string;
  /** Line height for form text (e.g. '1.5', '1.8') */
  lineHeight?: string;
  /** Minimum visual height for the form card (e.g. '640px') */
  formMinHeight?: string;
  /** Outer border width of the form card (e.g. '1px', '2px') */
  formBorderWidth?: string;
  /** Outer border color of the form card */
  formBorderColor?: string;
  customCss?: string;
  /** Control the border style of input fields */
  inputBorderStyle?: 'solid' | 'bottom-only' | 'none';
  /** Shape of the submit button */
  buttonStyle?: 'rounded' | 'pill' | 'square';
  /** Submit button background (hex/rgb/gradient CSS string) */
  submitButtonBackground?: string;
  /** Next/Back button background */
  navButtonBackground?: string;
  /** Next/Back button text color */
  navButtonTextColor?: string;
  /** Next/Back button border color */
  navButtonBorderColor?: string;
  // ── Per-button-type overrides ──────────────────────────────────────────
  /** Back button background (overrides navButtonBackground for Back only) */
  backButtonBackground?: string;
  /** Back button text color */
  backButtonTextColor?: string;
  /** Back button border color */
  backButtonBorderColor?: string;
  /** Back button hover background */
  backButtonHoverBackground?: string;
  /** Next button background (overrides navButtonBackground for Next only) */
  nextButtonBackground?: string;
  /** Next button text color */
  nextButtonTextColor?: string;
  /** Next button border color */
  nextButtonBorderColor?: string;
  /** Next button hover background */
  nextButtonHoverBackground?: string;
  /** Submit button hover background */
  submitButtonHoverBackground?: string;
  /** Submit button border color */
  submitButtonBorderColor?: string;
  /** Submit button hover text color */
  submitButtonHoverTextColor?: string;
  /** Radius for submit/next/back buttons (e.g. '10px') */
  buttonRadius?: string;
  /** Button vertical padding (e.g. '12px') */
  buttonPaddingY?: string;
  /** Button horizontal padding (e.g. '14px') */
  buttonPaddingX?: string;
  /** Submit button font size (e.g. '15px') */
  submitButtonFontSize?: string;
  /** Submit button font weight (e.g. '600') */
  submitButtonFontWeight?: string;
  /** Submit button width: 'full' = 100%, 'auto' = fit content, or a custom value like '200px' */
  submitButtonWidth?: string;
  /** Alignment of the submit button container when not full-width */
  submitButtonAlign?: 'left' | 'center' | 'right';
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

export interface HeroImageConfig {
  /** Image URL for this page hero slot */
  url: string;
  /** Horizontal focal point (0-100) */
  cropX?: number;
  /** Vertical focal point (0-100) */
  cropY?: number;
  /** Zoom percentage (100 = default) */
  zoom?: number;
  /** Hero/image panel height in px */
  height?: number;
  /** Colour overlay hex (e.g. '#000000') */
  overlayColor?: string;
  /** Overlay opacity 0–80 */
  overlayOpacity?: number;
  /** Brightness 30–170 (100 = normal) */
  brightness?: number;
  /** Gaussian blur in px 0–20 */
  blur?: number;
  /** Contrast 30–200 (100 = normal) */
  contrast?: number;
  /** Grayscale 0–100 */
  grayscale?: number;
}

export type PageHeroImageValue = string | HeroImageConfig;

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
  layout?: 'classic' | 'card' | 'split-left' | 'split-right' | 'banner-top' | 'floating' | 'fullscreen' | 'editorial-left' | 'editorial-right' | 'showcase-banner';
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
  emailNotificationConfig: EmailNotificationConfig;
  /** The last successfully deployed Vercel URL for this form */
  deployedUrl?: string;
  /** Per-page hero image settings — key = page index (0-based) */
  pageHeroImages?: Record<number, PageHeroImageValue>;
  /** Domain of the existing Vercel project to deploy to (e.g. mysite.vercel.app or mycustomdomain.com) */
  vercelProjectDomain?: string;
  /** Whether the form is locked to prevent edits */
  isLocked?: boolean;
  /** Whether this form is a saved template for future use */
  isTemplate?: boolean;
  /** If true, live/published forms are locked by default */
  isPublished?: boolean;
  /** Publication lifecycle state */
  publicationState?: 'draft' | 'published';
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
  'email-otp': 'Email + OTP Verification',
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
  'hosted-class': 'Hosted Class',
  'appointment-slots': 'Appointment Time Slots',
  'likert-table': 'Likert Table',
  'section-break': 'Section Break',
  'section-collapse': 'Section Collapse',
  divider: 'Divider',
  spacer: 'Spacer / Empty Space',
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
  'Choices': ['select', 'picture-choice', 'multiselect', 'switch', 'multiple-choice', 'checkbox', 'checkboxes', 'choice-matrix', 'likert-table'],
  'Time': ['date', 'datetime-local', 'time', 'date-range', 'appointment-slots'],
  'Rating & Ranking': ['rating', 'ranking', 'star-rating', 'range', 'opinion-scale'],
  'Contact Info': ['email', 'email-otp', 'tel', 'address'],
  'Number': ['number', 'currency'],
  'Miscellaneous': ['url', 'color', 'password', 'file', 'signature', 'voice-recording', 'submission-picker', 'subform'],
  'Navigation & Layout': ['section-break', 'section-collapse', 'divider', 'spacer', 'html-snippet', 'page-break', 'hidden'],
  'Media': ['image', 'video', 'pdf-viewer', 'social-links'],
  'Advanced': ['lookup', 'formula', 'conditional', 'dependent'],
  'Integrations': ['member-search', 'momence-sessions', 'hosted-class'],
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

  const optionTypes: FieldType[] = ['select', 'radio', 'multiple-choice', 'picture-choice', 'multiselect', 'choice-matrix', 'checkbox', 'checkboxes', 'switch', 'ranking', 'submission-picker', 'dependent'];
  if (optionTypes.includes(type)) {
    base.options = [
      { label: 'Option 1', value: 'option_1' },
      { label: 'Option 2', value: 'option_2' },
    ];
  }

  if (['rating', 'ranking', 'star-rating'].includes(type)) {
    base.max = 5;
    base.min = 1;
    base.ratingIcon = 'star';
  }

  if (type === 'range' || type === 'opinion-scale') {
    base.min = 0;
    base.max = 10;
    base.step = 1;
    base.rangeShowValue = true;
    base.rangeValueSuffix = '';
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
    base.collapseDefaultOpen = false;
    base.collapseDescription = 'Content area — fields placed here will toggle visibility';
  }

  if (type === 'momence-sessions' || type === 'hosted-class') {
    base.label = type === 'hosted-class' ? 'Hosted Class' : 'Select Sessions';
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

  if (type === 'appointment-slots') {
    base.label = 'Appointment';
    base.appointmentSlotsConfig = {
      dateFormat: 'MM/DD/YYYY',
      startWeekOn: 'sunday',
      timeFormat: '12h',
      slotDuration: 60,
      bufferMinutes: 0,
      intervals: [
        { id: `int_${Date.now()}`, from: '09:00', to: '17:00', days: 'Weekdays' },
      ],
      lunchtimeEnabled: false,
      lunchtimeFrom: '12:00',
      lunchtimeTo: '13:00',
      rollingDays: 60,
      vacations: [],
      excludedSlots: [],
      maxBookingsPerSlot: 1,
      appointmentType: 'one-on-one',
      sendReminderEmails: false,
      defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      lockTimezone: false,
    };
  }

  if (type === 'email-otp') {
    base.label = 'Email Verification';
    base.name = 'verifiedEmail';
    base.placeholder = 'name@example.com';
    base.emailOtpConfig = {
      fromName: 'Physique 57 India',
      fromEmail: 'hello@physique57india.com',
      mailtrapToken: import.meta.env.VITE_MAILTRAP_API_TOKEN || '',
      otpLength: 6,
      otpExpiryMinutes: 10,
      subject: 'Your verification code',
      sendButtonText: 'Send OTP',
      verifyButtonText: 'Verify OTP',
    };
  }

  if (type === 'spacer') {
    base.label = 'Empty Space';
    base.helpText = '20px'; // Backward-compatible height
    base.spacerHeight = '20px';
  }

  if (type === 'divider') {
    base.dividerStyle = 'solid';
    base.dividerThickness = 1;
  }

  if (type === 'password') {
    base.placeholder = 'Enter password';
    base.passwordReveal = true;
  }

  if (type === 'likert-table') {
    base.label = 'Likert Table';
    base.likertTableConfig = {
      rows: [
        { id: `lrow_${Date.now()}_1`, label: 'Statement 1' },
        { id: `lrow_${Date.now()}_2`, label: 'Statement 2' },
        { id: `lrow_${Date.now()}_3`, label: 'Statement 3' },
      ],
      columns: [
        {
          id: `lcol_${Date.now()}_1`,
          label: 'Agreement',
          type: 'radio',
          options: [
            { label: 'Strongly Agree', value: 'strongly_agree' },
            { label: 'Agree', value: 'agree' },
            { label: 'Neutral', value: 'neutral' },
            { label: 'Disagree', value: 'disagree' },
            { label: 'Strongly Disagree', value: 'strongly_disagree' },
          ],
          required: false,
        },
      ],
    };
  }

  if (type === 'signature') {
    base.signatureHeight = 200;
  }

  return base;
}
