import { FormConfig, FormField, FormTheme } from '@/types/formField';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  fields: FormField[];
  config: Partial<FormConfig>;
  isPremium?: boolean;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

export const formTemplates: Template[] = [
  {
    id: 'contact',
    name: 'Contact Form',
    description: 'Simple contact form with name, email, and message',
    category: 'Marketing',
    icon: '📞',
    tags: ['contact', 'support', 'communication'],
    difficulty: 'beginner',
    estimatedTime: '2 minutes',
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
    tags: ['newsletter', 'subscription', 'email'],
    difficulty: 'beginner' as const,
    estimatedTime: '1 minute',
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
    tags: ['events', 'registration', 'booking'],
    difficulty: 'intermediate' as const,
    estimatedTime: '4 minutes',
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
    tags: ['feedback', 'review', 'experience'],
    difficulty: 'beginner' as const,
    estimatedTime: '3 minutes',
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
    tags: ['survey', 'research', 'data'],
    difficulty: 'intermediate',
    estimatedTime: '5 minutes',
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
    tags: ['leads', 'sales', 'conversion'],
    difficulty: 'intermediate',
    estimatedTime: '3 minutes',
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
  },
  // Advanced Professional Templates
  {
    id: 'job_application',
    name: 'Job Application Form',
    description: 'Complete job application with file uploads and detailed fields',
    category: 'HR & Recruiting',
    icon: '💼',
    tags: ['jobs', 'recruitment', 'application', 'hr'],
    difficulty: 'advanced' as const,
    estimatedTime: '8 minutes',
    isPremium: true,
    fields: [
      {
        id: 'position', name: 'position', label: 'Position Applied For', type: 'text',
        placeholder: 'Software Engineer', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 0,
      },
      {
        id: 'fullName', name: 'fullName', label: 'Full Name', type: 'text',
        placeholder: 'John Smith', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 1, autocomplete: 'name',
      },
      {
        id: 'email', name: 'email', label: 'Email Address', type: 'email',
        placeholder: 'john@example.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 2, autocomplete: 'email',
      },
      {
        id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel',
        placeholder: '+1 (555) 123-4567', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 3, autocomplete: 'tel',
      },
      {
        id: 'experience', name: 'experience', label: 'Years of Experience', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 4,
        options: [
          { label: '0-1 years', value: '0-1-years' },
          { label: '2-5 years', value: '2-5-years' },
          { label: '6-10 years', value: '6-10-years' },
          { label: '10+ years', value: '10-plus-years' }
        ],
      },
      {
        id: 'salary', name: 'salary', label: 'Expected Salary Range', type: 'select',
        isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 5,
        options: [
          { label: '$40k-60k', value: '40k-60k' },
          { label: '$60k-80k', value: '60k-80k' },
          { label: '$80k-100k', value: '80k-100k' },
          { label: '$100k+', value: '100k-plus' }
        ],
      },
      {
        id: 'cover_letter', name: 'cover_letter', label: 'Cover Letter', type: 'textarea',
        placeholder: 'Tell us why you\'re interested in this position...', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 6,
      },
    ],
    config: {
      title: 'Job Application',
      subHeader: 'Join Our Team',
      description: 'We\'re excited to learn more about you!',
      submitButtonText: 'Submit Application',
      successMessage: 'Thank you for your application! We\'ll be in touch soon.',
    }
  },
  {
    id: 'booking_appointment',
    name: 'Appointment Booking',
    description: 'Professional appointment scheduling with time slots',
    category: 'Booking & Scheduling',
    icon: '📅',
    tags: ['appointment', 'booking', 'scheduling', 'calendar'],
    difficulty: 'intermediate' as const,
    estimatedTime: '5 minutes',
    fields: [
      {
        id: 'service', name: 'service', label: 'Select Service', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 0,
        options: [
          { label: 'Consultation (30 min)', value: 'consultation-30' },
          { label: 'Full Session (60 min)', value: 'full-session-60' },
          { label: 'Follow-up (15 min)', value: 'followup-15' }
        ],
      },
      {
        id: 'preferred_date', name: 'preferred_date', label: 'Preferred Date', type: 'date',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 1,
      },
      {
        id: 'preferred_time', name: 'preferred_time', label: 'Preferred Time', type: 'select',
        isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 2,
        options: [
          { label: '9:00 AM', value: '09:00' },
          { label: '10:00 AM', value: '10:00' },
          { label: '11:00 AM', value: '11:00' },
          { label: '1:00 PM', value: '13:00' },
          { label: '2:00 PM', value: '14:00' },
          { label: '3:00 PM', value: '15:00' },
          { label: '4:00 PM', value: '16:00' }
        ],
      },
      {
        id: 'client_name', name: 'client_name', label: 'Your Name', type: 'text',
        placeholder: 'Jane Smith', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 3, autocomplete: 'name',
      },
      {
        id: 'client_email', name: 'client_email', label: 'Email Address', type: 'email',
        placeholder: 'jane@example.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '50', order: 4, autocomplete: 'email',
      },
      {
        id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel',
        placeholder: '+1 (555) 123-4567', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 5, autocomplete: 'tel',
      },
      {
        id: 'notes', name: 'notes', label: 'Additional Notes', type: 'textarea',
        placeholder: 'Any specific requirements or questions...', isRequired: false, isHidden: false, isReadOnly: false, isDisabled: false,
        width: '100', order: 6,
      },
    ],
    config: {
      title: 'Book an Appointment',
      subHeader: '',
      description: 'Schedule your session with us',
      submitButtonText: 'Book Appointment',
      successMessage: 'Your appointment has been booked! We\'ll send you a confirmation email.',
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
  'HR & Recruiting',
  'Booking & Scheduling',
  'E-commerce',
  'Healthcare',
  'Insurance & Finance'
];

export function getTemplatesByCategory(category: string): Template[] {
  if (category === 'All') {
    return formTemplates;
  }
  return formTemplates.filter(template => template.category === category);
}