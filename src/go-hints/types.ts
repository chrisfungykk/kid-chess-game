import type { GoPosition } from '../go-engine/types';

export type GoHintCategory = 'capture' | 'defend' | 'territory' | 'general';

export interface GoHintResult {
  position: GoPosition;
  category: GoHintCategory;
  /** Kid-friendly explanation of the hint */
  message: string;
}
