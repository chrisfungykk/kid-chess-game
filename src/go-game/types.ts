import type { GoBoard, StoneColor, GoScoreResult } from '../go-engine/types';
import type { GoHintResult } from '../go-hints/types';

export type GoGameStatus = 'idle' | 'playing' | 'finished';

export type GoDifficulty = 'easy' | 'medium';

export type GoGameMode = 'vs_ai' | 'vs_player';

export interface GoGameState {
  board: GoBoard;
  status: GoGameStatus;
  difficulty: GoDifficulty;
  mode: GoGameMode;
  /** Current game score for the human player */
  score: number;
  highScore: number;
  hintsUsed: number;
  lastHint: GoHintResult | null;
  /** Set when game ends by scoring */
  scoreResult: GoScoreResult | null;
  winner: StoneColor | 'tie' | null;
}

export interface GoMoveResult {
  success: boolean;
  gameState: GoGameState;
  /** Count of captured stones */
  captured: number;
  error?: string;
}
