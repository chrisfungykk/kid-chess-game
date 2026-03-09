const STORAGE_KEY = 'kids-chess-high-score';

let sessionFallback: number | null = null;

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves the high score to localStorage.
 * Falls back to session-only storage if localStorage is unavailable.
 */
export function saveHighScore(score: number): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(score));
    } catch {
      sessionFallback = score;
    }
  } else {
    sessionFallback = score;
  }
}

/**
 * Loads the high score from localStorage.
 * Returns 0 if the stored value is invalid, missing, or localStorage is unavailable.
 */
export function loadHighScore(): number {
  if (isLocalStorageAvailable()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return 0;
      }
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
      return 0;
    } catch {
      return 0;
    }
  }
  return sessionFallback ?? 0;
}

const GO_STORAGE_KEY = 'kids-go-high-score';

let goSessionFallback: number | null = null;

/**
 * Saves the Go high score to localStorage.
 * Falls back to session-only storage if localStorage is unavailable.
 */
export function saveGoHighScore(score: number): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(GO_STORAGE_KEY, JSON.stringify(score));
    } catch {
      goSessionFallback = score;
    }
  } else {
    goSessionFallback = score;
  }
}

/**
 * Loads the Go high score from localStorage.
 * Returns 0 if the stored value is invalid, missing, or localStorage is unavailable.
 */
export function loadGoHighScore(): number {
  if (isLocalStorageAvailable()) {
    try {
      const raw = localStorage.getItem(GO_STORAGE_KEY);
      if (raw === null) {
        return 0;
      }
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
      return 0;
    } catch {
      return 0;
    }
  }
  return goSessionFallback ?? 0;
}
