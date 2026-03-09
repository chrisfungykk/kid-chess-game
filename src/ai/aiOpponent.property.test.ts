import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { selectMove } from './aiOpponent';
import { initializeBoard, cloneBoard } from '../engine/board';
import { getAllLegalMoves } from '../engine/moves';
import { simulateMove } from '../engine/execute';
import { Board, Color, Move } from '../engine/types';
import { Difficulty } from '../game/types';

/**
 * Property 7: AI and Hint Move Legality (AI)
 *
 * AI's selected move must always be a member of the legal moves set.
 *
 * **Validates: Requirements 3.5**
 */
describe('Property 7: AI Move Legality', () => {
  /**
   * Helper: apply a legal move to advance the board state.
   * Uses simulateMove for proper handling of special moves.
   */
  function advanceBoard(board: Board, move: Move): Board {
    return simulateMove(board, move);
  }

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

  it('selectMove on EASY always returns a move in the legal moves set for random board states', () => {
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
            board = advanceBoard(board, allMoves[idx]);
          }

          // Ensure it's BLACK's turn and there are legal moves
          const blackMoves = getAllLegalMoves(board, Color.BLACK);
          if (board.currentTurn !== Color.BLACK || blackMoves.length === 0) return;

          const aiMove = selectMove(board, Difficulty.EASY);
          expect(isMoveInSet(aiMove, blackMoves)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('selectMove on MEDIUM always returns a move in the legal moves set for random board states', () => {
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
            board = advanceBoard(board, allMoves[idx]);
          }

          // Ensure it's BLACK's turn and there are legal moves
          const blackMoves = getAllLegalMoves(board, Color.BLACK);
          if (board.currentTurn !== Color.BLACK || blackMoves.length === 0) return;

          const aiMove = selectMove(board, Difficulty.MEDIUM);
          expect(isMoveInSet(aiMove, blackMoves)).toBe(true);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('selectMove returns a legal move regardless of the random function value', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.constantFrom(Difficulty.EASY, Difficulty.MEDIUM),
        fc.integer({ min: 0, max: 6 }),
        fc.infiniteStream(fc.double({ min: 0, max: 1, noNaN: true })),
        (randomSeed, difficulty, numMoves, randomStream) => {
          let board = initializeBoard();
          const iter = randomStream[Symbol.iterator]();

          // Play random legal moves to reach a varied state
          for (let i = 0; i < numMoves; i++) {
            const allMoves = getAllLegalMoves(board, board.currentTurn);
            if (allMoves.length === 0) break;

            const randomVal = iter.next().value ?? 0;
            const idx = Math.floor(randomVal * allMoves.length) % allMoves.length;
            board = advanceBoard(board, allMoves[idx]);
          }

          // Ensure it's BLACK's turn and there are legal moves
          const blackMoves = getAllLegalMoves(board, Color.BLACK);
          if (board.currentTurn !== Color.BLACK || blackMoves.length === 0) return;

          // Use the generated randomSeed as the AI's random function
          const aiMove = selectMove(board, difficulty, () => randomSeed);
          expect(isMoveInSet(aiMove, blackMoves)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
