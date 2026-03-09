import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { updateScore, createInitialScoreState, calculateCapturePoints } from './scoreSystem';
import { ScoreEventType, ScoreEvent } from './types';
import { PieceType } from '../engine/types';

/**
 * Property 4: Score Non-Negativity
 *
 * For any sequence of score events, currentScore must always be >= 0.
 *
 * **Validates: Requirements 4.4**
 */

const capturablePieceTypes = [
  PieceType.PAWN,
  PieceType.KNIGHT,
  PieceType.BISHOP,
  PieceType.ROOK,
  PieceType.QUEEN,
  PieceType.KING,
];

/** Arbitrary that generates a random ScoreEvent */
const scoreEventArb = fc.oneof(
  fc.constantFrom(...capturablePieceTypes).map((pieceType) => ({
    type: ScoreEventType.PIECE_CAPTURED,
    value: pieceType as unknown as number,
  })),
  fc.constant({ type: ScoreEventType.CHECKMATE_WIN, value: 0 }),
  fc.constant({ type: ScoreEventType.HINT_USED, value: 0 }),
  fc.constant({ type: ScoreEventType.GAME_COMPLETED, value: 0 })
);

describe('Property 4: Score Non-Negativity', () => {
  it('currentScore is always >= 0 after applying any sequence of score events', () => {
    fc.assert(
      fc.property(fc.array(scoreEventArb, { minLength: 1, maxLength: 50 }), (events) => {
        let state = createInitialScoreState();

        for (const event of events) {
          state = updateScore(state, event);
          expect(state.currentScore).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 200 }
    );
  });
});

/**
 * Property 5: Capture Score Correctness
 *
 * Each captured piece type must award exactly the defined point value:
 * Pawn=10, Knight=30, Bishop=30, Rook=50, Queen=90.
 *
 * **Validates: Requirements 4.1**
 */

const expectedCapturePoints: Record<string, number> = {
  [PieceType.PAWN]: 10,
  [PieceType.KNIGHT]: 30,
  [PieceType.BISHOP]: 30,
  [PieceType.ROOK]: 50,
  [PieceType.QUEEN]: 90,
};

const capturablePieceTypesForProperty5 = [
  PieceType.PAWN,
  PieceType.KNIGHT,
  PieceType.BISHOP,
  PieceType.ROOK,
  PieceType.QUEEN,
];

describe('Property 5: Capture Score Correctness', () => {
  it('calculateCapturePoints returns exactly the defined point value for any piece type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...capturablePieceTypesForProperty5),
        (pieceType) => {
          const points = calculateCapturePoints(pieceType);
          expect(points).toBe(expectedCapturePoints[pieceType]);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('a PIECE_CAPTURED event on a fresh score state yields currentScore equal to the capture points', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...capturablePieceTypesForProperty5),
        (pieceType) => {
          const freshState = createInitialScoreState();
          const event: ScoreEvent = {
            type: ScoreEventType.PIECE_CAPTURED,
            value: pieceType as unknown as number,
          };
          const updatedState = updateScore(freshState, event);
          const expected = expectedCapturePoints[pieceType];

          expect(updatedState.currentScore).toBe(expected);
          expect(updatedState.capturePoints).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });
});
