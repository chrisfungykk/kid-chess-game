import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { initializeBoard, cloneBoard } from './board';
import { getAllLegalMoves } from './moves';
import { isCheck, isCheckmate, isStalemate, checkGameStatus } from './detection';
import { Color, Board, Move, PieceType } from './types';
import { GameStatus } from '../game/types';

/**
 * Property 9: Game Termination Detection
 *
 * If current player has no legal moves: CHECKMATE if king in check, STALEMATE if not.
 * When legal moves exist, status is either IN_PROGRESS or CHECK (never CHECKMATE/STALEMATE).
 *
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */
describe('Property 9: Game Termination Detection', () => {
  /**
   * Helper: apply a move on a cloned board for advancing game state.
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

  it('when no legal moves and king in check → CHECKMATE; when no legal moves and king not in check → STALEMATE', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 40 }),
        fc.infiniteStream(fc.double({ min: 0, max: 1, noNaN: true })),
        (numMoves, randomStream) => {
          let board = initializeBoard();
          const iter = randomStream[Symbol.iterator]();

          // Play random legal moves to reach a varied board state
          for (let i = 0; i < numMoves; i++) {
            const allMoves = getAllLegalMoves(board, board.currentTurn);
            if (allMoves.length === 0) break;

            const randomVal = iter.next().value ?? 0;
            const idx = Math.floor(randomVal * allMoves.length) % allMoves.length;
            board = applyMove(board, allMoves[idx]);
          }

          const currentColor = board.currentTurn;
          const legalMoves = getAllLegalMoves(board, currentColor);
          const kingInCheck = isCheck(board, currentColor);
          const status = checkGameStatus(board, currentColor);

          if (legalMoves.length === 0) {
            // No legal moves: must be checkmate or stalemate
            if (kingInCheck) {
              expect(status).toBe(GameStatus.CHECKMATE);
              expect(isCheckmate(board, currentColor)).toBe(true);
              expect(isStalemate(board, currentColor)).toBe(false);
            } else {
              expect(status).toBe(GameStatus.STALEMATE);
              expect(isStalemate(board, currentColor)).toBe(true);
              expect(isCheckmate(board, currentColor)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when legal moves exist, status is never CHECKMATE or STALEMATE', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.infiniteStream(fc.double({ min: 0, max: 1, noNaN: true })),
        (numMoves, randomStream) => {
          let board = initializeBoard();
          const iter = randomStream[Symbol.iterator]();

          // Play random legal moves
          for (let i = 0; i < numMoves; i++) {
            const allMoves = getAllLegalMoves(board, board.currentTurn);
            if (allMoves.length === 0) break;

            const randomVal = iter.next().value ?? 0;
            const idx = Math.floor(randomVal * allMoves.length) % allMoves.length;
            board = applyMove(board, allMoves[idx]);
          }

          const currentColor = board.currentTurn;
          const legalMoves = getAllLegalMoves(board, currentColor);
          const status = checkGameStatus(board, currentColor);

          if (legalMoves.length > 0) {
            // Legal moves exist: status must be IN_PROGRESS or CHECK
            expect(status).not.toBe(GameStatus.CHECKMATE);
            expect(status).not.toBe(GameStatus.STALEMATE);
            expect([GameStatus.IN_PROGRESS, GameStatus.CHECK]).toContain(status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
