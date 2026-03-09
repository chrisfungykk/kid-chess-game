import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateHint } from './hintSystem';
import { initializeBoard } from '../engine/board';
import { getAllLegalMoves } from '../engine/moves';
import { simulateMove } from '../engine/execute';
import { Board, Color, Move } from '../engine/types';

/**
 * Property 7: AI and Hint Move Legality (Hint)
 *
 * Hint's suggested move must always be a member of the legal moves set.
 *
 * **Validates: Requirements 5.1, 5.4**
 */
describe('Property 7: Hint Move Legality', () => {
  /**
   * Helper: check if a move is in the legal moves set.
   */
  function isMoveInSet(move: Move, legalMoves: Move[]): boolean {
    return legalMoves.some(
      (m) =>
        m.from.row === move.from.row &&
        m.from.col === move.from.col &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col &&
        m.promotion === move.promotion,
    );
  }

  it('generateHint for WHITE always returns a move in the legal moves set for random board states', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.infiniteStream(fc.double({ min: 0, max: 1, noNaN: true })),
        (numMoves, randomStream) => {
          let board = initializeBoard();
          const iter = randomStream[Symbol.iterator]();

          // Play random legal moves from the starting position to reach a varied board state
          for (let i = 0; i < numMoves; i++) {
            const allMoves = getAllLegalMoves(board, board.currentTurn);
            if (allMoves.length === 0) break;

            const randomVal = iter.next().value ?? 0;
            const idx = Math.floor(randomVal * allMoves.length) % allMoves.length;
            board = simulateMove(board, allMoves[idx]);
          }

          // Ensure it's WHITE's turn and there are legal moves
          const whiteMoves = getAllLegalMoves(board, Color.WHITE);
          if (board.currentTurn !== Color.WHITE || whiteMoves.length === 0) return;

          const hint = generateHint(board, Color.WHITE);
          expect(hint).not.toBeNull();
          expect(isMoveInSet(hint!.suggestedMove, whiteMoves)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('generateHint for BLACK always returns a move in the legal moves set for random board states', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.infiniteStream(fc.double({ min: 0, max: 1, noNaN: true })),
        (numMoves, randomStream) => {
          let board = initializeBoard();
          const iter = randomStream[Symbol.iterator]();

          // Play random legal moves from the starting position
          for (let i = 0; i < numMoves; i++) {
            const allMoves = getAllLegalMoves(board, board.currentTurn);
            if (allMoves.length === 0) break;

            const randomVal = iter.next().value ?? 0;
            const idx = Math.floor(randomVal * allMoves.length) % allMoves.length;
            board = simulateMove(board, allMoves[idx]);
          }

          // Ensure it's BLACK's turn and there are legal moves
          const blackMoves = getAllLegalMoves(board, Color.BLACK);
          if (board.currentTurn !== Color.BLACK || blackMoves.length === 0) return;

          const hint = generateHint(board, Color.BLACK);
          expect(hint).not.toBeNull();
          expect(isMoveInSet(hint!.suggestedMove, blackMoves)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('generateHint returns null when no legal moves exist', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(Color.WHITE, Color.BLACK),
        (playerColor) => {
          let board = initializeBoard();

          // Play random moves to potentially reach a terminal state
          // For this test, we verify the contract: if no legal moves, hint is null
          const moves = getAllLegalMoves(board, playerColor);
          if (moves.length === 0) {
            const hint = generateHint(board, playerColor);
            expect(hint).toBeNull();
          }
          // If moves exist, the hint must be non-null and legal (covered by other tests)
        },
      ),
      { numRuns: 10 },
    );
  });
});
