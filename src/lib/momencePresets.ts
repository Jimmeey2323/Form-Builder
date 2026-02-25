import { FieldType } from '@/types/formField';

export interface FieldPreset {
  id: string;
  label: string;
  name: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  isHidden?: boolean;
  isReadOnly?: boolean;
  options?: { label: string; value: string }[];
}

function sl(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function opts(labels: string[]) {
  return labels.map(l => ({ label: l, value: sl(l) }));
}

// ── Preset dropdown option lists ───────────────────────────────────────────────

const LOCATIONS = opts([
  'Kwality House Kemps Corner', 'Kenkere House', 'South United Football Club',
  'Supreme HQ Bandra', 'WeWork Prestige Central', 'WeWork Galaxy',
  'The Studio by Copper + Cloves', 'Pop-up',
]);

const TRAINERS = opts([
  'Anisha Shah', 'Atulan Purohit', 'Karanvir Bhatia', 'Mrigakshi Jaiswal',
  'Reshma Sharma', 'Karan Bhatia', 'Pushyank Nahar', 'Shruti Kulkarni',
  'Janhavi Jain', 'Rohan Dahima', 'Kajol Kanchan', 'Vivaran Dhasmana',
  'Upasna Paranjpe', 'Richard D\'Costa', 'Pranjali Jain', 'Saniya Jaiswal',
  'Shruti Suresh', 'Cauveri Vikrant', 'Poojitha Bhaskar', 'Nishanth Raj',
  'Siddhartha Kusuma', 'Simonelle De Vitre', 'Kabir Varma', 'Simran Dutt',
  'Veena Narasimhan', 'Anmol Sharma', 'Bret Saldanha', 'Raunak Khemuka',
  'Chaitanya Nahar', 'Sovena Shetty',
]);

const CLASSES = opts([
  'Studio Barre 57', 'Studio Foundations', 'Studio Barre 57 Express',
  'Studio Cardio Barre', 'Studio FIT', 'Studio Mat 57', 'Studio SWEAT In 30',
  'Studio Amped Up!', 'Studio Back Body Blaze', 'Studio Cardio Barre Plus',
  'Studio Cardio Barre Express', 'Studio HIIT', 'Studio Back Body Blaze Express',
  'Studio Recovery', 'Studio Hosted Class', 'Studio Trainer\'s Choice',
  'Studio Pre/Post Natal', 'Studio Mat 57 Express', 'Studio PowerCycle Express',
  'Studio PowerCycle', 'Studio Strength Lab (Pull)', 'Studio Strength Lab (Full Body)',
  'Studio Strength Lab (Push)', 'Studio Strength Lab',
]);

const PACKAGES = opts([
  'Barre 1 month Unlimited', 'Studio 2 Week Unlimited', 'Studio Single Class',
  'Session', 'Private Class', 'Studio 8 Class Package', 'Studio 10 Class Package',
  'Money Credits', 'Studio Private Class', 'Retail', 'Studio 4 Class Package',
  'Studio 1 Month Unlimited', 'Studio 3 Month Unlimited', 'Studio Annual Unlimited',
  'Studio Newcomers 2 For 1', 'Studio 12 Class Package',
  'Studio 10 Single Class Package', 'Studio 30 Single Class Package',
  'Studio 20 Single Class Package', 'Barre 6 month Unlimited',
  'Studio 6 Month Unlimited', 'Barre 2 week Unlimited',
  'Studio 3 Month Unlimited - Monthly', 'Gift Card',
  'Newcomer 8 Class Package', 'Studio 6 Week Unlimited',
]);

const PRODUCT_CATEGORIES = opts([
  'Memberships', 'Sessions/Single Classes', 'Privates',
  'Class Packages', 'Credits', 'Retail', 'Gift Cards', 'Others',
]);

const ASSOCIATES = opts([
  'Akshay Rane', 'Vahishta Fitter', 'Zaheer Agarbattiwala', 'Zahur Shaikh',
  'Nadiya Shaikh', 'Admin Admin', 'Shipra Bhika', 'Imran Shaikh',
  'Tahira Sayyed', 'Manisha Rathod', 'Sheetal Kataria', 'Priyanka Abnave',
  'Api Serou', 'Prathap Kp', 'Pavanthika', 'Santhosh Kumar',
]);

const PRIORITY = opts([
  'Low (log only)', 'Medium (48hrs)', 'High (24hrs)', 'Critical (immediate)',
]);

const CLIENT_STATUS = opts([
  'Existing Active', 'Existing Inactive', 'New Prospect',
  'Trial Client', 'Guest (Hosted Class)',
]);

const ISSUE_CATEGORIES = opts([
  'Equipment/Facilities', 'Class Experience', 'Instructor Performance',
  'Billing/Payments', 'Scheduling/Booking', 'Customer Service',
  'Safety Concern', 'Partnership/Collaboration', 'Other',
]);

const DEPARTMENT_ROUTING = opts([
  'Operations', 'Facilities', 'Training', 'Sales',
  'Client Success', 'Marketing', 'Finance', 'Management',
]);

// ── 1. Standard dropdown presets ──────────────────────────────────────────────

export const MOMENCE_PRESET_FIELDS: FieldPreset[] = [
  { id: 'preset_location',    label: 'Location',           name: 'location',           type: 'select', placeholder: 'Select location…',      options: LOCATIONS },
  { id: 'preset_trainer',     label: 'Trainer',            name: 'trainer',            type: 'select', placeholder: 'Select trainer…',       options: TRAINERS },
  { id: 'preset_class',       label: 'Class',              name: 'class_name',         type: 'select', placeholder: 'Select class…',         options: CLASSES },
  { id: 'preset_package',     label: 'Package',            name: 'package',            type: 'select', placeholder: 'Select package…',       options: PACKAGES },
  { id: 'preset_product_cat', label: 'Product Category',  name: 'product_category',   type: 'select', placeholder: 'Select category…',      options: PRODUCT_CATEGORIES },
  { id: 'preset_associate',   label: 'Associate',          name: 'associate',          type: 'select', placeholder: 'Select associate…',     options: ASSOCIATES },
  { id: 'preset_priority',    label: 'Priority',           name: 'priority',           type: 'select', placeholder: 'Select priority…',      options: PRIORITY },
  { id: 'preset_client_stat', label: 'Client Status',      name: 'client_status',      type: 'select', placeholder: 'Select client status…', options: CLIENT_STATUS },
  { id: 'preset_issue_cat',   label: 'Issue Category',     name: 'issue_category',     type: 'select', placeholder: 'Select issue category…',options: ISSUE_CATEGORIES },
  { id: 'preset_dept',        label: 'Department Routing', name: 'department_routing', type: 'select', placeholder: 'Select department…',    options: DEPARTMENT_ROUTING },
];

// ── 2. Session response mapping fields ────────────────────────────────────────
// These fields receive auto-filled values from the Sessions Picker (momence-sessions).
// Map each field name in the Sessions config → auto-fill mappings tab.

export const SESSION_MAPPING_FIELDS: FieldPreset[] = [
  {
    id: 'sm_id',
    label: 'Session ID',
    name: 'session_id',
    type: 'hidden',
    helpText: 'Auto-filled: Momence session ID(s) for the selected session(s).',
    isHidden: true,
  },
  {
    id: 'sm_name',
    label: 'Session Name',
    name: 'session_name',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Name of the selected session(s).',
    isReadOnly: true,
  },
  {
    id: 'sm_start',
    label: 'Session Start',
    name: 'session_start',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Start date & time (ISO) of the selected session(s).',
    isReadOnly: true,
  },
  {
    id: 'sm_end',
    label: 'Session End',
    name: 'session_end',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: End date & time (ISO) of the selected session(s).',
    isReadOnly: true,
  },
  {
    id: 'sm_instructor',
    label: 'Instructor',
    name: 'session_instructor',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Trainer / instructor name(s).',
    isReadOnly: true,
  },
  {
    id: 'sm_location',
    label: 'Session Location',
    name: 'session_location',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Studio/location name.',
    isReadOnly: true,
  },
  {
    id: 'sm_level',
    label: 'Level / Difficulty',
    name: 'session_level',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Difficulty or skill level.',
    isReadOnly: true,
  },
  {
    id: 'sm_category',
    label: 'Session Category',
    name: 'session_category',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Activity type or session category.',
    isReadOnly: true,
  },
  {
    id: 'sm_duration',
    label: 'Duration (min)',
    name: 'session_duration',
    type: 'number',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Duration of the session in minutes.',
    isReadOnly: true,
  },
  {
    id: 'sm_capacity',
    label: 'Capacity',
    name: 'session_capacity',
    type: 'number',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Total spots available in the session.',
    isReadOnly: true,
  },
  {
    id: 'sm_spots_left',
    label: 'Spots Remaining',
    name: 'session_spots_left',
    type: 'number',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Number of spots still available.',
    isReadOnly: true,
  },
  {
    id: 'sm_booked',
    label: 'Booked Count',
    name: 'session_booked_count',
    type: 'number',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Number of participants already booked/registered.',
    isReadOnly: true,
  },
  {
    id: 'sm_late_canc',
    label: 'Late Cancellations',
    name: 'session_late_cancelled',
    type: 'number',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Number of late cancellations for this session.',
    isReadOnly: true,
  },
  {
    id: 'sm_price',
    label: 'Session Price',
    name: 'session_price',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Price of the session.',
    isReadOnly: true,
  },
  // ── Detail-call fields ──────────────────────────────────────────────────
  {
    id: 'sm_tags',
    label: 'Session Tags',
    name: 'session_tags',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Comma-separated tags from the session.',
    isReadOnly: true,
  },
  {
    id: 'sm_teacher_email',
    label: 'Teacher Email',
    name: 'session_teacher_email',
    type: 'email',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Primary teacher email address.',
    isReadOnly: true,
  },
  {
    id: 'sm_orig_teacher',
    label: 'Original Teacher',
    name: 'session_original_teacher',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Original/substitute teacher name.',
    isReadOnly: true,
  },
  {
    id: 'sm_add_teachers',
    label: 'Additional Teachers',
    name: 'session_additional_teachers',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Comma-separated additional teacher names.',
    isReadOnly: true,
  },
  {
    id: 'sm_waitlist_cap',
    label: 'Waitlist Capacity',
    name: 'session_waitlist_capacity',
    type: 'number',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Maximum waitlist size.',
    isReadOnly: true,
  },
  {
    id: 'sm_waitlist_booked',
    label: 'Waitlist Booked',
    name: 'session_waitlist_booked',
    type: 'number',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Current waitlist booking count.',
    isReadOnly: true,
  },
  {
    id: 'sm_is_recurring',
    label: 'Is Recurring',
    name: 'session_is_recurring',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: true/false — whether this is a recurring session.',
    isReadOnly: true,
  },
  {
    id: 'sm_is_in_person',
    label: 'Is In-Person',
    name: 'session_is_in_person',
    type: 'text',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: true/false — whether this is an in-person session.',
    isReadOnly: true,
  },
  {
    id: 'sm_zoom_link',
    label: 'Zoom Link',
    name: 'session_zoom_link',
    type: 'url',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Zoom meeting URL (if online).',
    isReadOnly: true,
  },
  {
    id: 'sm_online_stream',
    label: 'Online Stream URL',
    name: 'session_online_stream_url',
    type: 'url',
    placeholder: 'Auto-filled by session picker',
    helpText: 'Auto-filled: Online stream URL (if livestreamed).',
    isReadOnly: true,
  },
];

// ── 3. Member response mapping fields ─────────────────────────────────────────
// These fields receive auto-filled values from the Member Search (member-search).
// Map field names in the Momence tab → auto-fill mappings section.

export const MEMBER_MAPPING_FIELDS: FieldPreset[] = [
  {
    id: 'mm_id',
    label: 'Member ID',
    name: 'member_id',
    type: 'hidden',
    helpText: 'Auto-filled: Momence member ID.',
    isHidden: true,
  },
  {
    id: 'mm_first',
    label: 'First Name',
    name: 'member_first_name',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Member\'s first name.',
    isReadOnly: true,
  },
  {
    id: 'mm_last',
    label: 'Last Name',
    name: 'member_last_name',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Member\'s last name.',
    isReadOnly: true,
  },
  {
    id: 'mm_email',
    label: 'Email',
    name: 'member_email',
    type: 'email',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Member\'s email address.',
    isReadOnly: true,
  },
  {
    id: 'mm_phone',
    label: 'Phone',
    name: 'member_phone',
    type: 'tel',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Member\'s phone number.',
    isReadOnly: true,
  },
  {
    id: 'mm_booked',
    label: 'Sessions Booked',
    name: 'member_sessions_booked',
    type: 'number',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Total sessions booked by this member.',
    isReadOnly: true,
  },
  {
    id: 'mm_checked_in',
    label: 'Sessions Checked-In',
    name: 'member_sessions_checked_in',
    type: 'number',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Total sessions where this member checked in.',
    isReadOnly: true,
  },
  {
    id: 'mm_late_canc',
    label: 'Late Cancellations',
    name: 'member_late_cancelled',
    type: 'number',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Number of late cancellations by this member.',
    isReadOnly: true,
  },
  {
    id: 'mm_home_loc',
    label: 'Home Location',
    name: 'member_home_location',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Member\'s home studio location.',
    isReadOnly: true,
  },
  {
    id: 'mm_tags',
    label: 'Member Tags',
    name: 'member_tags',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Comma-separated member tags.',
    isReadOnly: true,
  },
  // ── Detail-call fields (from action:'detail') ───────────────────────────
  {
    id: 'mm_customer_tags',
    label: 'Customer Tags',
    name: 'member_customer_tags',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Full customer tags from Momence profile.',
    isReadOnly: true,
  },
  {
    id: 'mm_first_seen',
    label: 'First Seen',
    name: 'member_first_seen',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Date/time the member was first seen.',
    isReadOnly: true,
  },
  {
    id: 'mm_last_seen',
    label: 'Last Seen',
    name: 'member_last_seen',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Date/time the member was last seen.',
    isReadOnly: true,
  },
  {
    id: 'mm_total_visits',
    label: 'Total Visits',
    name: 'member_total_visits',
    type: 'number',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: All-time visit count.',
    isReadOnly: true,
  },
  {
    id: 'mm_membership_name',
    label: 'Active Membership',
    name: 'member_active_membership_name',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Name of current active membership.',
    isReadOnly: true,
  },
  {
    id: 'mm_membership_type',
    label: 'Membership Type',
    name: 'member_active_membership_type',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Type of active membership (subscription/package).',
    isReadOnly: true,
  },
  {
    id: 'mm_membership_end',
    label: 'Membership End Date',
    name: 'member_active_membership_end_date',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: End date of active membership.',
    isReadOnly: true,
  },
  {
    id: 'mm_membership_used',
    label: 'Sessions Used',
    name: 'member_membership_sessions_used',
    type: 'number',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Sessions used in current membership period.',
    isReadOnly: true,
  },
  {
    id: 'mm_membership_limit',
    label: 'Sessions Limit',
    name: 'member_membership_sessions_limit',
    type: 'number',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Session limit on current membership.',
    isReadOnly: true,
  },
  {
    id: 'mm_membership_frozen',
    label: 'Membership Frozen',
    name: 'member_active_membership_frozen',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: true/false — whether membership is currently frozen.',
    isReadOnly: true,
  },
  {
    id: 'mm_recent_sessions',
    label: 'Recent Sessions Count',
    name: 'member_recent_sessions_count',
    type: 'number',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Count of recent session bookings.',
    isReadOnly: true,
  },
  {
    id: 'mm_last_session_name',
    label: 'Last Session Name',
    name: 'member_last_session_name',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Name of the most recently booked session.',
    isReadOnly: true,
  },
  {
    id: 'mm_last_session_date',
    label: 'Last Session Date',
    name: 'member_last_session_date',
    type: 'text',
    placeholder: 'Auto-filled by member search',
    helpText: 'Auto-filled: Start time of the most recently booked session.',
    isReadOnly: true,
  },
];
