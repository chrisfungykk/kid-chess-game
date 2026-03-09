import { describe, it, expect } from 'vitest';
import { initializeBoard, isValidPosition, getPiece, cloneBoard } from './board';
import { Color, PieceType } from './types';

describe('isValidPosition', () => {
  it('returns true for all valid positions (0-7)', () => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        expect(isValidPosition({ row, col })).toBe(true);
      }
    }
  });

  it('returns false for negative row', () => {
    expect(isValidPosition({ row: -1, col: 0 })).toBe(false);
  });

  it('returns false for negative col', () => {
    expect(isValidPosition({ row: 0, col: -1 })).toBe(false);
  });

  it('returns false for row >= 8', () => {
    expect(isValidPosition({ row: 8, col: 0 })).toBe(false);
  });

  it('returns false for col >= 8', () => {
    expect(isValidPosition({ row: 0, col: 8 })).toBe(false);
  });
});

describe('initializeBoard', () => {
  const board = initializeBoard();

  it('has 32 pieces total', () => {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board.squares[r][c] !== null) count++;
      }
    }
    expect(count).toBe(32);
  });

  it('has white to move first', () => {
    expect(board.currentTurn).toBe(Color.WHITE);
  });

  it('has empty move history', () => {
    expect(board.moveHistory).toHaveLength(0);
  });

  it('has all castling rights enabled', () => {
    expect(board.castlingRights).toEqual({
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    });
  });

  it('has no en passant target', () => {
    expect(board.enPassantTarget).toBeNull();
  });

  it('places black back rank correctly', () => {
    const expected: PieceType[] = [
      PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
      PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK,
    ];
    for (let col = 0; col < 8; col++) {
      const piece = board.squares[0][col];
      expect(piece).not.toBeNull();
      expect(piece!.type).toBe(expected[col]);
      expect(piece!.color).toBe(Color.BLACK);
    }
  });

  it('places black pawns on row 1', () => {
    for (let col = 0; col < 8; col++) {
      const piece = board.squares[1][col];
      expect(piece).not.toBeNull();
      expect(piece!.type).toBe(PieceType.PAWN);
      expect(piece!.color).toBe(Color.BLACK);
    }
  });

  it('has empty rows 2-5', () => {
    for (let row = 2; row <= 5; row++) {
      for (let col = 0; col < 8; col++) {
        expect(board.squares[row][col]).toBeNull();
      }
    }
  });

  it('places white pawns on row 6', () => {
    for (let col = 0; col < 8; col++) {
      const piece = board.squares[6][col];
      expect(piece).not.toBeNull();
      expect(piece!.type).toBe(PieceType.PAWN);
      expect(piece!.color).toBe(Color.WHITE);
    }
  });

  it('places white back rank correctly', () => {
    const expected: PieceType[] = [
      PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
      PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK,
    ];
    for (let col = 0; col < 8; col++) {
      const piece = board.squares[7][col];
      expect(piece).not.toBeNull();
      expect(piece!.type).toBe(expected[col]);
      expect(piece!.color).toBe(Color.WHITE);
    }
  });

  it('has exactly one white king and one black king', () => {
    let whiteKings = 0;
    let blackKings = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board.squares[r][c];
        if (p?.type === PieceType.KING) {
          if (p.color === Color.WHITE) whiteKings++;
          else blackKings++;
        }
      }
    }
    expect(whiteKings).toBe(1);
    expect(blackKings).toBe(1);
  });
});

describe('getPiece', () => {
  const board = initializeBoard();

  it('returns the piece at a valid occupied position', () => {
    const piece = getPiece(board, { row: 0, col: 4 });
    expect(piece).toEqual({ type: PieceType.KING, color: Color.BLACK });
  });

  it('returns null for an empty square', () => {
    expect(getPiece(board, { row: 4, col: 4 })).toBeNull();
  });

  it('returns null for an out-of-bounds position', () => {
    expect(getPiece(board, { row: -1, col: 0 })).toBeNull();
    expect(getPiece(board, { row: 0, col: 8 })).toBeNull();
  });
});

describe('cloneBoard', () => {
  it('produces an equal but independent copy', () => {
    const original = initializeBoard();
    const clone = cloneBoard(original);

    // Structurally equal
    expect(clone).toEqual(original);

    // Mutating clone squares does not affect original
    clone.squares[4][4] = { type: PieceType.PAWN, color: Color.WHITE };
    expect(original.squares[4][4]).toBeNull();
  });

  it('deep-clones pieces so piece mutations are independent', () => {
    const original = initializeBoard();
    const clone = cloneBoard(original);

    clone.squares[0][0]!.type = PieceType.QUEEN;
    expect(original.squares[0][0]!.type).toBe(PieceType.ROOK);
  });

  it('deep-clones castling rights', () => {
    const original = initializeBoard();
    const clone = cloneBoard(original);

    clone.castlingRights.whiteKingside = false;
    expect(original.castlingRights.whiteKingside).toBe(true);
  });

  it('deep-clones enPassantTarget', () => {
    const original = initializeBoard();
    original.enPassantTarget = { row: 2, col: 3 };
    const clone = cloneBoard(original);

    clone.enPassantTarget!.row = 5;
    expect(original.enPassantTarget.row).toBe(2);
  });

  it('deep-clones moveHistory', () => {
    const original = initializeBoard();
    original.moveHistory.push({
      move: { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null },
      capturedPiece: null,
      wasCheck: false,
      notation: 'e4',
    });
    const clone = cloneBoard(original);

    clone.moveHistory[0].move.to.row = 3;
    expect(original.moveHistory[0].move.to.row).toBe(4);
  });
});
