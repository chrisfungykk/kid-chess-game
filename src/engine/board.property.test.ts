import { describe, it } from 'vitest';
import fc from 'fast-check';
import { initializeBoard } from './board';
import { PieceType, Color } from './types';

/**
 * Property 6: Board Consistency (King Count Invariant)
 *
 * After initialization, the board must contain exactly 1 WHITE king and 1 BLACK king.
 *
 * **Validates: Requirements 9.3**
 */
describe('Property 6: Board Consistency (King Count Invariant)', () => {
  it('initializeBoard always produces exactly 1 white king and 1 black king', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const board = initializeBoard();

        let whiteKings = 0;
        let blackKings = 0;

        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = board.squares[row][col];
            if (piece !== null && piece.type === PieceType.KING) {
              if (piece.color === Color.WHITE) {
                whiteKings++;
              } else {
                blackKings++;
              }
            }
          }
        }

        return whiteKings === 1 && blackKings === 1;
      }),
      { numRuns: 100 }
    );
  });
});
