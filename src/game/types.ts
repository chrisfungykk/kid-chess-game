// Game Management Types

import { Board, Color } from '../engine/types';
import { ScoreState } from '../score/types';

export enum GameStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  CHECK = 'CHECK',
  CHECKMATE = 'CHECKMATE',
  STALEMATE = 'STALEMATE',
  DRAW = 'DRAW',
  RESIGNED = 'RESIGNED',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
}

export interface GameState {
  board: Board;
  status: GameStatus;
  playerColor: Color;
  difficulty: Difficulty;
  score: ScoreState;
  hintsUsed: number;
}
