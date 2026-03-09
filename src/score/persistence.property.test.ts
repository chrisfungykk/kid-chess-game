import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 12: High Score Persistence Round-Trip
 * Saving a high score and reading it back must return the same value.
 *
 * **Validates: Requirements 11.1, 11.2, 4.5, 4.6**
 */
describe('Property 12: High Score Persistence Round-Trip', () => {
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

  it('saving a non-negative integer high score and reading it back returns the same value', async () => {
    const { saveHighScore, loadHighScore } = await import('./persistence');

    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000 }),
        (score) => {
          saveHighScore(score);
          const loaded = loadHighScore();
          expect(loaded).toBe(score);
        }
      ),
      { numRuns: 200 }
    );
  });
});
