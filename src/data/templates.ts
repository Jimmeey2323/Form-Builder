import { FormConfig, FormField, FormTheme } from '@/types/formField';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Optional sub-category (e.g. from CSV import) */
  subCategory?: string;
  icon: string;
  fields: FormField[];
  config: Partial<FormConfig>;
  /** True for templates created by the user (e.g. via CSV import) */
  isUserCreated?: boolean;
  /** ISO timestamp of when this template was created */
  createdAt?: string;
}

export const formTemplates: Template[] = [
  {
    id: 'contact',
    name: 'Contact Form',
    description: 'Simple contact form with name, email, and message',
    category: 'Marketing',
    icon: '📞',
    fields: [
      {
        id: 'firstName', name: 'firstName', label: 'First Name', type: 'text',
        placeholder: 'John', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 0, autocomplete: 'given-name',
      },
      {
        id: 'lastName', name: 'lastName', label: 'Last Name', type: 'text',
        placeholder: 'Doe', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 1, autocomplete: 'family-name',
      },
      {
        id: 'email', name: 'email', label: 'Email Address', type: 'email',
        placeholder: 'john@example.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 2, autocomplete: 'email',
      },
      {
        id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel',
        placeholder: '+1 (555) 123-4567', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 3, autocomplete: 'tel',
      },
      {
        id: 'message', name: 'message', label: 'Message', type: 'textarea',
        placeholder: 'Tell us how we can help...', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 4,
      },
    ],
    config: {
      title: 'Contact Us',
      subHeader: '',
      description: 'Get in touch with our team',
      submitButtonText: 'Send Message',
      successMessage: 'Thank you for your message! We\'ll get back to you soon.',
    }
  },
  {
    id: 'newsletter',
    name: 'Newsletter Signup',
    description: 'Minimal newsletter subscription form',
    category: 'Marketing',
    icon: '📧',
    fields: [
      {
        id: 'email', name: 'email', label: 'Email Address', type: 'email',
        placeholder: 'Enter your email', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 0, autocomplete: 'email',
      },
      {
        id: 'firstName', name: 'firstName', label: 'First Name', type: 'text',
        placeholder: 'Your first name', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 1, autocomplete: 'given-name',
      },
    ],
    config: {
      title: 'Stay Updated',
      subHeader: '',
      description: 'Subscribe to our newsletter for the latest updates',
      submitButtonText: 'Subscribe',
      successMessage: 'Welcome aboard! Check your email to confirm your subscription.',
    }
  },
  {
    id: 'registration',
    name: 'Event Registration',
    description: 'Complete event registration with personal details',
    category: 'Events',
    icon: '🎟️',
    fields: [
      {
        id: 'firstName', name: 'firstName', label: 'First Name', type: 'text',
        placeholder: 'John', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 0, autocomplete: 'given-name',
      },
      {
        id: 'lastName', name: 'lastName', label: 'Last Name', type: 'text',
        placeholder: 'Doe', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 1, autocomplete: 'family-name',
      },
      {
        id: 'email', name: 'email', label: 'Email Address', type: 'email',
        placeholder: 'john@example.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 2, autocomplete: 'email',
      },
      {
        id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel',
        placeholder: '+1 (555) 123-4567', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 3, autocomplete: 'tel',
      },
      {
        id: 'company', name: 'company', label: 'Company/Organization', type: 'text',
        placeholder: 'Your company name', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 4, autocomplete: 'organization',
      },
      {
        id: 'ticketType', name: 'ticketType', label: 'Ticket Type', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 5,
        options: [
          { label: 'General Admission', value: 'general' },
          { label: 'VIP Pass', value: 'vip' },
          { label: 'Student Discount', value: 'student' },
        ],
      },
      {
        id: 'dietaryRestrictions', name: 'dietaryRestrictions', label: 'Dietary Restrictions', type: 'textarea',
        placeholder: 'Please list any dietary restrictions or allergies', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 6,
      },
    ],
    config: {
      title: 'Event Registration',
      subHeader: 'Annual Conference 2026',
      description: 'Join us for an amazing conference experience',
      submitButtonText: 'Register Now',
      successMessage: 'Registration successful! You\'ll receive a confirmation email shortly.',
    }
  },
  {
    id: 'feedback',
    name: 'Customer Feedback',
    description: 'Collect customer satisfaction and feedback',
    category: 'Feedback',
    icon: '⭐',
    fields: [
      {
        id: 'name', name: 'name', label: 'Your Name', type: 'text',
        placeholder: 'Full name', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 0,
      },
      {
        id: 'email', name: 'email', label: 'Email Address', type: 'email',
        placeholder: 'your@email.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 1, autocomplete: 'email',
      },
      {
        id: 'rating', name: 'rating', label: 'Overall Rating', type: 'rating',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 2, max: 5,
      },
      {
        id: 'experience', name: 'experience', label: 'How was your experience?', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 3,
        options: [
          { label: 'Excellent', value: 'excellent' },
          { label: 'Good', value: 'good' },
          { label: 'Average', value: 'average' },
          { label: 'Poor', value: 'poor' },
        ],
      },
      {
        id: 'improvements', name: 'improvements', label: 'What could we improve?', type: 'checkbox',
        isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 4,
        options: [
          { label: 'Customer Service', value: 'service' },
          { label: 'Product Quality', value: 'quality' },
          { label: 'Pricing', value: 'pricing' },
          { label: 'Delivery Speed', value: 'delivery' },
          { label: 'Website Experience', value: 'website' },
        ],
      },
      {
        id: 'comments', name: 'comments', label: 'Additional Comments', type: 'textarea',
        placeholder: 'Share any additional feedback...', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 5,
      },
    ],
    config: {
      title: 'We Value Your Feedback',
      subHeader: '',
      description: 'Help us improve by sharing your experience',
      submitButtonText: 'Submit Feedback',
      successMessage: 'Thank you for your feedback! Your input helps us improve.',
    }
  },
  {
    id: 'survey',
    name: 'Market Research Survey',
    description: 'Comprehensive survey for market research',
    category: 'Research',
    icon: '📊',
    fields: [
      {
        id: 'demographics', name: 'demographics', label: 'Demographics', type: 'section-break',
        isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 0,
      },
      {
        id: 'age', name: 'age', label: 'Age Group', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 1,
        options: [
          { label: '18-25', value: '18-25' },
          { label: '26-35', value: '26-35' },
          { label: '36-45', value: '36-45' },
          { label: '46-55', value: '46-55' },
          { label: '56+', value: '56+' },
        ],
      },
      {
        id: 'gender', name: 'gender', label: 'Gender', type: 'radio',
        isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 2,
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Non-binary', value: 'non-binary' },
          { label: 'Prefer not to say', value: 'not-specified' },
        ],
      },
      {
        id: 'income', name: 'income', label: 'Household Income', type: 'select',
        isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 3,
        options: [
          { label: 'Under $30,000', value: 'under-30k' },
          { label: '$30,000 - $50,000', value: '30k-50k' },
          { label: '$50,000 - $75,000', value: '50k-75k' },
          { label: '$75,000 - $100,000', value: '75k-100k' },
          { label: 'Over $100,000', value: 'over-100k' },
        ],
      },
      {
        id: 'preferences', name: 'preferences', label: 'Product Preferences', type: 'section-break',
        isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 4,
      },
      {
        id: 'frequency', name: 'frequency', label: 'How often do you use our product?', type: 'radio',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 5,
        options: [
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Rarely', value: 'rarely' },
          { label: 'Never used it', value: 'never' },
        ],
      },
    ],
    config: {
      title: 'Market Research Survey',
      subHeader: 'Your Opinion Matters',
      description: 'Help us understand your needs and preferences',
      submitButtonText: 'Complete Survey',
      successMessage: 'Survey completed! Thank you for your valuable insights.',
    }
  },
  {
    id: 'lead-gen',
    name: 'Lead Generation',
    description: 'Capture leads with qualification questions',
    category: 'Sales',
    icon: '🎯',
    fields: [
      {
        id: 'firstName', name: 'firstName', label: 'First Name', type: 'text',
        placeholder: 'John', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 0, autocomplete: 'given-name',
      },
      {
        id: 'lastName', name: 'lastName', label: 'Last Name', type: 'text',
        placeholder: 'Doe', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 1, autocomplete: 'family-name',
      },
      {
        id: 'email', name: 'email', label: 'Business Email', type: 'email',
        placeholder: 'john@company.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 2, autocomplete: 'email',
      },
      {
        id: 'company', name: 'company', label: 'Company Name', type: 'text',
        placeholder: 'Your company', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 3, autocomplete: 'organization',
      },
      {
        id: 'jobTitle', name: 'jobTitle', label: 'Job Title', type: 'text',
        placeholder: 'Your role', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 4, autocomplete: 'organization-title',
      },
      {
        id: 'companySize', name: 'companySize', label: 'Company Size', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 5,
        options: [
          { label: '1-10 employees', value: '1-10' },
          { label: '11-50 employees', value: '11-50' },
          { label: '51-200 employees', value: '51-200' },
          { label: '201-1000 employees', value: '201-1000' },
          { label: '1000+ employees', value: '1000+' },
        ],
      },
      {
        id: 'budget', name: 'budget', label: 'What\'s your budget range?', type: 'select',
        isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 6,
        options: [
          { label: 'Under $1,000', value: 'under-1k' },
          { label: '$1,000 - $5,000', value: '1k-5k' },
          { label: '$5,000 - $10,000', value: '5k-10k' },
          { label: '$10,000 - $25,000', value: '10k-25k' },
          { label: 'Over $25,000', value: 'over-25k' },
        ],
      },
    ],
    config: {
      title: 'Get a Free Demo',
      subHeader: 'See how we can help your business grow',
      description: 'Schedule a personalized demo with our team',
      submitButtonText: 'Request Demo',
      successMessage: 'Demo request received! Our sales team will contact you within 24 hours.',
    }
  }

  ,
  {
    id: 'product-launch',
    name: 'Product Launch Waitlist',
    description: 'Collect waitlist members for your next product release',
    category: 'Product',
    icon: '🚀',
    fields: [
      {
        id: 'fullName', name: 'fullName', label: 'Full Name', type: 'text',
        placeholder: 'Alex Rivera', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 0, autocomplete: 'name',
      },
      {
        id: 'email', name: 'email', label: 'Email', type: 'email',
        placeholder: 'alex@company.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 1, autocomplete: 'email',
      },
      {
        id: 'company', name: 'company', label: 'Company / Team', type: 'text',
        placeholder: 'Your team name', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 2, autocomplete: 'organization',
      },
      {
        id: 'interest', name: 'interest', label: 'Product Interest', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 3,
        options: [
          { label: 'Beta access', value: 'beta' },
          { label: 'Early adopter', value: 'early' },
          { label: 'Enterprise preview', value: 'enterprise' },
        ],
      },
      {
        id: 'launchDate', name: 'launchDate', label: 'Preferred Launch Timeline', type: 'select',
        isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 4,
        options: [
          { label: 'Next 30 days', value: '30' },
          { label: '2-3 months', value: '90' },
          { label: 'Later', value: 'later' },
        ],
      },
      {
        id: 'priority', name: 'priority', label: 'Priority', type: 'radio',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 5,
        options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ],
      },
    ],
    config: {
      title: 'Launch Waitlist',
      subHeader: 'Be the first to test the next release',
      description: 'Join the waitlist and we will invite you to our private beta when the product is ready.',
      submitButtonText: 'Join Waitlist',
      successMessage: 'You are on the waitlist! We will email you VIP access details shortly.',
      layout: 'banner-top',
    }
  },
  {
    id: 'workshop',
    name: 'Workshop RSVP',
    description: 'RSVP form for paid or free workshops',
    category: 'Education',
    icon: '🧠',
    fields: [
      {
        id: 'fullName', name: 'fullName', label: 'Full Name', type: 'text',
        placeholder: 'Jamie Lee', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 0, autocomplete: 'name',
      },
      {
        id: 'email', name: 'email', label: 'Email', type: 'email',
        placeholder: 'jamie@example.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 1, autocomplete: 'email',
      },
      {
        id: 'tickets', name: 'tickets', label: 'Number of Seats', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 2,
        options: [
          { label: '1 seat', value: '1' },
          { label: '2 seats', value: '2' },
          { label: 'Group (3+)', value: 'group' },
        ],
      },
      {
        id: 'sessions', name: 'sessions', label: 'Select Sessions', type: 'checkbox',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 3,
        options: [
          { label: 'Founders Lab', value: 'founders' },
          { label: 'Product Sprint', value: 'product' },
          { label: 'Growth Tactics', value: 'growth' },
        ],
      },
      {
        id: 'experience', name: 'experience', label: 'Your Experience Level', type: 'radio',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 4,
        options: [
          { label: 'Beginner', value: 'beginner' },
          { label: 'Intermediate', value: 'intermediate' },
          { label: 'Advanced', value: 'advanced' },
        ],
      },
      {
        id: 'notes', name: 'notes', label: 'Anything else we should know?', type: 'textarea',
        placeholder: 'Dietary restrictions, accessibility needs, or team notes', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 5,
      },
    ],
    config: {
      title: 'Workshop RSVP',
      subHeader: 'Live immersive sessions',
      description: 'Reserve your seat in curated workshop tracks delivered by practitioners.',
      submitButtonText: 'Reserve Seat',
      successMessage: 'You are confirmed! Look for the intro email with the schedule.',
      layout: 'split-right',
    }
  },
  {
    id: 'consultation',
    name: 'Consultation Booking',
    description: 'Schedule a discovery call with your team',
    category: 'Services',
    icon: '💼',
    fields: [
      {
        id: 'fullName', name: 'fullName', label: 'Full Name', type: 'text',
        placeholder: 'Morgan Shea', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 0, autocomplete: 'name',
      },
      {
        id: 'email', name: 'email', label: 'Work Email', type: 'email',
        placeholder: 'morgan@brand.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 1, autocomplete: 'email',
      },
      {
        id: 'company', name: 'company', label: 'Company', type: 'text',
        placeholder: 'Company name', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 2, autocomplete: 'organization',
      },
      {
        id: 'service', name: 'service', label: 'Service Interest', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 3,
        options: [
          { label: 'Strategy Consulting', value: 'strategy' },
          { label: 'Creative Direction', value: 'creative' },
          { label: 'Team Enablement', value: 'enablement' },
        ],
      },
      {
        id: 'preferredDate', name: 'preferredDate', label: 'Preferred Date', type: 'datetime-local',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 4,
      },
      {
        id: 'notes', name: 'notes', label: 'Tell us about your goals', type: 'textarea',
        placeholder: 'What would you like to accomplish during the call?', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 5,
      },
    ],
    config: {
      title: 'Book a Consultation',
      subHeader: 'High-touch advisory',
      description: 'Share your needs and we will schedule a tailored discovery call with a lead team member.',
      submitButtonText: 'Book Call',
      successMessage: 'Thanks! Our team will follow up shortly with the meeting link.',
      layout: 'floating',
    }
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'Collect detailed product issue reports',
    category: 'Support',
    icon: '🐞',
    fields: [
      {
        id: 'name', name: 'name', label: 'Your Name', type: 'text',
        placeholder: 'Avery Mercer', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 0,
      },
      {
        id: 'email', name: 'email', label: 'Email', type: 'email',
        placeholder: 'avery@product.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 1, autocomplete: 'email',
      },
      {
        id: 'product', name: 'product', label: 'Product Area', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 2,
        options: [
          { label: 'Web App', value: 'web' },
          { label: 'Mobile App', value: 'mobile' },
          { label: 'API', value: 'api' },
          { label: 'Integrations', value: 'integrations' },
        ],
      },
      {
        id: 'issueType', name: 'issueType', label: 'Issue Type', type: 'radio',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 3,
        options: [
          { label: 'Bug', value: 'bug' },
          { label: 'Performance', value: 'performance' },
          { label: 'UX', value: 'ux' },
        ],
      },
      {
        id: 'priority', name: 'priority', label: 'Priority', type: 'select',
        isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 4,
        options: [
          { label: 'Critical', value: 'critical' },
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ],
      },
      {
        id: 'browser', name: 'browser', label: 'Browser / OS', type: 'text',
        placeholder: 'Chrome 113 on macOS', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 5,
      },
      {
        id: 'description', name: 'description', label: 'Describe the issue', type: 'textarea',
        placeholder: 'Steps to reproduce, expected vs actual behavior, and screenshots if available', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 6,
      },
    ],
    config: {
      title: 'Bug Report',
      subHeader: 'Log product issues with rich detail',
      description: 'Submit a bug report and we will triage it with the engineering team.',
      submitButtonText: 'Submit Report',
      successMessage: 'Thanks! The engineering team received your report and will respond soon.',
      layout: 'split-left',
    }
  }
];

export const templateCategories = [
  'All',
  'Marketing',
  'Events', 
  'Feedback',
  'Research',
  'Sales',
  'Product',
  'Education',
  'Services',
  'Support'
];

export function getTemplatesByCategory(category: string): Template[] {
  if (category === 'All') {
    return formTemplates;
  }
  return formTemplates.filter(template => template.category === category);
}