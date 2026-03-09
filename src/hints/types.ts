// Hint System Types

import { Move } from '../engine/types';

export interface HintResult {
  suggestedMove: Move;
  explanation: string;
  confidence: number; // 0.0 to 1.0
}
