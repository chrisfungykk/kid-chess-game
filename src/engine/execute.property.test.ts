import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { initializeBoard, cloneBoard } from './board';
import { getAllLegalMoves } from './moves';
import { simulateMove } from './execute';
import { Board, Color, Move } from './types';

/**
 * Property 11: Immutable Move Simulation
 *
 * For any board state and any legal move, calling simulateMove must return a new
 * board reflecting the move without modifying the original board. The original
 * board must be identical before and after the call.
 *
 * **Validates: Requirements 10.1, 10.2, 10.3**
 */
describe('Property 11: Immutable Move Simulation', () => {
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

    if (piece.type === 'PAWN' && Math.abs(move.to.row - move.from.row) === 2) {
      b.enPassantTarget = {
        row: (move.from.row + move.to.row) / 2,
        col: move.from.col,
      };
    } else {
      b.enPassantTarget = null;
    }

    if (piece.type === 'PAWN' && board.enPassantTarget &&
        move.to.row === board.enPassantTarget.row &&
        move.to.col === board.enPassantTarget.col) {
      b.squares[move.from.row][move.to.col] = null;
    }

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

    b.currentTurn = b.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;
    return b;
  }

  /**
   * Deep-compare two boards for structural equality.
   */
  function boardsAreEqual(a: Board, b: Board): boolean {
    // Compare squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const pa = a.squares[row][col];
        const pb = b.squares[row][col];
        if (pa === null && pb === null) continue;
        if (pa === null || pb === null) return false;
        if (pa.type !== pb.type || pa.color !== pb.color) return false;
      }
    }

    if (a.currentTurn !== b.currentTurn) return false;
    if (a.halfMoveClock !== b.halfMoveClock) return false;
    if (a.fullMoveNumber !== b.fullMoveNumber) return false;

    // Compare castling rights
    if (a.castlingRights.whiteKingside !== b.castlingRights.whiteKingside) return false;
    if (a.castlingRights.whiteQueenside !== b.castlingRights.whiteQueenside) return false;
    if (a.castlingRights.blackKingside !== b.castlingRights.blackKingside) return false;
    if (a.castlingRights.blackQueenside !== b.castlingRights.blackQueenside) return false;

    // Compare en passant target
    if (a.enPassantTarget === null && b.enPassantTarget === null) { /* ok */ }
    else if (a.enPassantTarget === null || b.enPassantTarget === null) return false;
    else if (a.enPassantTarget.row !== b.enPassantTarget.row ||
             a.enPassantTarget.col !== b.enPassantTarget.col) return false;

    // Compare move history length and content
    if (a.moveHistory.length !== b.moveHistory.length) return false;
    for (let i = 0; i < a.moveHistory.length; i++) {
      const ra = a.moveHistory[i];
      const rb = b.moveHistory[i];
      if (ra.move.from.row !== rb.move.from.row || ra.move.from.col !== rb.move.from.col) return false;
      if (ra.move.to.row !== rb.move.to.row || ra.move.to.col !== rb.move.to.col) return false;
      if (ra.move.promotion !== rb.move.promotion) return false;
      if (ra.wasCheck !== rb.wasCheck) return false;
      if (ra.notation !== rb.notation) return false;
    }

    return true;
  }

  it('simulateMove does not modify the original board from the initial position', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: 7 }),
        (row, col) => {
          const board = initializeBoard();
          const moves = getAllLegalMoves(board, board.currentTurn);
          if (moves.length === 0) return;

          // Pick a move deterministically based on row/col
          const move = moves[(row * 8 + col) % moves.length];

          // Deep-clone the board before calling simulateMove
          const snapshot = cloneBoard(board);

          // Call simulateMove
          const result = simulateMove(board, move);

          // Original board must be identical to the snapshot
          expect(boardsAreEqual(board, snapshot)).toBe(true);

          // Result must be a different object
          expect(result).not.toBe(board);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('simulateMove does not modify the original board after a sequence of random moves', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }),
        fc.infiniteStream(fc.double({ min: 0, max: 1, noNaN: true })),
        (numMoves, randomStream) => {
          let board = initializeBoard();
          const iter = randomStream[Symbol.iterator]();

          // Play a random sequence of moves to reach a varied board state
          for (let i = 0; i < numMoves; i++) {
            const allMoves = getAllLegalMoves(board, board.currentTurn);
            if (allMoves.length === 0) break;

            const randomVal = iter.next().value ?? 0;
            const idx = Math.floor(randomVal * allMoves.length) % allMoves.length;
            board = applyMove(board, allMoves[idx]);
          }

          // Now get legal moves from the resulting position
          const legalMoves = getAllLegalMoves(board, board.currentTurn);
          if (legalMoves.length === 0) return;

          // Pick a move
          const randomVal = iter.next().value ?? 0;
          const moveIdx = Math.floor(randomVal * legalMoves.length) % legalMoves.length;
          const move = legalMoves[moveIdx];

          // Deep-clone the board before calling simulateMove
          const snapshot = cloneBoard(board);

          // Call simulateMove
          const result = simulateMove(board, move);

          // Original board must be identical to the snapshot
          expect(boardsAreEqual(board, snapshot)).toBe(true);

          // Result must be a different object
          expect(result).not.toBe(board);
        }
      ),
      { numRuns: 50 }
    );
  });
});
