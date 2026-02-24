import { useState, useCallback } from 'react';
import { FormConfig, FormField, FormTheme, createDefaultField, FieldType } from '@/types/formField';

const defaultTheme: FormTheme = {
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  fontFamily: "'Inter', sans-serif",
  borderRadius: '12px',
  showLogo: false,
};

function createDefaultForm(): FormConfig {
  return {
    id: `form_${Date.now()}`,
    title: 'Untitled Form',
    description: '',
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    fields: [],
    theme: defaultTheme,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useFormBuilder() {
  const [forms, setForms] = useState<FormConfig[]>(() => {
    const saved = localStorage.getItem('formcraft_forms');
    return saved ? JSON.parse(saved) : [];
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
