import { useState, useCallback } from 'react';
import { FormConfig, FormField, FormTheme, WebhookConfig, PixelConfig, GoogleSheetsConfig, createDefaultField, FieldType } from '@/types/formField';

const defaultTheme: FormTheme = {
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  fontFamily: "'Inter', sans-serif",
  borderRadius: '12px',
  showLogo: true,
  logoUrl: '/images/p57-logo.png',
  backgroundColor: '#f1f5f9',
  formBackgroundColor: '#ffffff',
  textColor: '#1e293b',
  labelColor: '#1e293b',
  inputBorderColor: '#e2e8f0',
  inputBackgroundColor: '#ffffff',
  buttonTextColor: '#ffffff',
  formWidth: '100%',
  formMaxWidth: '520px',
  formPadding: '32px',
  inputPadding: '14px 16px',
  labelFontSize: '14px',
  inputFontSize: '15px',
  formShadow: 'xl',
  customCss: '',
};

const defaultWebhook: WebhookConfig = {
  enabled: true,
  url: 'https://api.momence.com/integrations/customer-leads/33905/collect',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer qy71rOk8en',
  },
  includeUtmParams: true,
  token: 'qy71rOk8en',
  sourceId: '11606',
  redirectUrl: 'https://momence.com/u/physique-57-bengaluru-0MU0AA',
};

const defaultPixels: PixelConfig = {
  snapPixelId: '5217a3a7-5f50-4c98-803c-a73c9f05737e',
  metaPixelId: '527819981439695',
  googleAdsId: 'AW-809104648',
};

const defaultGoogleSheets: GoogleSheetsConfig = {
  enabled: true,
  spreadsheetId: '',
  sheetName: 'Form Submissions',
};

// Default fields matching the original Bengaluru form
function getDefaultFields(): FormField[] {
  return [
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
      id: 'email', name: 'email', label: 'Email', type: 'email',
      placeholder: 'john.doe@example.com', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
      width: '100', order: 2, autocomplete: 'email',
    },
    {
      id: 'phoneNumber', name: 'phoneNumber', label: 'Phone Number', type: 'tel',
      placeholder: '+91-XXXXXXXXXX', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
      width: '50', order: 3, autocomplete: 'tel',
    },
    {
      id: 'zipCode', name: 'zipCode', label: 'Pincode', type: 'text',
      placeholder: '56XXXX', isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
      width: '50', order: 4, autocomplete: 'postal-code',
    },
    {
      id: 'center', name: 'center', label: 'Select a Studio Location', type: 'select',
      isRequired: true, isHidden: false, isReadOnly: false, isDisabled: false,
      width: '100', order: 5, placeholder: 'Select Preferred Studio Location',
      options: [
        { label: 'Kenkere House, Vittal Mallya Road', value: 'Kenkere House, Vittal Mallya Road' },
        { label: 'the Studio by Copper + Cloves, Indiranagar', value: 'the Studio by Copper + Cloves, Indiranagar' },
      ],
    },
  ];
}

function createDefaultForm(): FormConfig {
  return {
    id: `form_${Date.now()}`,
    title: 'Book a Trial',
    description: '',
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    fields: getDefaultFields(),
    theme: defaultTheme,
    webhookConfig: { ...defaultWebhook },
    pixelConfig: { ...defaultPixels },
    googleSheetsConfig: { ...defaultGoogleSheets },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useFormBuilder() {
  const [forms, setForms] = useState<FormConfig[]>(() => {
    const saved = localStorage.getItem('formcraft_forms');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old forms that don't have new config
      return parsed.map((f: any) => ({
        ...f,
        theme: { ...defaultTheme, ...(f.theme || {}) },
        webhookConfig: f.webhookConfig || { enabled: false, url: '', method: 'POST', headers: {}, includeUtmParams: true },
        pixelConfig: f.pixelConfig || {},
        googleSheetsConfig: f.googleSheetsConfig || { enabled: false },
      }));
    }
    return [];
  });

  const [activeFormId, setActiveFormId] = useState<string | null>(() => {
    const saved = localStorage.getItem('formcraft_forms');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 ? parsed[0].id : null;
  });

  const save = useCallback((updatedForms: FormConfig[]) => {
    setForms(updatedForms);
    localStorage.setItem('formcraft_forms', JSON.stringify(updatedForms));
  }, []);

  const activeForm = forms.find(f => f.id === activeFormId) ?? null;

  const createForm = useCallback(() => {
    const newForm = createDefaultForm();
    const updated = [...forms, newForm];
    save(updated);
    setActiveFormId(newForm.id);
    return newForm;
  }, [forms, save]);

  const deleteForm = useCallback((formId: string) => {
    const updated = forms.filter(f => f.id !== formId);
    save(updated);
    if (activeFormId === formId) {
      setActiveFormId(updated.length > 0 ? updated[0].id : null);
    }
  }, [forms, activeFormId, save]);

  const updateForm = useCallback((formId: string, updates: Partial<FormConfig>) => {
    const updated = forms.map(f =>
      f.id === formId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
    );
    save(updated);
  }, [forms, save]);

  const addField = useCallback((formId: string, fieldType: FieldType) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    const newField = createDefaultField(fieldType, form.fields.length);
    updateForm(formId, { fields: [...form.fields, newField] });
  }, [forms, updateForm]);

  const updateField = useCallback((formId: string, fieldId: string, updates: Partial<FormField>) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    const updatedFields = form.fields.map(f =>
      f.id === fieldId ? { ...f, ...updates } : f
    );
    updateForm(formId, { fields: updatedFields });
  }, [forms, updateForm]);

  const deleteField = useCallback((formId: string, fieldId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    const updatedFields = form.fields
      .filter(f => f.id !== fieldId)
      .map((f, i) => ({ ...f, order: i }));
    updateForm(formId, { fields: updatedFields });
  }, [forms, updateForm]);

  const moveField = useCallback((formId: string, fieldId: string, direction: 'up' | 'down') => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    const fields = [...form.fields].sort((a, b) => a.order - b.order);
    const idx = fields.findIndex(f => f.id === fieldId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === fields.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [fields[idx].order, fields[swapIdx].order] = [fields[swapIdx].order, fields[idx].order];
    updateForm(formId, { fields });
  }, [forms, updateForm]);

  const duplicateField = useCallback((formId: string, fieldId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    const field = form.fields.find(f => f.id === fieldId);
    if (!field) return;
    const newField: FormField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
      order: form.fields.length,
    };
    updateForm(formId, { fields: [...form.fields, newField] });
  }, [forms, updateForm]);

  return {
    forms,
    activeForm,
    activeFormId,
    setActiveFormId,
    createForm,
    deleteForm,
    updateForm,
    addField,
    updateField,
    deleteField,
    moveField,
    duplicateField,
  };
}
