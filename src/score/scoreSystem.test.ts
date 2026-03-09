import { describe, it, expect } from 'vitest';
import { PieceType } from '../engine/types';
import { ScoreEventType, ScoreState } from './types';
import {
  calculateCapturePoints,
  createInitialScoreState,
  updateScore,
  resetScore,
} from './scoreSystem';

describe('calculateCapturePoints', () => {
  it('returns 10 for Pawn', () => {
    expect(calculateCapturePoints(PieceType.PAWN)).toBe(10);
  });

  it('returns 30 for Knight', () => {
    expect(calculateCapturePoints(PieceType.KNIGHT)).toBe(30);
  });

  it('returns 30 for Bishop', () => {
    expect(calculateCapturePoints(PieceType.BISHOP)).toBe(30);
  });

  it('returns 50 for Rook', () => {
    expect(calculateCapturePoints(PieceType.ROOK)).toBe(50);
  });

  it('returns 90 for Queen', () => {
    expect(calculateCapturePoints(PieceType.QUEEN)).toBe(90);
  });

  it('returns 0 for King', () => {
    expect(calculateCapturePoints(PieceType.KING)).toBe(0);
  });
});

describe('createInitialScoreState', () => {
  it('returns a zeroed-out score state', () => {
    expect(createInitialScoreState()).toEqual({
      currentScore: 0,
      capturePoints: 0,
      checkmateBonus: 0,
      hintPenalty: 0,
      highScore: 0,
    });
  });
});

describe('updateScore', () => {
  const initial = createInitialScoreState();

  describe('PIECE_CAPTURED', () => {
    it('adds pawn capture points', () => {
      const result = updateScore(initial, {
        type: ScoreEventType.PIECE_CAPTURED,
        value: PieceType.PAWN as unknown as number,
      });
      expect(result.currentScore).toBe(10);
      expect(result.capturePoints).toBe(10);
    });

    it('adds queen capture points', () => {
      const result = updateScore(initial, {
        type: ScoreEventType.PIECE_CAPTURED,
        value: PieceType.QUEEN as unknown as number,
      });
      expect(result.currentScore).toBe(90);
      expect(result.capturePoints).toBe(90);
    });

    it('accumulates multiple captures', () => {
      let state = initial;
      state = updateScore(state, {
        type: ScoreEventType.PIECE_CAPTURED,
        value: PieceType.PAWN as unknown as number,
      });
      state = updateScore(state, {
        type: ScoreEventType.PIECE_CAPTURED,
        value: PieceType.KNIGHT as unknown as number,
      });
      expect(state.currentScore).toBe(40);
      expect(state.capturePoints).toBe(40);
    });
  });

  describe('CHECKMATE_WIN', () => {
    it('adds 100 bonus points', () => {
      const result = updateScore(initial, {
        type: ScoreEventType.CHECKMATE_WIN,
        value: 0,
      });
      expect(result.currentScore).toBe(100);
      expect(result.checkmateBonus).toBe(100);
    });

    it('adds bonus on top of existing score', () => {
      const withCapture = updateScore(initial, {
        type: ScoreEventType.PIECE_CAPTURED,
        value: PieceType.ROOK as unknown as number,
      });
      const result = updateScore(withCapture, {
        type: ScoreEventType.CHECKMATE_WIN,
        value: 0,
      });
      expect(result.currentScore).toBe(150);
    });
  });

  describe('HINT_USED', () => {
    it('deducts 5 points', () => {
      const withScore: ScoreState = { ...initial, currentScore: 30 };
      const result = updateScore(withScore, {
        type: ScoreEventType.HINT_USED,
        value: 0,
      });
      expect(result.currentScore).toBe(25);
      expect(result.hintPenalty).toBe(5);
    });

    it('floors score at zero', () => {
      const withScore: ScoreState = { ...initial, currentScore: 3 };
      const result = updateScore(withScore, {
        type: ScoreEventType.HINT_USED,
        value: 0,
      });
      expect(result.currentScore).toBe(0);
      expect(result.hintPenalty).toBe(5);
    });

    it('stays at zero when already zero', () => {
      const result = updateScore(initial, {
        type: ScoreEventType.HINT_USED,
        value: 0,
      });
      expect(result.currentScore).toBe(0);
      expect(result.hintPenalty).toBe(5);
    });

    it('accumulates hint penalties', () => {
      let state: ScoreState = { ...initial, currentScore: 100 };
      state = updateScore(state, { type: ScoreEventType.HINT_USED, value: 0 });
      state = updateScore(state, { type: ScoreEventType.HINT_USED, value: 0 });
      state = updateScore(state, { type: ScoreEventType.HINT_USED, value: 0 });
      expect(state.currentScore).toBe(85);
      expect(state.hintPenalty).toBe(15);
    });
  });

  describe('GAME_COMPLETED', () => {
    it('updates high score when current exceeds it', () => {
      const state: ScoreState = { ...initial, currentScore: 150, highScore: 100 };
      const result = updateScore(state, {
        type: ScoreEventType.GAME_COMPLETED,
        value: 0,
      });
      expect(result.highScore).toBe(150);
    });

    it('does not update high score when current is lower', () => {
      const state: ScoreState = { ...initial, currentScore: 50, highScore: 100 };
      const result = updateScore(state, {
        type: ScoreEventType.GAME_COMPLETED,
        value: 0,
      });
      expect(result.highScore).toBe(100);
    });

    it('does not update high score when equal', () => {
      const state: ScoreState = { ...initial, currentScore: 100, highScore: 100 };
      const result = updateScore(state, {
        type: ScoreEventType.GAME_COMPLETED,
        value: 0,
      });
      expect(result.highScore).toBe(100);
    });
  });

  it('does not mutate the original state', () => {
    const original = createInitialScoreState();
    const copy = { ...original };
    updateScore(original, {
      type: ScoreEventType.PIECE_CAPTURED,
      value: PieceType.QUEEN as unknown as number,
    });
    expect(original).toEqual(copy);
  });
});

describe('resetScore', () => {
  it('resets all values to zero but preserves highScore', () => {
    const state: ScoreState = {
      currentScore: 250,
      capturePoints: 150,
      checkmateBonus: 100,
      hintPenalty: 10,
      highScore: 300,
    };
    const result = resetScore(state);
    expect(result).toEqual({
      currentScore: 0,
      capturePoints: 0,
      checkmateBonus: 0,
      hintPenalty: 0,
      highScore: 300,
    });
  });

  it('preserves zero highScore', () => {
    const result = resetScore(createInitialScoreState());
    expect(result.highScore).toBe(0);
    expect(result.currentScore).toBe(0);
  });
});
