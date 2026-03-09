import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// We need to re-import fresh module for each test to reset sessionFallback
// Use dynamic imports with vi.resetModules()

describe('persistence', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    vi.resetModules();
    store = {};

    const localStorageMock: Storage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveHighScore / loadHighScore round-trip', () => {
    it('saves and loads a score', async () => {
      const { saveHighScore, loadHighScore } = await import('./persistence');
      saveHighScore(42);
      expect(loadHighScore()).toBe(42);
    });

    it('overwrites a previous score', async () => {
      const { saveHighScore, loadHighScore } = await import('./persistence');
      saveHighScore(10);
      saveHighScore(99);
      expect(loadHighScore()).toBe(99);
    });

    it('saves zero', async () => {
      const { saveHighScore, loadHighScore } = await import('./persistence');
      saveHighScore(0);
      expect(loadHighScore()).toBe(0);
    });
  });

  describe('loadHighScore validation', () => {
    it('returns 0 when nothing is stored', async () => {
      const { loadHighScore } = await import('./persistence');
      expect(loadHighScore()).toBe(0);
    });

    it('returns 0 for non-numeric stored value', async () => {
      store['kids-chess-high-score'] = '"hello"';
      const { loadHighScore } = await import('./persistence');
      expect(loadHighScore()).toBe(0);
    });

    it('returns 0 for negative stored value', async () => {
      store['kids-chess-high-score'] = '-5';
      const { loadHighScore } = await import('./persistence');
      expect(loadHighScore()).toBe(0);
    });

    it('returns 0 for NaN stored value', async () => {
      store['kids-chess-high-score'] = '"NaN"';
      const { loadHighScore } = await import('./persistence');
      expect(loadHighScore()).toBe(0);
    });

    it('returns 0 for Infinity stored value', async () => {
      store['kids-chess-high-score'] = 'Infinity';
      const { loadHighScore } = await import('./persistence');
      expect(loadHighScore()).toBe(0);
    });

    it('returns 0 for malformed JSON', async () => {
      store['kids-chess-high-score'] = '{bad json';
      const { loadHighScore } = await import('./persistence');
      expect(loadHighScore()).toBe(0);
    });
  });

  describe('localStorage unavailability fallback', () => {
    it('falls back to session storage when localStorage throws', async () => {
      // Make localStorage unavailable by having setItem always throw
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: vi.fn(() => { throw new Error('not available'); }),
          setItem: vi.fn(() => { throw new Error('not available'); }),
          removeItem: vi.fn(() => { throw new Error('not available'); }),
          clear: vi.fn(),
          length: 0,
          key: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const { saveHighScore, loadHighScore } = await import('./persistence');

      // Should not throw
      expect(() => saveHighScore(77)).not.toThrow();
      // Should return session fallback
      expect(loadHighScore()).toBe(77);
    });
  });
});
