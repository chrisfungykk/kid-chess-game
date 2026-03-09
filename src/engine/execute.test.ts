import { describe, it, expect } from 'vitest';
import { executeMove, simulateMove } from './execute';
import { initializeBoard, cloneBoard } from './board';
import { Board, Color, Move, PieceType, Piece } from './types';

/**
 * Helper: create an empty board with just the pieces we need.
 */
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

function placePiece(board: Board, row: number, col: number, type: PieceType, color: Color): void {
  board.squares[row][col] = { type, color };
}

describe('executeMove', () => {
  describe('normal moves', () => {
    it('moves a piece from source to destination', () => {
      const board = initializeBoard();
      const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.squares[6][4]).toBeNull();
      expect(result.board.squares[4][4]).toEqual({ type: PieceType.PAWN, color: Color.WHITE });
      expect(result.capturedPiece).toBeNull();
    });

    it('does not mutate the original board', () => {
      const board = initializeBoard();
      const original = cloneBoard(board);
      const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
      executeMove(board, move);

      expect(board).toEqual(original);
    });
  });

  describe('captures', () => {
    it('returns the captured piece', () => {
      const board = emptyBoard();
      placePiece(board, 4, 4, PieceType.KNIGHT, Color.WHITE);
      placePiece(board, 2, 3, PieceType.PAWN, Color.BLACK);
      // Place kings to avoid issues
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);

      const move: Move = { from: { row: 4, col: 4 }, to: { row: 2, col: 3 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.capturedPiece).toEqual({ type: PieceType.PAWN, color: Color.BLACK });
      expect(result.board.squares[2][3]).toEqual({ type: PieceType.KNIGHT, color: Color.WHITE });
    });

    it('resets halfMoveClock on capture', () => {
      const board = emptyBoard();
      board.halfMoveClock = 10;
      placePiece(board, 4, 4, PieceType.KNIGHT, Color.WHITE);
      placePiece(board, 2, 3, PieceType.PAWN, Color.BLACK);
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);

      const move: Move = { from: { row: 4, col: 4 }, to: { row: 2, col: 3 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.halfMoveClock).toBe(0);
    });
  });

  describe('turn switching', () => {
    it('switches from WHITE to BLACK after white moves', () => {
      const board = initializeBoard();
      const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.currentTurn).toBe(Color.BLACK);
    });

    it('switches from BLACK to WHITE after black moves', () => {
      const board = initializeBoard();
      board.currentTurn = Color.BLACK;
      const move: Move = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.currentTurn).toBe(Color.WHITE);
    });
  });

  describe('en passant', () => {
    it('captures the pawn via en passant', () => {
      const board = emptyBoard();
      // White pawn on row 3, col 4 (has advanced to rank 5)
      placePiece(board, 3, 4, PieceType.PAWN, Color.WHITE);
      // Black pawn on row 3, col 3 (just moved two squares)
      placePiece(board, 3, 3, PieceType.PAWN, Color.BLACK);
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
      board.enPassantTarget = { row: 2, col: 3 };

      const move: Move = { from: { row: 3, col: 4 }, to: { row: 2, col: 3 }, promotion: null };
      const result = executeMove(board, move);

      // The white pawn should be at the en passant target
      expect(result.board.squares[2][3]).toEqual({ type: PieceType.PAWN, color: Color.WHITE });
      // The captured black pawn should be removed
      expect(result.board.squares[3][3]).toBeNull();
      // The captured piece should be the black pawn
      expect(result.capturedPiece).toEqual({ type: PieceType.PAWN, color: Color.BLACK });
    });
  });

  describe('en passant target update', () => {
    it('sets en passant target when pawn moves two squares', () => {
      const board = initializeBoard();
      const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.enPassantTarget).toEqual({ row: 5, col: 4 });
    });

    it('clears en passant target on non-double pawn move', () => {
      const board = initializeBoard();
      board.enPassantTarget = { row: 5, col: 3 };
      const move: Move = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.enPassantTarget).toBeNull();
    });
  });

  describe('castling', () => {
    it('handles white kingside castling', () => {
      const board = emptyBoard();
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 7, 7, PieceType.ROOK, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
      board.castlingRights.whiteKingside = true;

      const move: Move = { from: { row: 7, col: 4 }, to: { row: 7, col: 6 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.squares[7][6]).toEqual({ type: PieceType.KING, color: Color.WHITE });
      expect(result.board.squares[7][5]).toEqual({ type: PieceType.ROOK, color: Color.WHITE });
      expect(result.board.squares[7][4]).toBeNull();
      expect(result.board.squares[7][7]).toBeNull();
    });

    it('handles white queenside castling', () => {
      const board = emptyBoard();
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 7, 0, PieceType.ROOK, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
      board.castlingRights.whiteQueenside = true;

      const move: Move = { from: { row: 7, col: 4 }, to: { row: 7, col: 2 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.squares[7][2]).toEqual({ type: PieceType.KING, color: Color.WHITE });
      expect(result.board.squares[7][3]).toEqual({ type: PieceType.ROOK, color: Color.WHITE });
      expect(result.board.squares[7][4]).toBeNull();
      expect(result.board.squares[7][0]).toBeNull();
    });

    it('handles black kingside castling', () => {
      const board = emptyBoard(Color.BLACK);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
      placePiece(board, 0, 7, PieceType.ROOK, Color.BLACK);
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      board.castlingRights.blackKingside = true;

      const move: Move = { from: { row: 0, col: 4 }, to: { row: 0, col: 6 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.squares[0][6]).toEqual({ type: PieceType.KING, color: Color.BLACK });
      expect(result.board.squares[0][5]).toEqual({ type: PieceType.ROOK, color: Color.BLACK });
      expect(result.board.squares[0][4]).toBeNull();
      expect(result.board.squares[0][7]).toBeNull();
    });
  });

  describe('castling rights revocation', () => {
    it('revokes both castling rights when king moves', () => {
      const board = emptyBoard();
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
      board.castlingRights.whiteKingside = true;
      board.castlingRights.whiteQueenside = true;

      const move: Move = { from: { row: 7, col: 4 }, to: { row: 7, col: 5 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.castlingRights.whiteKingside).toBe(false);
      expect(result.board.castlingRights.whiteQueenside).toBe(false);
    });

    it('revokes kingside right when kingside rook moves', () => {
      const board = emptyBoard();
      placePiece(board, 7, 7, PieceType.ROOK, Color.WHITE);
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
      board.castlingRights.whiteKingside = true;
      board.castlingRights.whiteQueenside = true;

      const move: Move = { from: { row: 7, col: 7 }, to: { row: 5, col: 7 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.castlingRights.whiteKingside).toBe(false);
      expect(result.board.castlingRights.whiteQueenside).toBe(true);
    });

    it('revokes castling right when rook is captured on its starting square', () => {
      const board = emptyBoard();
      placePiece(board, 4, 4, PieceType.QUEEN, Color.WHITE);
      placePiece(board, 0, 7, PieceType.ROOK, Color.BLACK);
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
      board.castlingRights.blackKingside = true;

      const move: Move = { from: { row: 4, col: 4 }, to: { row: 0, col: 7 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.castlingRights.blackKingside).toBe(false);
    });
  });

  describe('pawn promotion', () => {
    it('promotes pawn to queen by default', () => {
      const board = emptyBoard();
      placePiece(board, 1, 4, PieceType.PAWN, Color.WHITE);
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 0, 0, PieceType.KING, Color.BLACK);

      const move: Move = { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: PieceType.QUEEN };
      const result = executeMove(board, move);

      expect(result.board.squares[0][4]).toEqual({ type: PieceType.QUEEN, color: Color.WHITE });
      expect(result.board.squares[1][4]).toBeNull();
    });

    it('promotes pawn to knight when specified', () => {
      const board = emptyBoard();
      placePiece(board, 1, 4, PieceType.PAWN, Color.WHITE);
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 0, 0, PieceType.KING, Color.BLACK);

      const move: Move = { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: PieceType.KNIGHT };
      const result = executeMove(board, move);

      expect(result.board.squares[0][4]).toEqual({ type: PieceType.KNIGHT, color: Color.WHITE });
    });
  });

  describe('move history', () => {
    it('adds a MoveRecord to moveHistory', () => {
      const board = initializeBoard();
      const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.moveHistory).toHaveLength(1);
      expect(result.board.moveHistory[0].move.from).toEqual({ row: 6, col: 4 });
      expect(result.board.moveHistory[0].move.to).toEqual({ row: 4, col: 4 });
      expect(result.board.moveHistory[0].capturedPiece).toBeNull();
    });
  });

  describe('halfMoveClock', () => {
    it('resets on pawn move', () => {
      const board = initializeBoard();
      board.halfMoveClock = 5;
      const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.halfMoveClock).toBe(0);
    });

    it('increments on non-pawn non-capture move', () => {
      const board = emptyBoard();
      placePiece(board, 7, 1, PieceType.KNIGHT, Color.WHITE);
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
      board.halfMoveClock = 3;

      const move: Move = { from: { row: 7, col: 1 }, to: { row: 5, col: 2 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.halfMoveClock).toBe(4);
    });
  });

  describe('fullMoveNumber', () => {
    it('does not increment after white move', () => {
      const board = initializeBoard();
      const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.fullMoveNumber).toBe(1);
    });

    it('increments after black move', () => {
      const board = initializeBoard();
      board.currentTurn = Color.BLACK;
      const move: Move = { from: { row: 1, col: 4 }, to: { row: 3, col: 4 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.board.fullMoveNumber).toBe(2);
    });
  });

  describe('check detection', () => {
    it('detects when opponent king is in check after move', () => {
      const board = emptyBoard();
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 7, 0, PieceType.ROOK, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);

      // Move rook to e-file to give check along the file
      const move: Move = { from: { row: 7, col: 0 }, to: { row: 7, col: 4 }, promotion: null };
      // King must move out of the way first — let's use a different setup
      const board2 = emptyBoard();
      placePiece(board2, 7, 0, PieceType.KING, Color.WHITE);
      placePiece(board2, 6, 4, PieceType.ROOK, Color.WHITE);
      placePiece(board2, 0, 4, PieceType.KING, Color.BLACK);

      // Move rook from e2 to e8-adjacent (e7 = row 1)
      const move2: Move = { from: { row: 6, col: 4 }, to: { row: 1, col: 4 }, promotion: null };
      const result = executeMove(board2, move2);

      // Rook on e7 checks king on e8 along the file
      expect(result.wasCheck).toBe(true);
    });

    it('reports no check when move does not threaten king', () => {
      const board = emptyBoard();
      placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
      placePiece(board, 7, 0, PieceType.ROOK, Color.WHITE);
      placePiece(board, 0, 4, PieceType.KING, Color.BLACK);

      // Move rook to a3 — doesn't check king on e8
      const move: Move = { from: { row: 7, col: 0 }, to: { row: 5, col: 0 }, promotion: null };
      const result = executeMove(board, move);

      expect(result.wasCheck).toBe(false);
    });
  });
});

describe('simulateMove', () => {
  it('returns a new board without mutating the original', () => {
    const board = initializeBoard();
    const original = cloneBoard(board);
    const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };

    const result = simulateMove(board, move);

    // Original unchanged
    expect(board).toEqual(original);
    // Result has the move applied
    expect(result.squares[4][4]).toEqual({ type: PieceType.PAWN, color: Color.WHITE });
    expect(result.squares[6][4]).toBeNull();
  });

  it('switches the turn', () => {
    const board = initializeBoard();
    const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
    const result = simulateMove(board, move);

    expect(result.currentTurn).toBe(Color.BLACK);
  });

  it('handles en passant capture', () => {
    const board = emptyBoard();
    placePiece(board, 3, 4, PieceType.PAWN, Color.WHITE);
    placePiece(board, 3, 3, PieceType.PAWN, Color.BLACK);
    placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
    placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
    board.enPassantTarget = { row: 2, col: 3 };

    const result = simulateMove(board, { from: { row: 3, col: 4 }, to: { row: 2, col: 3 }, promotion: null });

    expect(result.squares[2][3]).toEqual({ type: PieceType.PAWN, color: Color.WHITE });
    expect(result.squares[3][3]).toBeNull();
  });

  it('handles castling rook movement', () => {
    const board = emptyBoard();
    placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
    placePiece(board, 7, 7, PieceType.ROOK, Color.WHITE);
    placePiece(board, 0, 4, PieceType.KING, Color.BLACK);
    board.castlingRights.whiteKingside = true;

    const result = simulateMove(board, { from: { row: 7, col: 4 }, to: { row: 7, col: 6 }, promotion: null });

    expect(result.squares[7][6]).toEqual({ type: PieceType.KING, color: Color.WHITE });
    expect(result.squares[7][5]).toEqual({ type: PieceType.ROOK, color: Color.WHITE });
    expect(result.squares[7][7]).toBeNull();
  });

  it('handles pawn promotion', () => {
    const board = emptyBoard();
    placePiece(board, 1, 4, PieceType.PAWN, Color.WHITE);
    placePiece(board, 7, 4, PieceType.KING, Color.WHITE);
    placePiece(board, 0, 0, PieceType.KING, Color.BLACK);

    const result = simulateMove(board, { from: { row: 1, col: 4 }, to: { row: 0, col: 4 }, promotion: PieceType.QUEEN });

    expect(result.squares[0][4]).toEqual({ type: PieceType.QUEEN, color: Color.WHITE });
  });

  it('does NOT update moveHistory', () => {
    const board = initializeBoard();
    const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
    const result = simulateMove(board, move);

    expect(result.moveHistory).toHaveLength(0);
  });

  it('does NOT update halfMoveClock or fullMoveNumber', () => {
    const board = initializeBoard();
    board.halfMoveClock = 5;
    board.fullMoveNumber = 10;
    const move: Move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
    const result = simulateMove(board, move);

    expect(result.halfMoveClock).toBe(5);
    expect(result.fullMoveNumber).toBe(10);
  });
});
