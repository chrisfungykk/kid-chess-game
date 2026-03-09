import { describe, it, expect, beforeEach } from 'vitest';
import { setLanguage, getLanguage, translate } from './i18nModule';
import { translations, getAllTranslationKeys } from './translations';

describe('i18nModule', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  describe('setLanguage / getLanguage', () => {
    it('defaults to "en"', () => {
      expect(getLanguage()).toBe('en');
    });

    it('switches to zh-TW', () => {
      setLanguage('zh-TW');
      expect(getLanguage()).toBe('zh-TW');
    });

    it('switches back to en', () => {
      setLanguage('zh-TW');
      setLanguage('en');
      expect(getLanguage()).toBe('en');
    });

    it('falls back to en for unsupported language', () => {
      setLanguage('fr');
      expect(getLanguage()).toBe('en');
    });
  });

  describe('translate — English', () => {
    it('returns English translation for known key', () => {
      expect(translate('game.welcome')).toBe('Welcome to Chess!');
    });

    it('returns piece names in English', () => {
      expect(translate('piece.king')).toBe('King');
      expect(translate('piece.queen')).toBe('Queen');
    });
  });

  describe('translate — Traditional Chinese', () => {
    beforeEach(() => {
      setLanguage('zh-TW');
    });

    it('returns Chinese translation for known key', () => {
      expect(translate('game.welcome')).toBe('歡迎來到西洋棋！');
    });

    it('returns piece names in Chinese', () => {
      expect(translate('piece.king')).toBe('國王');
      expect(translate('piece.queen')).toBe('皇后');
    });
  });

  describe('translate — fallback', () => {
    it('returns the key itself when translation is missing', () => {
      expect(translate('nonexistent.key')).toBe('nonexistent.key');
    });

    it('returns the key for missing key in zh-TW', () => {
      setLanguage('zh-TW');
      expect(translate('totally.unknown')).toBe('totally.unknown');
    });
  });

  describe('translate — param substitution', () => {
    it('replaces a single placeholder', () => {
      expect(translate('score.current', { score: '42' })).toBe('Score: 42');
    });

    it('replaces multiple placeholders', () => {
      expect(translate('score.points', { points: '100' })).toBe('100 points');
    });

    it('replaces placeholders in zh-TW', () => {
      setLanguage('zh-TW');
      expect(translate('score.current', { score: '42' })).toBe('分數：42');
    });

    it('leaves string unchanged when params do not match placeholders', () => {
      expect(translate('game.welcome', { unused: 'val' })).toBe('Welcome to Chess!');
    });

    it('returns key with no substitution when key is missing', () => {
      expect(translate('missing.key', { foo: 'bar' })).toBe('missing.key');
    });
  });

  describe('translations completeness', () => {
    it('both languages have the same set of keys', () => {
      const enKeys = Object.keys(translations['en']).sort();
      const zhKeys = Object.keys(translations['zh-TW']).sort();
      expect(enKeys).toEqual(zhKeys);
    });

    it('all values are non-empty strings', () => {
      for (const key of getAllTranslationKeys()) {
        expect(translations['en'][key].length).toBeGreaterThan(0);
        expect(translations['zh-TW'][key].length).toBeGreaterThan(0);
      }
    });
  });
});
