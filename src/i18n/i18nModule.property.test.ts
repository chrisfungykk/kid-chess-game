import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { setLanguage, getLanguage, translate } from './i18nModule';
import { translations, getAllTranslationKeys } from './translations';

/**
 * Property 8: Translation Completeness and Fallback
 *
 * All UI keys must have non-empty translations in both "en" and "zh-TW";
 * missing keys return the key itself.
 *
 * **Validates: Requirements 8.3, 8.4**
 */
describe('Property 8: Translation Completeness and Fallback', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('every known translation key has a non-empty string in both "en" and "zh-TW"', () => {
    const allKeys = getAllTranslationKeys();

    fc.assert(
      fc.property(
        fc.constantFrom(...allKeys),
        (key) => {
          const enValue = translations['en'][key];
          const zhValue = translations['zh-TW'][key];

          // Both languages must have the key with a non-empty string
          expect(typeof enValue).toBe('string');
          expect(enValue.length).toBeGreaterThan(0);
          expect(typeof zhValue).toBe('string');
          expect(zhValue.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('translate returns the key itself for any unknown/random key', () => {
    const knownKeys = new Set(getAllTranslationKeys());

    // Generate dotted-notation keys like "abc.xyz" to match real key format
    // and avoid collisions with Object.prototype properties (e.g. "valueOf")
    const keyPartArb = fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/);
    const randomKeyArb = fc
      .tuple(keyPartArb, keyPartArb)
      .map(([a, b]) => `${a}.${b}`);

    fc.assert(
      fc.property(
        randomKeyArb,
        fc.constantFrom('en', 'zh-TW'),
        (randomKey, lang) => {
          // Skip if the random string happens to be a known key
          if (knownKeys.has(randomKey)) return;

          setLanguage(lang);
          const result = translate(randomKey);
          expect(result).toBe(randomKey);
        },
      ),
      { numRuns: 200 },
    );
  });
});


/**
 * Property 13: Language Switch Reactivity
 *
 * After switching language, all translate calls return strings in the new language.
 *
 * **Validates: Requirements 8.2, 8.5**
 */
describe('Property 13: Language Switch Reactivity', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('after switching language, all known keys return values from the correct language map', () => {
    const allKeys = getAllTranslationKeys();

    fc.assert(
      fc.property(
        fc.constantFrom('en', 'zh-TW'),
        (targetLang) => {
          setLanguage(targetLang);
          expect(getLanguage()).toBe(targetLang);

          for (const key of allKeys) {
            const result = translate(key);
            const expected = translations[targetLang][key];
            expect(result).toBe(expected);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('randomly switching between languages always yields correct translations', () => {
    const allKeys = getAllTranslationKeys();

    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('en', 'zh-TW'), { minLength: 1, maxLength: 10 }),
        fc.constantFrom(...allKeys),
        (langSequence, key) => {
          for (const lang of langSequence) {
            setLanguage(lang);
            expect(getLanguage()).toBe(lang);

            const result = translate(key);
            const expected = translations[lang][key];
            expect(result).toBe(expected);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
