import { useState, useCallback } from 'react';
import { Template } from '@/data/templates';

const STORAGE_KEY = 'formcraft_user_templates';

function loadFromStorage(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Template[]) : [];
  } catch {
    return [];
  }
}

function persistToStorage(templates: Template[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Ignore storage quota errors
  }
}

export function useTemplates() {
  const [userTemplates, setUserTemplates] = useState<Template[]>(loadFromStorage);

  /** Replace the entire user-template list */
  const saveTemplates = useCallback((templates: Template[]) => {
    setUserTemplates(templates);
    persistToStorage(templates);
  }, []);

  /**
   * Upsert new templates into the saved list.
   * Templates with the same `id` are overwritten; new ones are appended.
   */
  const addTemplates = useCallback((incoming: Template[]) => {
    setUserTemplates(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      for (const t of incoming) {
        map.set(t.id, { ...t, isUserCreated: true });
      }
      const merged = Array.from(map.values());
      persistToStorage(merged);
      return merged;
    });
  }, []);

  /** Remove a single template by id */
  const deleteTemplate = useCallback((id: string) => {
    setUserTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      persistToStorage(updated);
      return updated;
    });
  }, []);

  return { userTemplates, addTemplates, deleteTemplate, saveTemplates };
}
