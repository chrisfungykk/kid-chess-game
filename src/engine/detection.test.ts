import { describe, it, expect } from 'vitest';
import { Board, Color, PieceType, CastlingRights } from './types';
import { isCheck, isCheckmate, isStalemate, checkGameStatus } from './detection';
import { GameStatus } from '../game/types';
import { initializeBoard } from './board';

/** Helper to create an empty board with specified turn. */
function emptyBoard(turn: Color = Color.WHITE): Board {
  const squares: (null)[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null)
  );
  const castlingRights: CastlingRights = {
    whiteKingside: false,
    whiteQueenside: false,
    blackKingside: false,
    blackQueenside: false,
  };
  return {
    squares,
    currentTurn: turn,
    moveHistory: [],
    castlingRights,
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
  };
}

describe('isCheck', () => {
  it('returns false for the initial board position', () => {
    const board = initializeBoard();
    expect(isCheck(board, Color.WHITE)).toBe(false);
    expect(isCheck(board, Color.BLACK)).toBe(false);
  });

  it('detects check when a rook attacks the king', () => {
    const board = emptyBoard();
    // White king on e1 (row 7, col 4)
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    // Black rook on e8 (row 0, col 4) — attacks along the e-file
    board.squares[0][4] = { type: PieceType.ROOK, color: Color.BLACK };
    // Black king somewhere safe
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };

    expect(isCheck(board, Color.WHITE)).toBe(true);
    expect(isCheck(board, Color.BLACK)).toBe(false);
  });

  it('detects check when a bishop attacks the king diagonally', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[2][2] = { type: PieceType.BISHOP, color: Color.BLACK };
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };

    expect(isCheck(board, Color.WHITE)).toBe(true);
  });

  it('returns false when the king is not attacked', () => {
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };
    // Rook on a different file, no attack
    board.squares[0][7] = { type: PieceType.ROOK, color: Color.BLACK };

    expect(isCheck(board, Color.WHITE)).toBe(false);
  });
});

describe('isCheckmate', () => {
  it('detects fool\'s mate (checkmate for white)', () => {
    // After 1. f3 e5 2. g4 Qh4# — white is checkmated
    const board = emptyBoard(Color.WHITE);
    // Set up the fool's mate final position
    // White pieces
    board.squares[7][0] = { type: PieceType.ROOK, color: Color.WHITE };
    board.squares[7][1] = { type: PieceType.KNIGHT, color: Color.WHITE };
    board.squares[7][2] = { type: PieceType.BISHOP, color: Color.WHITE };
    board.squares[7][3] = { type: PieceType.QUEEN, color: Color.WHITE };
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[7][5] = { type: PieceType.BISHOP, color: Color.WHITE };
    board.squares[7][6] = { type: PieceType.KNIGHT, color: Color.WHITE };
    board.squares[7][7] = { type: PieceType.ROOK, color: Color.WHITE };
    board.squares[6][0] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][1] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][2] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][3] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][4] = { type: PieceType.PAWN, color: Color.WHITE };
    // f3 pawn
    board.squares[5][5] = { type: PieceType.PAWN, color: Color.WHITE };
    // g4 pawn
    board.squares[4][6] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][7] = { type: PieceType.PAWN, color: Color.WHITE };

    // Black pieces
    board.squares[0][0] = { type: PieceType.ROOK, color: Color.BLACK };
    board.squares[0][1] = { type: PieceType.KNIGHT, color: Color.BLACK };
    board.squares[0][2] = { type: PieceType.BISHOP, color: Color.BLACK };
    board.squares[0][3] = { type: PieceType.QUEEN, color: Color.BLACK }; // queen not here, it's on h4
    board.squares[0][4] = { type: PieceType.KING, color: Color.BLACK };
    board.squares[0][5] = { type: PieceType.BISHOP, color: Color.BLACK };
    board.squares[0][6] = { type: PieceType.KNIGHT, color: Color.BLACK };
    board.squares[0][7] = { type: PieceType.ROOK, color: Color.BLACK };
    board.squares[1][0] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][1] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][2] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][3] = { type: PieceType.PAWN, color: Color.BLACK };
    // e5 pawn
    board.squares[3][4] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][5] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][6] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][7] = { type: PieceType.PAWN, color: Color.BLACK };
    // Black queen on h4 (row 4, col 7) delivering checkmate
    board.squares[4][7] = { type: PieceType.QUEEN, color: Color.BLACK };
    // Remove queen from d8
    board.squares[0][3] = null;

    expect(isCheckmate(board, Color.WHITE)).toBe(true);
  });

  it('returns false when in check but can escape', () => {
    const board = emptyBoard(Color.WHITE);
    // White king on e1, black rook on e8 — check but king can move
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[0][4] = { type: PieceType.ROOK, color: Color.BLACK };
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };

    expect(isCheck(board, Color.WHITE)).toBe(true);
    expect(isCheckmate(board, Color.WHITE)).toBe(false);
  });

  it('returns false when not in check', () => {
    const board = initializeBoard();
    expect(isCheckmate(board, Color.WHITE)).toBe(false);
    expect(isCheckmate(board, Color.BLACK)).toBe(false);
  });

  it('detects back rank mate', () => {
    const board = emptyBoard(Color.WHITE);
    // White king on g1 (row 7, col 6), pawns on f2, g2, h2 blocking escape
    board.squares[7][6] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[6][5] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][6] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][7] = { type: PieceType.PAWN, color: Color.WHITE };
    // Black rook on a1 (row 7, col 0) delivering back rank mate
    board.squares[7][0] = { type: PieceType.ROOK, color: Color.BLACK };
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };

    expect(isCheckmate(board, Color.WHITE)).toBe(true);
  });
});

describe('isStalemate', () => {
  it('detects stalemate — king vs king', () => {
    // Bare kings can't deliver stalemate by themselves, need a specific position
    // King on a1, opponent king on c2, no other pieces — white has no legal moves if boxed in
    const board = emptyBoard(Color.WHITE);
    board.squares[7][0] = { type: PieceType.KING, color: Color.WHITE }; // a1
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK }; // a8

    // This is NOT stalemate — white king can move
    expect(isStalemate(board, Color.WHITE)).toBe(false);
  });

  it('detects stalemate when king is trapped but not in check', () => {
    // Classic stalemate: white king on a8, black queen on b6, black king on c8
    // White to move, king has no legal moves but is not in check
    const board = emptyBoard(Color.WHITE);
    board.squares[0][0] = { type: PieceType.KING, color: Color.WHITE }; // a8
    board.squares[2][1] = { type: PieceType.QUEEN, color: Color.BLACK }; // b6
    board.squares[2][2] = { type: PieceType.KING, color: Color.BLACK }; // c6

    expect(isCheck(board, Color.WHITE)).toBe(false);
    expect(isStalemate(board, Color.WHITE)).toBe(true);
  });

  it('returns false when player has legal moves', () => {
    const board = initializeBoard();
    expect(isStalemate(board, Color.WHITE)).toBe(false);
  });

  it('returns false when in check (that would be checkmate, not stalemate)', () => {
    const board = emptyBoard(Color.WHITE);
    // White king trapped and in check — this is checkmate, not stalemate
    board.squares[7][6] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[6][5] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][6] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][7] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[7][0] = { type: PieceType.ROOK, color: Color.BLACK };
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };

    expect(isStalemate(board, Color.WHITE)).toBe(false);
  });
});

describe('checkGameStatus', () => {
  it('returns IN_PROGRESS for the initial position', () => {
    const board = initializeBoard();
    expect(checkGameStatus(board, Color.WHITE)).toBe(GameStatus.IN_PROGRESS);
    expect(checkGameStatus(board, Color.BLACK)).toBe(GameStatus.IN_PROGRESS);
  });

  it('returns CHECK when king is in check with escape', () => {
    const board = emptyBoard(Color.WHITE);
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[0][4] = { type: PieceType.ROOK, color: Color.BLACK };
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };

    expect(checkGameStatus(board, Color.WHITE)).toBe(GameStatus.CHECK);
  });

  it('returns CHECKMATE for back rank mate', () => {
    const board = emptyBoard(Color.WHITE);
    board.squares[7][6] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[6][5] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][6] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[6][7] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[7][0] = { type: PieceType.ROOK, color: Color.BLACK };
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };

    expect(checkGameStatus(board, Color.WHITE)).toBe(GameStatus.CHECKMATE);
  });

  it('returns STALEMATE when king is trapped but not in check', () => {
    const board = emptyBoard(Color.WHITE);
    board.squares[0][0] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[2][1] = { type: PieceType.QUEEN, color: Color.BLACK };
    board.squares[2][2] = { type: PieceType.KING, color: Color.BLACK };

    expect(checkGameStatus(board, Color.WHITE)).toBe(GameStatus.STALEMATE);
  });
});
