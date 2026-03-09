import { describe, it, expect } from 'vitest';
import { evaluatePosition, PIECE_VALUES } from './evaluation';
import { initializeBoard, cloneBoard } from './board';
import { Board, Color, PieceType } from './types';

/** Helper to create an empty board for custom setups. */
function emptyBoard(): Board {
  const board = initializeBoard();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      board.squares[r][c] = null;
    }
  }
  return board;
}

describe('evaluatePosition', () => {
  it('should return approximately 0 for the initial position', () => {
    const board = initializeBoard();
    const score = evaluatePosition(board);
    // Symmetric position — score should be 0 (no positional asymmetry at start)
    expect(score).toBe(0);
  });

  it('should return a positive score when white has material advantage', () => {
    const board = emptyBoard();
    // White king + queen vs Black king only
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[4][4] = { type: PieceType.QUEEN, color: Color.WHITE };
    board.squares[0][4] = { type: PieceType.KING, color: Color.BLACK };

    const score = evaluatePosition(board);
    expect(score).toBeGreaterThan(0);
  });

  it('should return a negative score when black has material advantage', () => {
    const board = emptyBoard();
    // White king only vs Black king + queen
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[0][4] = { type: PieceType.KING, color: Color.BLACK };
    board.squares[3][3] = { type: PieceType.QUEEN, color: Color.BLACK };

    const score = evaluatePosition(board);
    expect(score).toBeLessThan(0);
  });

  it('should reflect correct piece values in material difference', () => {
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[0][4] = { type: PieceType.KING, color: Color.BLACK };
    // Give white an extra rook on a non-center, non-starting square
    board.squares[7][0] = { type: PieceType.ROOK, color: Color.WHITE };

    const score = evaluatePosition(board);
    // Material diff = 5 (rook), no center or development bonuses for rook
    expect(score).toBe(PIECE_VALUES[PieceType.ROOK]);
  });

  it('should give center control bonus for pieces on center squares', () => {
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[0][4] = { type: PieceType.KING, color: Color.BLACK };

    // White pawn on e4 (center)
    board.squares[4][4] = { type: PieceType.PAWN, color: Color.WHITE };
    const scoreWithCenter = evaluatePosition(board);

    // White pawn on a3 (not center)
    const board2 = cloneBoard(board);
    board2.squares[4][4] = null;
    board2.squares[5][0] = { type: PieceType.PAWN, color: Color.WHITE };
    const scoreWithoutCenter = evaluatePosition(board2);

    // Center pawn should score higher
    expect(scoreWithCenter).toBeGreaterThan(scoreWithoutCenter);
  });

  it('should give development bonus for knights/bishops off starting squares', () => {
    const board = emptyBoard();
    board.squares[7][4] = { type: PieceType.KING, color: Color.WHITE };
    board.squares[0][4] = { type: PieceType.KING, color: Color.BLACK };

    // Knight on starting square (7,1)
    board.squares[7][1] = { type: PieceType.KNIGHT, color: Color.WHITE };
    const scoreUndeveloped = evaluatePosition(board);

    // Move knight to f3 (5,5) — off starting square, not center
    const board2 = cloneBoard(board);
    board2.squares[7][1] = null;
    board2.squares[5][5] = { type: PieceType.KNIGHT, color: Color.WHITE };
    const scoreDeveloped = evaluatePosition(board2);

    // Developed knight should score higher
    expect(scoreDeveloped).toBeGreaterThan(scoreUndeveloped);
  });

  it('should export correct piece values', () => {
    expect(PIECE_VALUES[PieceType.PAWN]).toBe(1);
    expect(PIECE_VALUES[PieceType.KNIGHT]).toBe(3);
    expect(PIECE_VALUES[PieceType.BISHOP]).toBe(3);
    expect(PIECE_VALUES[PieceType.ROOK]).toBe(5);
    expect(PIECE_VALUES[PieceType.QUEEN]).toBe(9);
    expect(PIECE_VALUES[PieceType.KING]).toBe(0);
  });
});
