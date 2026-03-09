// Score System Types

export enum ScoreEventType {
  PIECE_CAPTURED = 'PIECE_CAPTURED',
  CHECKMATE_WIN = 'CHECKMATE_WIN',
  HINT_USED = 'HINT_USED',
  GAME_COMPLETED = 'GAME_COMPLETED',
}

export interface ScoreEvent {
  type: ScoreEventType;
  value: number;
}

export interface ScoreState {
  currentScore: number;
  capturePoints: number;
  checkmateBonus: number;
  hintPenalty: number;
  highScore: number;
}
