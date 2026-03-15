import type { EmailNotificationConfig } from '@/types/formField';

const MAILTRAP_TOKEN_STORAGE_KEY = 'formcraft_mailtrap_api_token';
const DEFAULT_EMAIL_SUBJECT = 'New Form Submission — {{formTitle}}';

function getEnvMailtrapToken(): string {
  return (import.meta.env.VITE_MAILTRAP_API_TOKEN || '').trim();
}

export function getStoredMailtrapToken(): string {
  if (typeof window === 'undefined') {
    return getEnvMailtrapToken();
  }

  try {
    const storedToken = window.localStorage.getItem(MAILTRAP_TOKEN_STORAGE_KEY)?.trim();
    return storedToken || getEnvMailtrapToken();
  } catch {
    return getEnvMailtrapToken();
  }
}

export function persistMailtrapToken(token: string): void {
  if (typeof window === 'undefined') return;

  try {
    const normalizedToken = token.trim();
    if (normalizedToken) {
      window.localStorage.setItem(MAILTRAP_TOKEN_STORAGE_KEY, normalizedToken);
    } else {
      window.localStorage.removeItem(MAILTRAP_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures and keep the in-memory form state usable.
  }
}

export function createDefaultEmailNotificationConfig(): EmailNotificationConfig {
  return {
    enabled: false,
    mailtrapToken: getStoredMailtrapToken(),
    from: '',
    fromName: '',
    to: '',
    cc: '',
    bcc: '',
    subject: DEFAULT_EMAIL_SUBJECT,
  };
}

export function normalizeEmailNotificationConfig(
  config?: Partial<EmailNotificationConfig> | null,
): EmailNotificationConfig {
  const defaults = createDefaultEmailNotificationConfig();

  return {
    ...defaults,
    ...config,
    mailtrapToken: config?.mailtrapToken?.trim() || defaults.mailtrapToken,
    from: config?.from ?? defaults.from,
    fromName: config?.fromName ?? defaults.fromName,
    to: config?.to ?? defaults.to,
    cc: config?.cc ?? defaults.cc,
    bcc: config?.bcc ?? defaults.bcc,
    subject: config?.subject ?? defaults.subject,
  };
}

export function stripDefaultMailtrapToken(config: EmailNotificationConfig): EmailNotificationConfig {
  const normalizedToken = config.mailtrapToken.trim();
  const defaultToken = getStoredMailtrapToken();

  if (!normalizedToken || !defaultToken || normalizedToken !== defaultToken) {
    return {
      ...config,
      mailtrapToken: normalizedToken,
    };
  }

  return {
    ...config,
    mailtrapToken: '',
  };
}