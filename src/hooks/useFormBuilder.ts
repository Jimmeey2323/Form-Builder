import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FormConfig,
  FormField,
  FormTheme,
  WebhookConfig,
  PixelConfig,
  GoogleSheetsConfig,
  createDefaultField,
  FieldType,
} from '@/types/formField';
import { createDefaultEmailNotificationConfig, normalizeEmailNotificationConfig, stripDefaultMailtrapToken } from '@/lib/mailtrap';

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
  formMinHeight: '620px',
  formPadding: '32px',
  formBorderWidth: '1px',
  formBorderColor: '#e2e8f0',
  logoMaxWidth: '72px',
  logoTopPadding: '16px',
  logoSidePadding: '32px',
  headerFontSize: '22px',
  headerFontWeight: '700',
  headerFontStyle: 'normal' as const,
  inputPadding: '14px 16px',
  labelFontSize: '14px',
  inputFontSize: '15px',
  formShadow: 'xl',
  formLayout: 'custom' as const,
  fieldGap: '16px',
  lineHeight: '1.6',
  submitButtonBackground: '',
  navButtonBackground: '#ffffff',
  navButtonTextColor: '#1e293b',
  navButtonBorderColor: '#e2e8f0',
  nextButtonHoverTextColor: '',
  backButtonHoverTextColor: '',
  buttonRadius: '8px',
  buttonPaddingY: '12px',
  buttonPaddingX: '14px',
  formCardGlassOpacity: '0.82',
  formCardGlassBorderOpacity: '0.22',
  formCardGlassSaturation: '180%',
  formCardGlassShadow: '0 20px 48px rgba(15, 23, 42, 0.18)',
  customCss: '',
};

const defaultWebhook: WebhookConfig = {
  enabled: true,
  url: 'https://api.momence.com/integrations/customer-leads/33905/collect',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer qy71rOk8en',
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

function getDefaultFields(): FormField[] {
  return [
    {
      id: 'firstName',
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'John',
      isRequired: true,
      isHidden: false,
      isReadOnly: false,
      isDisabled: false,
      width: '100',
      order: 0,
      autocomplete: 'given-name',
    },
    {
      id: 'lastName',
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Doe',
      isRequired: true,
      isHidden: false,
      isReadOnly: false,
      isDisabled: false,
      width: '100',
      order: 1,
      autocomplete: 'family-name',
    },
    {
      id: 'email',
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'john.doe@example.com',
      isRequired: true,
      isHidden: false,
      isReadOnly: false,
      isDisabled: false,
      width: '100',
      order: 2,
      autocomplete: 'email',
    },
    {
      id: 'phoneNumber',
      name: 'phoneNumber',
      label: 'Phone Number',
      type: 'tel',
      placeholder: 'XXXXXXXXXX',
      isRequired: true,
      isHidden: false,
      isReadOnly: false,
      isDisabled: false,
      width: '100',
      order: 3,
      autocomplete: 'tel',
    },
    {
      id: 'zipCode',
      name: 'zipCode',
      label: 'Pincode',
      type: 'text',
      placeholder: '56XXXX',
      isRequired: true,
      isHidden: false,
      isReadOnly: false,
      isDisabled: false,
      width: '100',
      order: 4,
      autocomplete: 'postal-code',
    },
    {
      id: 'center',
      name: 'center',
      label: 'Select a Studio Location',
      type: 'select',
      isRequired: true,
      isHidden: false,
      isReadOnly: false,
      isDisabled: false,
      width: '100',
      order: 5,
      placeholder: 'Select Preferred Studio Location',
      options: [
        {
          label: 'Kenkere House, Vittal Mallya Road',
          value: 'Kenkere House, Vittal Mallya Road',
          address:
            '1st Floor, Kenkere House, Vittal Mallya Rd, above Raymonds, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001',
        },
        {
          label: 'the Studio by Copper + Cloves, Indiranagar',
          value: 'the Studio by Copper + Cloves, Indiranagar',
          address:
            '167, Ground Floor Back Portion, 2nd Stage, Shankarnag Rd, Domlur, Bengaluru 560071',
        },
      ],
    },
  ];
}

function createDefaultForm(): FormConfig {
  return {
    id: `form_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: 'Book a Trial',
    subHeader: '',
    description: '',
    venue: '',
    dateTimeStamp: '',
    footer: '',
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    fields: getDefaultFields(),
    theme: defaultTheme,
    webhookConfig: { ...defaultWebhook },
    pixelConfig: { ...defaultPixels },
    googleSheetsConfig: { ...defaultGoogleSheets },
    emailNotificationConfig: createDefaultEmailNotificationConfig(),
    isLocked: false,
    isTemplate: false,
    isPublished: false,
    publicationState: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function inferPublicationState(form: Partial<FormConfig>): 'draft' | 'published' {
  if (form.publicationState === 'published' || form.publicationState === 'draft') {
    return form.publicationState;
  }
  if (form.isPublished || !!form.deployedUrl) return 'published';
  return 'draft';
}

export function useFormBuilder() {
  const [forms, setForms] = useState<FormConfig[]>(() => {
    const saved = localStorage.getItem('formcraft_forms');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((f: any) => {
      const publicationState = inferPublicationState(f);
      return {
        ...f,
        publicationState,
        isPublished: f.isPublished ?? publicationState === 'published',
        theme: { ...defaultTheme, ...(f.theme || {}) },
        webhookConfig:
          f.webhookConfig || {
            enabled: false,
            url: '',
            method: 'POST',
            headers: {},
            includeUtmParams: true,
          },
        pixelConfig: f.pixelConfig || {},
        googleSheetsConfig: f.googleSheetsConfig || { enabled: false },
        emailNotificationConfig: normalizeEmailNotificationConfig(f.emailNotificationConfig),
      };
    });
  });

  // Avoid stale closures when creating/updating multiple forms within the same tick.
  const formsRef = useRef<FormConfig[]>(forms);
  useEffect(() => {
    formsRef.current = forms;
  }, [forms]);

  // Keep empty by default so opening /builder does not auto-open a form.
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const response = await fetch(`${supabaseUrl}/functions/v1/forms-api`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${publishableKey}`,
            apikey: publishableKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (!data || data.length === 0) return;

        const loaded: FormConfig[] = data.map((row: any) => {
          const config = row.config as FormConfig;
          const publicationState = inferPublicationState(config);
          return {
            ...config,
            id: row.id,
            publicationState,
            isPublished: config.isPublished ?? publicationState === 'published',
            emailNotificationConfig: normalizeEmailNotificationConfig(config.emailNotificationConfig),
          };
        });

        setForms(loaded);
        formsRef.current = loaded;
        localStorage.setItem('formcraft_forms', JSON.stringify(loaded));
      } catch {
        // local storage remains fallback
      }
    };

    loadFromSupabase();
  }, []);

  const save = useCallback((updatedForms: FormConfig[]) => {
    const persistedForms = updatedForms.map(form => ({
      ...form,
      emailNotificationConfig: stripDefaultMailtrapToken(
        normalizeEmailNotificationConfig(form.emailNotificationConfig),
      ),
    }));

    formsRef.current = updatedForms;
    setForms(updatedForms);
    localStorage.setItem('formcraft_forms', JSON.stringify(persistedForms));

    const upsertToSupabase = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const formsData = persistedForms.map(f => ({
          id: f.id,
          title: f.title,
          config: f as any,
        }));

        await fetch(`${supabaseUrl}/functions/v1/forms-api`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publishableKey}`,
            apikey: publishableKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ forms: formsData }),
        });
      } catch {
        // local storage remains fallback
      }
    };

    upsertToSupabase();
  }, []);

  const activeForm = forms.find(f => f.id === activeFormId) ?? null;

  const createForm = useCallback(() => {
    const newForm = createDefaultForm();
    const updated = [...formsRef.current, newForm];
    save(updated);
    setActiveFormId(newForm.id);
    return newForm;
  }, [save]);

  const deleteForm = useCallback(
    (formId: string) => {
      const updated = formsRef.current.filter(f => f.id !== formId);
      save(updated);

      if (activeFormId === formId) {
        setActiveFormId(null);
      }

      const deleteFromSupabase = async () => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          await fetch(`${supabaseUrl}/functions/v1/forms-api?id=${encodeURIComponent(formId)}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${publishableKey}`,
              apikey: publishableKey,
              'Content-Type': 'application/json',
            },
          });
        } catch {
          // form already removed locally
        }
      };

      deleteFromSupabase();
    },
    [activeFormId, save],
  );

  const updateForm = useCallback(
    (formId: string, updates: Partial<FormConfig>, opts?: { force?: boolean }) => {
      const current = formsRef.current;
      const target = current.find(f => f.id === formId);
      if (!target) return false;

      const allowedWhileLocked = new Set(['isLocked', 'isPublished', 'deployedUrl', 'publicationState', 'updatedAt']);
      // Never allow id changes; ids are used as stable keys throughout the app.
      const { id: _ignoredId, ...safeUpdates } = updates as Partial<FormConfig> & { id?: never };
      const updateKeys = Object.keys(safeUpdates);
      const lockBypass = opts?.force || updateKeys.every(k => allowedWhileLocked.has(k));
      if (target.isLocked && !lockBypass) return false;

      const updated = current.map(f =>
        f.id === formId ? { ...f, ...safeUpdates, updatedAt: new Date().toISOString() } : f,
      );
      save(updated);
      return true;
    },
    [save],
  );

  const addField = useCallback(
    (formId: string, fieldType: FieldType, overrides?: Partial<FormField>) => {
      const form = formsRef.current.find(f => f.id === formId);
      if (!form || form.isLocked) return null;
      const newField = { ...createDefaultField(fieldType, form.fields.length), ...overrides };
      updateForm(formId, { fields: [...form.fields, newField] });
      return newField;
    },
    [updateForm],
  );

  const updateField = useCallback(
    (formId: string, fieldId: string, updates: Partial<FormField>) => {
      const form = formsRef.current.find(f => f.id === formId);
      if (!form || form.isLocked) return false;
      const updatedFields = form.fields.map(f => (f.id === fieldId ? { ...f, ...updates } : f));
      return updateForm(formId, { fields: updatedFields });
    },
    [updateForm],
  );

  const deleteField = useCallback(
    (formId: string, fieldId: string) => {
      const form = formsRef.current.find(f => f.id === formId);
      if (!form || form.isLocked) return false;
      const updatedFields = form.fields.filter(f => f.id !== fieldId).map((f, i) => ({ ...f, order: i }));
      return updateForm(formId, { fields: updatedFields });
    },
    [updateForm],
  );

  const moveField = useCallback(
    (formId: string, fieldId: string, direction: 'up' | 'down') => {
      const form = formsRef.current.find(f => f.id === formId);
      if (!form || form.isLocked) return false;
      const fields = [...form.fields].sort((a, b) => a.order - b.order);
      const idx = fields.findIndex(f => f.id === fieldId);
      if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === fields.length - 1)) return false;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [fields[idx].order, fields[swapIdx].order] = [fields[swapIdx].order, fields[idx].order];
      return updateForm(formId, { fields });
    },
    [updateForm],
  );

  const reorderFields = useCallback(
    (formId: string, orderedIds: string[]) => {
      const form = formsRef.current.find(f => f.id === formId);
      if (!form || form.isLocked) return false;
      const fieldMap = new Map(form.fields.map(f => [f.id, f]));
      const reordered = orderedIds
        .filter(id => fieldMap.has(id))
        .map((id, index) => ({ ...fieldMap.get(id)!, order: index }));
      return updateForm(formId, { fields: reordered });
    },
    [updateForm],
  );

  const duplicateField = useCallback(
    (formId: string, fieldId: string) => {
      const form = formsRef.current.find(f => f.id === formId);
      if (!form || form.isLocked) return null;
      const field = form.fields.find(f => f.id === fieldId);
      if (!field) return null;
      const newField: FormField = {
        ...field,
        id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: `${field.name}_copy`,
        label: `${field.label} (Copy)`,
        order: form.fields.length,
      };
      updateForm(formId, { fields: [...form.fields, newField] });
      return newField;
    },
    [updateForm],
  );

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
    reorderFields,
    duplicateField,
  };
}
