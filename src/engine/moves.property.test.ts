import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { initializeBoard, isValidPosition, getPiece, cloneBoard } from './board';
import { getLegalMoves, getAllLegalMoves } from './moves';
import { Color, Board, Move } from './types';

/**
 * Property 1: Move Legality
 *
 * For any valid board state and piece, every move from getLegalMoves must be
 * legal and produce a valid board.
 *
 * **Validates: Requirements 2.1, 2.2, 9.1, 9.2**
 */
describe('Property 1: Move Legality', () => {
  /**
   * Helper: apply a move on a cloned board (lightweight, for advancing game state).
   */
  function applyMove(board: Board, move: Move): Board {
    const b = cloneBoard(board);
    const piece = b.squares[move.from.row][move.from.col];
    if (!piece) return b;

    b.squares[move.to.row][move.to.col] = move.promotion
      ? { type: move.promotion, color: piece.color }
      : piece;
    b.squares[move.from.row][move.from.col] = null;

    // Handle en passant target for pawn double moves
    if (piece.type === 'PAWN' && Math.abs(move.to.row - move.from.row) === 2) {
      b.enPassantTarget = {
        row: (move.from.row + move.to.row) / 2,
        col: move.from.col,
      };
    } else {
      b.enPassantTarget = null;
    }

    // Handle en passant capture
    if (piece.type === 'PAWN' && board.enPassantTarget &&
        move.to.row === board.enPassantTarget.row &&
        move.to.col === board.enPassantTarget.col) {
      b.squares[move.from.row][move.to.col] = null;
    }

    // Handle castling rook movement
    if (piece.type === 'KING' && Math.abs(move.to.col - move.from.col) === 2) {
      const row = move.from.row;
      if (move.to.col === 6) {
        b.squares[row][5] = b.squares[row][7];
        b.squares[row][7] = null;
      } else if (move.to.col === 2) {
        b.squares[row][3] = b.squares[row][0];
        b.squares[row][0] = null;
      }
    }

    // Switch turn
    b.currentTurn = b.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;
    return b;
  }

  it('every move from getLegalMoves on the initial board has valid from/to positions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: 7 }),
        (row, col) => {
          const board = initializeBoard();
          const moves = getLegalMoves(board, { row, col });

          for (const move of moves) {
            expect(isValidPosition(move.from)).toBe(true);
            expect(isValidPosition(move.to)).toBe(true);
            expect(move.from.row).toBeGreaterThanOrEqual(0);
            expect(move.from.row).toBeLessThanOrEqual(7);
            expect(move.from.col).toBeGreaterThanOrEqual(0);
            expect(move.from.col).toBeLessThanOrEqual(7);
            expect(move.to.row).toBeGreaterThanOrEqual(0);
            expect(move.to.row).toBeLessThanOrEqual(7);
            expect(move.to.col).toBeGreaterThanOrEqual(0);
            expect(move.to.col).toBeLessThanOrEqual(7);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every move from getLegalMoves originates from a piece of the current turn color', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: 7 }),
        (row, col) => {
          const board = initializeBoard();
          const moves = getLegalMoves(board, { row, col });

          for (const move of moves) {
            const piece = getPiece(board, move.from);
            expect(piece).not.toBeNull();
            expect(piece!.color).toBe(board.currentTurn);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every move from getLegalMoves has a different from and to position', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: 7 }),
        (row, col) => {
          const board = initializeBoard();
          const moves = getLegalMoves(board, { row, col });

          for (const move of moves) {
            const sameSquare = move.from.row === move.to.row && move.from.col === move.to.col;
            expect(sameSquare).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all legal moves remain valid after a sequence of random legal moves', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }),
        fc.infiniteStream(fc.double({ min: 0, max: 1, noNaN: true })),
        (numMoves, randomStream) => {
          let board = initializeBoard();
          const iter = randomStream[Symbol.iterator]();

          for (let i = 0; i < numMoves; i++) {
            const allMoves = getAllLegalMoves(board, board.currentTurn);
            if (allMoves.length === 0) break;

            const randomVal = iter.next().value ?? 0;
            const idx = Math.floor(randomVal * allMoves.length) % allMoves.length;
            board = applyMove(board, allMoves[idx]);
          }

          // Now verify all legal moves from the resulting position
          const currentMoves = getAllLegalMoves(board, board.currentTurn);
          for (const move of currentMoves) {
            expect(isValidPosition(move.from)).toBe(true);
            expect(isValidPosition(move.to)).toBe(true);

            const piece = getPiece(board, move.from);
            expect(piece).not.toBeNull();
            expect(piece!.color).toBe(board.currentTurn);

            const sameSquare = move.from.row === move.to.row && move.from.col === move.to.col;
            expect(sameSquare).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
