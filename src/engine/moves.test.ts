import { describe, it, expect } from 'vitest';
import { Board, Color, PieceType, Position, Move } from './types';
import { initializeBoard } from './board';
import {
  generatePawnMoves,
  generateKnightMoves,
  generateSlidingMoves,
  generateKingMoves,
  getLegalMoves,
  getAllLegalMoves,
  isSquareAttacked,
} from './moves';

/** Helper to create an empty board for targeted tests. */
function emptyBoard(turn: Color = Color.WHITE): Board {
  return {
    squares: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null)),
    currentTurn: turn,
    moveHistory: [],
    castlingRights: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false,
    },
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
  };
}

/** Helper: check if a move list contains a move to a specific position. */
function hasMoveTo(moves: Move[], row: number, col: number): boolean {
  return moves.some(m => m.to.row === row && m.to.col === col);
}

// ─── isSquareAttacked ───────────────────────────────────────────────

describe('isSquareAttacked', () => {
  it('detects knight attack', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.KNIGHT, color: Color.BLACK };
    expect(isSquareAttacked(board, { row: 2, col: 3 }, Color.BLACK)).toBe(true);
    expect(isSquareAttacked(board, { row: 0, col: 0 }, Color.BLACK)).toBe(false);
  });

  it('detects rook attack along rank', () => {
    const board = emptyBoard();
    board.squares[3][0] = { type: PieceType.ROOK, color: Color.WHITE };
    expect(isSquareAttacked(board, { row: 3, col: 7 }, Color.WHITE)).toBe(true);
  });

  it('detects bishop diagonal attack', () => {
    const board = emptyBoard();
    board.squares[0][0] = { type: PieceType.BISHOP, color: Color.BLACK };
    expect(isSquareAttacked(board, { row: 3, col: 3 }, Color.BLACK)).toBe(true);
  });

  it('detects pawn attack', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.PAWN, color: Color.WHITE };
    // White pawns attack diagonally upward (row - 1)
    expect(isSquareAttacked(board, { row: 3, col: 3 }, Color.WHITE)).toBe(true);
    expect(isSquareAttacked(board, { row: 3, col: 5 }, Color.WHITE)).toBe(true);
    expect(isSquareAttacked(board, { row: 3, col: 4 }, Color.WHITE)).toBe(false);
  });

  it('detects king attack', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.KING, color: Color.BLACK };
    expect(isSquareAttacked(board, { row: 3, col: 4 }, Color.BLACK)).toBe(true);
    expect(isSquareAttacked(board, { row: 2, col: 4 }, Color.BLACK)).toBe(false);
  });
});

// ─── Pawn Moves ─────────────────────────────────────────────────────

describe('generatePawnMoves', () => {
  it('white pawn can move forward 1 from middle of board', () => {
    const board = emptyBoard();
    board.squares[4][3] = { type: PieceType.PAWN, color: Color.WHITE };
    const moves = generatePawnMoves(board, { row: 4, col: 3 }, Color.WHITE);
    expect(hasMoveTo(moves, 3, 3)).toBe(true);
    expect(moves.length).toBe(1);
  });

  it('white pawn can move forward 2 from starting rank', () => {
    const board = emptyBoard();
    board.squares[6][4] = { type: PieceType.PAWN, color: Color.WHITE };
    const moves = generatePawnMoves(board, { row: 6, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 5, 4)).toBe(true);
    expect(hasMoveTo(moves, 4, 4)).toBe(true);
  });

  it('black pawn can move forward 2 from starting rank', () => {
    const board = emptyBoard(Color.BLACK);
    board.squares[1][4] = { type: PieceType.PAWN, color: Color.BLACK };
    const moves = generatePawnMoves(board, { row: 1, col: 4 }, Color.BLACK);
    expect(hasMoveTo(moves, 2, 4)).toBe(true);
    expect(hasMoveTo(moves, 3, 4)).toBe(true);
  });

  it('pawn cannot move forward if blocked', () => {
    const board = emptyBoard();
    board.squares[6][4] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[5][4] = { type: PieceType.PAWN, color: Color.BLACK };
    const moves = generatePawnMoves(board, { row: 6, col: 4 }, Color.WHITE);
    expect(moves.length).toBe(0);
  });

  it('pawn captures diagonally', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[3][3] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[3][5] = { type: PieceType.PAWN, color: Color.BLACK };
    const moves = generatePawnMoves(board, { row: 4, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 3, 3)).toBe(true);
    expect(hasMoveTo(moves, 3, 5)).toBe(true);
    expect(hasMoveTo(moves, 3, 4)).toBe(true); // forward
  });

  it('pawn does not capture own pieces', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[3][3] = { type: PieceType.PAWN, color: Color.WHITE };
    const moves = generatePawnMoves(board, { row: 4, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 3, 3)).toBe(false);
  });

  it('white pawn promotes on row 0 with all 4 options', () => {
    const board = emptyBoard();
    board.squares[1][4] = { type: PieceType.PAWN, color: Color.WHITE };
    const moves = generatePawnMoves(board, { row: 1, col: 4 }, Color.WHITE);
    const promotionMoves = moves.filter(m => m.to.row === 0 && m.to.col === 4);
    expect(promotionMoves.length).toBe(4);
    const promoTypes = promotionMoves.map(m => m.promotion).sort();
    expect(promoTypes).toEqual([PieceType.BISHOP, PieceType.KNIGHT, PieceType.QUEEN, PieceType.ROOK].sort());
  });

  it('en passant capture for white', () => {
    const board = emptyBoard();
    board.squares[3][4] = { type: PieceType.PAWN, color: Color.WHITE };
    board.squares[3][5] = { type: PieceType.PAWN, color: Color.BLACK };
    board.enPassantTarget = { row: 2, col: 5 };
    const moves = generatePawnMoves(board, { row: 3, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 2, 5)).toBe(true);
  });

  it('en passant capture for black', () => {
    const board = emptyBoard(Color.BLACK);
    board.squares[4][3] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[4][4] = { type: PieceType.PAWN, color: Color.WHITE };
    board.enPassantTarget = { row: 5, col: 4 };
    const moves = generatePawnMoves(board, { row: 4, col: 3 }, Color.BLACK);
    expect(hasMoveTo(moves, 5, 4)).toBe(true);
  });
});

// ─── Knight Moves ───────────────────────────────────────────────────

describe('generateKnightMoves', () => {
  it('knight in center has 8 moves on empty board', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.KNIGHT, color: Color.WHITE };
    const moves = generateKnightMoves(board, { row: 4, col: 4 }, Color.WHITE);
    expect(moves.length).toBe(8);
  });

  it('knight in corner has 2 moves', () => {
    const board = emptyBoard();
    board.squares[0][0] = { type: PieceType.KNIGHT, color: Color.WHITE };
    const moves = generateKnightMoves(board, { row: 0, col: 0 }, Color.WHITE);
    expect(moves.length).toBe(2);
    expect(hasMoveTo(moves, 1, 2)).toBe(true);
    expect(hasMoveTo(moves, 2, 1)).toBe(true);
  });

  it('knight cannot land on own piece', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.KNIGHT, color: Color.WHITE };
    board.squares[2][3] = { type: PieceType.PAWN, color: Color.WHITE };
    const moves = generateKnightMoves(board, { row: 4, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 2, 3)).toBe(false);
    expect(moves.length).toBe(7);
  });

  it('knight can capture opponent piece', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.KNIGHT, color: Color.WHITE };
    board.squares[2][3] = { type: PieceType.PAWN, color: Color.BLACK };
    const moves = generateKnightMoves(board, { row: 4, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 2, 3)).toBe(true);
  });
});

// ─── Sliding Moves ──────────────────────────────────────────────────

describe('generateSlidingMoves', () => {
  it('rook on empty board has 14 moves', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.ROOK, color: Color.WHITE };
    const straight = [
      { row: -1, col: 0 }, { row: 1, col: 0 },
      { row: 0, col: -1 }, { row: 0, col: 1 },
    ];
    const moves = generateSlidingMoves(board, { row: 4, col: 4 }, Color.WHITE, straight);
    expect(moves.length).toBe(14);
  });

  it('bishop on empty board from center has 13 moves', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.BISHOP, color: Color.WHITE };
    const diagonal = [
      { row: -1, col: -1 }, { row: -1, col: 1 },
      { row: 1, col: -1 }, { row: 1, col: 1 },
    ];
    const moves = generateSlidingMoves(board, { row: 4, col: 4 }, Color.WHITE, diagonal);
    expect(moves.length).toBe(13);
  });

  it('sliding piece is blocked by own piece', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.ROOK, color: Color.WHITE };
    board.squares[4][6] = { type: PieceType.PAWN, color: Color.WHITE };
    const straight = [{ row: 0, col: 1 }]; // only right direction
    const moves = generateSlidingMoves(board, { row: 4, col: 4 }, Color.WHITE, straight);
    // Can go to col 5 only (col 6 is own piece)
    expect(moves.length).toBe(1);
    expect(hasMoveTo(moves, 4, 5)).toBe(true);
  });

  it('sliding piece can capture opponent and stops', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.ROOK, color: Color.WHITE };
    board.squares[4][6] = { type: PieceType.PAWN, color: Color.BLACK };
    const straight = [{ row: 0, col: 1 }];
    const moves = generateSlidingMoves(board, { row: 4, col: 4 }, Color.WHITE, straight);
    expect(moves.length).toBe(2); // col 5 and col 6 (capture)
    expect(hasMoveTo(moves, 4, 6)).toBe(true);
  });
});

// ─── King Moves ─────────────────────────────────────────────────────

describe('generateKingMoves', () => {
  it('king in center has 8 moves on empty board', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.KING, color: Color.WHITE };
    const moves = generateKingMoves(board, { row: 4, col: 4 }, Color.WHITE);
    expect(moves.length).toBe(8);
  });

  it('king in corner has 3 moves', () => {
    const board = emptyBoard();
    board.squares[0][0] = { type: PieceType.KING, color: Color.WHITE };
    const moves = generateKingMoves(board, { row: 0, col: 0 }, Color.WHITE);
    expect(moves.length).toBe(3);
  });

  it('white kingside castling when conditions met', () => {
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[7][7] = { type: PieceType.ROOK, color: Color.WHITE };
    board.castlingRights.whiteKingside = true;
    const moves = generateKingMoves(board, { row: 7, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 7, 6)).toBe(true);
  });

  it('white queenside castling when conditions met', () => {
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[7][0] = { type: PieceType.ROOK, color: Color.WHITE };
    board.castlingRights.whiteQueenside = true;
    const moves = generateKingMoves(board, { row: 7, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 7, 2)).toBe(true);
  });

  it('no castling when path is blocked', () => {
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[7][7] = { type: PieceType.ROOK, color: Color.WHITE };
    board.squares[7][5] = { type: PieceType.BISHOP, color: Color.WHITE };
    board.castlingRights.whiteKingside = true;
    const moves = generateKingMoves(board, { row: 7, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 7, 6)).toBe(false);
  });

  it('no castling when king passes through attacked square', () => {
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[7][7] = { type: PieceType.ROOK, color: Color.WHITE };
    board.castlingRights.whiteKingside = true;
    // Black rook attacks f1 (row 7, col 5)
    board.squares[0][5] = { type: PieceType.ROOK, color: Color.BLACK };
    const moves = generateKingMoves(board, { row: 7, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 7, 6)).toBe(false);
  });

  it('no castling when king is in check', () => {
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[7][7] = { type: PieceType.ROOK, color: Color.WHITE };
    board.castlingRights.whiteKingside = true;
    // Black rook attacks e1 (row 7, col 4)
    board.squares[0][4] = { type: PieceType.ROOK, color: Color.BLACK };
    const moves = generateKingMoves(board, { row: 7, col: 4 }, Color.WHITE);
    expect(hasMoveTo(moves, 7, 6)).toBe(false);
  });
});

// ─── getLegalMoves ──────────────────────────────────────────────────

describe('getLegalMoves', () => {
  it('returns legal moves from starting position for a pawn', () => {
    const board = initializeBoard();
    const moves = getLegalMoves(board, { row: 6, col: 4 }); // e2 pawn
    expect(moves.length).toBe(2); // e3 and e4
    expect(hasMoveTo(moves, 5, 4)).toBe(true);
    expect(hasMoveTo(moves, 4, 4)).toBe(true);
  });

  it('returns legal moves for a knight from starting position', () => {
    const board = initializeBoard();
    const moves = getLegalMoves(board, { row: 7, col: 1 }); // b1 knight
    expect(moves.length).toBe(2); // a3 and c3
    expect(hasMoveTo(moves, 5, 0)).toBe(true);
    expect(hasMoveTo(moves, 5, 2)).toBe(true);
  });

  it('returns empty for empty square', () => {
    const board = initializeBoard();
    expect(getLegalMoves(board, { row: 4, col: 4 })).toEqual([]);
  });

  it('returns empty for opponent piece', () => {
    const board = initializeBoard(); // white to move
    expect(getLegalMoves(board, { row: 1, col: 0 })).toEqual([]); // black pawn
  });

  it('filters moves that leave king in check', () => {
    // Set up a pinned piece scenario
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[7][5] = { type: PieceType.BISHOP, color: Color.WHITE };
    board.squares[7][7] = { type: PieceType.ROOK, color: Color.BLACK };
    // The bishop at f1 is pinned by the rook at h1 — it cannot move
    const moves = getLegalMoves(board, { row: 7, col: 5 });
    expect(moves.length).toBe(0);
  });

  it('king cannot move into check', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[0][3] = { type: PieceType.ROOK, color: Color.BLACK };
    const moves = getLegalMoves(board, { row: 4, col: 4 });
    // King cannot go to col 3 (attacked by rook)
    expect(hasMoveTo(moves, 3, 3)).toBe(false);
    expect(hasMoveTo(moves, 4, 3)).toBe(false);
    expect(hasMoveTo(moves, 5, 3)).toBe(false);
  });
});

// ─── getAllLegalMoves ───────────────────────────────────────────────

describe('getAllLegalMoves', () => {
  it('returns 20 legal moves for white from starting position', () => {
    const board = initializeBoard();
    const moves = getAllLegalMoves(board, Color.WHITE);
    // 16 pawn moves (8 pawns × 2 moves each) + 4 knight moves (2 knights × 2 moves each)
    expect(moves.length).toBe(20);
  });

  it('returns 20 legal moves for black from starting position', () => {
    const board = initializeBoard();
    const moves = getAllLegalMoves(board, Color.BLACK);
    expect(moves.length).toBe(20);
  });

  it('returns empty when no pieces of that color exist', () => {
    const board = emptyBoard();
    board.squares[4][4] = { type: PieceType.KING, color: Color.WHITE };
    const moves = getAllLegalMoves(board, Color.BLACK);
    expect(moves.length).toBe(0);
  });
});
