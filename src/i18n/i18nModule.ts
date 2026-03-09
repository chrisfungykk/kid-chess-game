// i18n Module — language management and translation

import { translations } from './translations';

const SUPPORTED_LANGUAGES = ['en', 'zh-TW'];
const DEFAULT_LANGUAGE = 'en';

let currentLanguage: string = DEFAULT_LANGUAGE;

/**
 * Set the active language. Falls back to default if unsupported.
 */
export function setLanguage(lang: string): void {
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    currentLanguage = lang;
  } else {
    currentLanguage = DEFAULT_LANGUAGE;
  }
}

/**
 * Get the currently active language code.
 */
export function getLanguage(): string {
  return currentLanguage;
}

/**
 * Translate a key using the current language.
 * Replaces {paramName} placeholders with values from params.
 * Returns the key itself if no translation is found (fallback).
 */
export function translate(key: string, params?: Record<string, string>): string {
  const langMap = translations[currentLanguage];
  let result = langMap?.[key] ?? key;

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), value);
    }
  }

  return result;
}
