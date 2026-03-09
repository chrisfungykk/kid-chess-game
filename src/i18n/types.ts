// Internationalization Types

export interface Language {
  code: string; // "en" or "zh-TW"
  displayName: string; // "English" or "繁體中文"
}

export interface TranslationMap {
  entries: Map<string, string>;
}
