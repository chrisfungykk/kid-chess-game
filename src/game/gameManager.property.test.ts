import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { initializeBoard } from '../engine/board';
import { getAllLegalMoves } from '../engine/moves';
import { executeMove } from '../engine/execute';
import { Color } from '../engine/types';
import {
  startNewGame,
  restartGame,
  makeMove,
  getGameState,
} from './gameManager';
import { Difficulty, GameStatus } from './types';
import { setLanguage, getLanguage } from '../i18n/i18nModule';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

/**
 * Property 3: Turn Alternation
 *
 * After every executed move, the current turn must switch between WHITE and BLACK.
 * No sequence of moves may result in the same player moving twice consecutively.
 *
 * **Validates: Requirements 9.4**
 */
describe('Property 3: Turn Alternation', () => {
  it('after every executed move, the current turn switches between WHITE and BLACK', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.infiniteStream(fc.double({ min: 0, max: 1, noNaN: true })),
        (numMoves, randomStream) => {
          let board = initializeBoard();
          const iter = randomStream[Symbol.iterator]();

          for (let i = 0; i < numMoves; i++) {
            const turnBefore = board.currentTurn;
            const legalMoves = getAllLegalMoves(board, board.currentTurn);
            if (legalMoves.length === 0) break;

            const randomVal = iter.next().value ?? 0;
            const idx = Math.floor(randomVal * legalMoves.length) % legalMoves.length;
            const move = legalMoves[idx];

            const result = executeMove(board, move);
            board = result.board;

            // After executing a move, the turn must have switched
            const expectedTurn = turnBefore === Color.WHITE ? Color.BLACK : Color.WHITE;
            expect(board.currentTurn).toBe(expectedTurn);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 10: Restart Preservation
 *
 * Restarting preserves high score, difficulty, and language while resetting
 * board and score to zero.
 *
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
 */
describe('Property 10: Restart Preservation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setLanguage('en');
  });

  it('restarting preserves high score, difficulty, and language while resetting board and score', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(Difficulty.EASY, Difficulty.MEDIUM),
        fc.integer({ min: 0, max: 9999 }),
        fc.constantFrom('en', 'zh-TW'),
        (difficulty, highScore, language) => {
          // Set up high score in localStorage
          localStorageMock.setItem('kids-chess-high-score', String(highScore));

          // Start a game with the given difficulty
          startNewGame(difficulty);

          // Set the language
          setLanguage(language);

          // Make a move to change the board state (e2 to e4 is always legal from start)
          makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });

          // Restart the game
          const restarted = restartGame();

          // High score must be preserved
          expect(restarted.score.highScore).toBe(highScore);

          // Difficulty must be preserved
          expect(restarted.difficulty).toBe(difficulty);

          // Language must be preserved
          expect(getLanguage()).toBe(language);

          // Board must be reset (fresh starting position)
          expect(restarted.board.currentTurn).toBe(Color.WHITE);
          expect(restarted.board.moveHistory).toHaveLength(0);

          // Score must be reset to zero
          expect(restarted.score.currentScore).toBe(0);
          expect(restarted.score.capturePoints).toBe(0);
          expect(restarted.score.checkmateBonus).toBe(0);
          expect(restarted.score.hintPenalty).toBe(0);

          // Status must be IN_PROGRESS
          expect(restarted.status).toBe(GameStatus.IN_PROGRESS);
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 14: Illegal Move Rejection
 *
 * Attempting an illegal move must leave the board state completely unchanged.
 *
 * **Validates: Requirements 2.3**
 */
describe('Property 14: Illegal Move Rejection', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('attempting an illegal move leaves the board state completely unchanged', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: 7 }),
        (fromRow, fromCol, toRow, toCol) => {
          startNewGame(Difficulty.EASY);

          const from = { row: fromRow, col: fromCol };
          const to = { row: toRow, col: toCol };

          // Check if this move is legal — if it is, skip this test case
          const stateBefore = getGameState();
          const legalMoves = getAllLegalMoves(stateBefore.board, stateBefore.board.currentTurn);
          const isLegal = legalMoves.some(
            m => m.from.row === from.row && m.from.col === from.col &&
                 m.to.row === to.row && m.to.col === to.col
          );

          if (isLegal) return; // Skip legal moves — we only test illegal ones

          // Snapshot the state before the illegal move attempt
          const boardBefore = JSON.stringify(stateBefore.board.squares);
          const turnBefore = stateBefore.board.currentTurn;
          const scoreBefore = stateBefore.score.currentScore;
          const statusBefore = stateBefore.status;

          // Attempt the illegal move
          const result = makeMove(from, to);

          // Move must be rejected
          expect(result.success).toBe(false);

          // Board state must be completely unchanged
          const stateAfter = getGameState();
          expect(JSON.stringify(stateAfter.board.squares)).toBe(boardBefore);
          expect(stateAfter.board.currentTurn).toBe(turnBefore);
          expect(stateAfter.score.currentScore).toBe(scoreBefore);
          expect(stateAfter.status).toBe(statusBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});
