import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { initializeBoard, cloneBoard, getPiece } from './board';
import { getLegalMoves, getAllLegalMoves, isSquareAttacked } from './moves';
import { Color, Board, Move, PieceType } from './types';

/**
 * Property 2: King Safety
 *
 * No legal move may leave the moving player's own king in check.
 * For any board state and any move returned by getLegalMoves, executing that
 * move must not leave the moving player's own king in check.
 *
 * **Validates: Requirements 9.2**
 */
describe('Property 2: King Safety', () => {
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
    if (piece.type === PieceType.PAWN && Math.abs(move.to.row - move.from.row) === 2) {
      b.enPassantTarget = {
        row: (move.from.row + move.to.row) / 2,
        col: move.from.col,
      };
    } else {
      b.enPassantTarget = null;
    }

    // Handle en passant capture
    if (piece.type === PieceType.PAWN && board.enPassantTarget &&
        move.to.row === board.enPassantTarget.row &&
        move.to.col === board.enPassantTarget.col) {
      b.squares[move.from.row][move.to.col] = null;
    }

    // Handle castling rook movement
    if (piece.type === PieceType.KING && Math.abs(move.to.col - move.from.col) === 2) {
      const row = move.from.row;
      if (move.to.col === 6) {
        b.squares[row][5] = b.squares[row][7];
        b.squares[row][7] = null;
      } else if (move.to.col === 2) {
        b.squares[row][3] = b.squares[row][0];
        b.squares[row][0] = null;
      }
    }

    // Update castling rights
    if (piece.type === PieceType.KING) {
      if (piece.color === Color.WHITE) {
        b.castlingRights.whiteKingside = false;
        b.castlingRights.whiteQueenside = false;
      } else {
        b.castlingRights.blackKingside = false;
        b.castlingRights.blackQueenside = false;
      }
    }
    if (piece.type === PieceType.ROOK) {
      if (move.from.row === 7 && move.from.col === 7) b.castlingRights.whiteKingside = false;
      if (move.from.row === 7 && move.from.col === 0) b.castlingRights.whiteQueenside = false;
      if (move.from.row === 0 && move.from.col === 7) b.castlingRights.blackKingside = false;
      if (move.from.row === 0 && move.from.col === 0) b.castlingRights.blackQueenside = false;
    }

    // Switch turn
    b.currentTurn = b.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;
    return b;
  }

  /**
   * Helper: find the king position for a given color.
   */
  function findKing(board: Board, color: Color): { row: number; col: number } | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board.squares[row][col];
        if (piece && piece.type === PieceType.KING && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  it('no legal move from the initial position leaves the moving player\'s king in check', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: 7 }),
        (row, col) => {
          const board = initializeBoard();
          const movingColor = board.currentTurn;
          const opponentColor = movingColor === Color.WHITE ? Color.BLACK : Color.WHITE;
          const moves = getLegalMoves(board, { row, col });

          for (const move of moves) {
            const simulated = applyMove(board, move);
            const kingPos = findKing(simulated, movingColor);
            expect(kingPos).not.toBeNull();
            expect(isSquareAttacked(simulated, kingPos!, opponentColor)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no legal move leaves the king in check after a sequence of random legal moves', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }),
        fc.infiniteStream(fc.double({ min: 0, max: 1, noNaN: true })),
        (numMoves, randomStream) => {
          let board = initializeBoard();
          const iter = randomStream[Symbol.iterator]();

          // Play numMoves random legal moves to reach a varied board state
          for (let i = 0; i < numMoves; i++) {
            const allMoves = getAllLegalMoves(board, board.currentTurn);
            if (allMoves.length === 0) break;

            const randomVal = iter.next().value ?? 0;
            const idx = Math.floor(randomVal * allMoves.length) % allMoves.length;
            board = applyMove(board, allMoves[idx]);
          }

          // Now verify: every legal move for the current player must not leave their king in check
          const movingColor = board.currentTurn;
          const opponentColor = movingColor === Color.WHITE ? Color.BLACK : Color.WHITE;
          const currentMoves = getAllLegalMoves(board, movingColor);

          for (const move of currentMoves) {
            const simulated = applyMove(board, move);
            const kingPos = findKing(simulated, movingColor);
            expect(kingPos).not.toBeNull();
            expect(isSquareAttacked(simulated, kingPos!, opponentColor)).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
