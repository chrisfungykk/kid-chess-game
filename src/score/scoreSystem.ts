import { PieceType } from '../engine/types';
import { ScoreEventType, ScoreState, ScoreEvent } from './types';

/**
 * Maps a PieceType to its capture point value.
 */
export function calculateCapturePoints(pieceType: PieceType): number {
  switch (pieceType) {
    case PieceType.PAWN:
      return 10;
    case PieceType.KNIGHT:
      return 30;
    case PieceType.BISHOP:
      return 30;
    case PieceType.ROOK:
      return 50;
    case PieceType.QUEEN:
      return 90;
    case PieceType.KING:
      return 0;
  }
}

/**
 * Returns a fresh ScoreState with all values zeroed out.
 */
export function createInitialScoreState(): ScoreState {
  return {
    currentScore: 0,
    capturePoints: 0,
    checkmateBonus: 0,
    hintPenalty: 0,
    highScore: 0,
  };
}

/**
 * Immutably updates the score state based on a score event.
 * For PIECE_CAPTURED events, event.value should be a PieceType value.
 */
export function updateScore(scoreState: ScoreState, event: ScoreEvent): ScoreState {
  const updated = { ...scoreState };

  switch (event.type) {
    case ScoreEventType.PIECE_CAPTURED: {
      const points = calculateCapturePoints(event.value as unknown as PieceType);
      updated.capturePoints += points;
      updated.currentScore += points;
      break;
    }
    case ScoreEventType.CHECKMATE_WIN: {
      const bonus = 100;
      updated.checkmateBonus = bonus;
      updated.currentScore = updated.currentScore + bonus;
      break;
    }
    case ScoreEventType.HINT_USED: {
      const penalty = 5;
      updated.hintPenalty = updated.hintPenalty + penalty;
      updated.currentScore = Math.max(0, updated.currentScore - penalty);
      break;
    }
    case ScoreEventType.GAME_COMPLETED: {
      if (updated.currentScore > updated.highScore) {
        updated.highScore = updated.currentScore;
      }
      break;
    }
  }

  return updated;
}

/**
 * Resets the score state, preserving the high score.
 */
export function resetScore(scoreState: ScoreState): ScoreState {
  return {
    currentScore: 0,
    capturePoints: 0,
    checkmateBonus: 0,
    hintPenalty: 0,
    highScore: scoreState.highScore,
  };
}
