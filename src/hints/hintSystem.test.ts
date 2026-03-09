import { describe, it, expect } from 'vitest';
import { generateHint, getHintExplanation } from './hintSystem';
import { initializeBoard } from '../engine/board';
import { executeMove } from '../engine/execute';
import { getAllLegalMoves } from '../engine/moves';
import { Board, Color, Piece, PieceType } from '../engine/types';

/** Helper: create an empty board with just kings. */
function emptyBoardWithKings(): Board {
  const squares: (Piece | null)[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  );
  squares[0][4] = { type: PieceType.KING, color: Color.BLACK };
  squares[7][4] = { type: PieceType.KING, color: Color.WHITE };

  return {
    squares,
    currentTurn: Color.WHITE,
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

describe('generateHint', () => {
  it('returns a legal move from the starting position', () => {
    const board = initializeBoard();
    const hint = generateHint(board, Color.WHITE);

    expect(hint).not.toBeNull();
    const legalMoves = getAllLegalMoves(board, Color.WHITE);
    const isLegal = legalMoves.some(
      (m) =>
        m.from.row === hint!.suggestedMove.from.row &&
        m.from.col === hint!.suggestedMove.from.col &&
        m.to.row === hint!.suggestedMove.to.row &&
        m.to.col === hint!.suggestedMove.to.col,
    );
    expect(isLegal).toBe(true);
  });

  it('returns null when no legal moves exist', () => {
    // Stalemate position: black king cornered with no moves
    const board = emptyBoardWithKings();
    board.squares[7][4] = null; // remove white king from default
    board.squares[0][4] = null; // remove black king from default
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };
    board.squares[2][1] = { type: PieceType.QUEEN, color: Color.WHITE };
    board.squares[2][0] = { type: PieceType.KING, color: Color.WHITE };
    board.currentTurn = Color.BLACK;

    const legalMoves = getAllLegalMoves(board, Color.BLACK);
    if (legalMoves.length === 0) {
      const hint = generateHint(board, Color.BLACK);
      expect(hint).toBeNull();
    }
  });

  it('prefers capturing a high-value piece', () => {
    const board = emptyBoardWithKings();
    board.currentTurn = Color.WHITE;

    // White queen at d4 can capture black rook at d8 or black pawn at a4
    board.squares[4][3] = { type: PieceType.QUEEN, color: Color.WHITE };
    board.squares[0][3] = { type: PieceType.ROOK, color: Color.BLACK };
    board.squares[4][0] = { type: PieceType.PAWN, color: Color.BLACK };

    const hint = generateHint(board, Color.WHITE);
    expect(hint).not.toBeNull();
    // Should prefer capturing the rook (value 5) over the pawn (value 1)
    expect(hint!.suggestedMove.to.row).toBe(0);
    expect(hint!.suggestedMove.to.col).toBe(3);
  });

  it('suggests checkmate when available', () => {
    // Classic back-rank mate: black king on g8, pawns on f7/g7/h7, white rook delivers Rd8#
    const board = emptyBoardWithKings();
    board.currentTurn = Color.WHITE;
    board.squares[0][4] = null;
    board.squares[0][6] = { type: PieceType.KING, color: Color.BLACK };
    board.squares[1][5] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][6] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][7] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[7][3] = { type: PieceType.ROOK, color: Color.WHITE };

    const hint = generateHint(board, Color.WHITE);
    expect(hint).not.toBeNull();
    expect(hint!.confidence).toBe(1.0);
    expect(hint!.explanation).toBe('This move gives checkmate!');
  });

  it('returns confidence between 0 and 1', () => {
    const board = initializeBoard();
    const hint = generateHint(board, Color.WHITE);
    expect(hint).not.toBeNull();
    expect(hint!.confidence).toBeGreaterThanOrEqual(0);
    expect(hint!.confidence).toBeLessThanOrEqual(1);
  });

  it('works for BLACK player', () => {
    const board = initializeBoard();
    // Make a white move first so it's black's turn
    const result = executeMove(board, {
      from: { row: 6, col: 4 },
      to: { row: 4, col: 4 },
      promotion: null,
    });

    const hint = generateHint(result.board, Color.BLACK);
    expect(hint).not.toBeNull();
    const legalMoves = getAllLegalMoves(result.board, Color.BLACK);
    const isLegal = legalMoves.some(
      (m) =>
        m.from.row === hint!.suggestedMove.from.row &&
        m.from.col === hint!.suggestedMove.from.col &&
        m.to.row === hint!.suggestedMove.to.row &&
        m.to.col === hint!.suggestedMove.to.col,
    );
    expect(isLegal).toBe(true);
  });

  it('generates explanation in zh-TW when lang is specified', () => {
    const board = initializeBoard();
    const hint = generateHint(board, Color.WHITE, 'zh-TW');
    expect(hint).not.toBeNull();
    // Should be a Chinese string
    expect(hint!.explanation).toBe('把你的棋子移到更好的位置！');
  });
});

describe('getHintExplanation', () => {
  it('returns capture explanation in English', () => {
    const board = emptyBoardWithKings();
    board.currentTurn = Color.WHITE;
    board.squares[3][3] = { type: PieceType.PAWN, color: Color.BLACK };

    const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 }, promotion: null };
    // Place a white piece that can capture
    board.squares[4][4] = { type: PieceType.BISHOP, color: Color.WHITE };

    const explanation = getHintExplanation(move, board, 'en');
    expect(explanation).toBe('Try capturing that piece!');
  });

  it('returns capture explanation in zh-TW', () => {
    const board = emptyBoardWithKings();
    board.currentTurn = Color.WHITE;
    board.squares[3][3] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[4][4] = { type: PieceType.BISHOP, color: Color.WHITE };

    const move = { from: { row: 4, col: 4 }, to: { row: 3, col: 3 }, promotion: null };
    const explanation = getHintExplanation(move, board, 'zh-TW');
    expect(explanation).toBe('試試吃掉那個棋子！');
  });

  it('returns positional explanation when no capture', () => {
    const board = initializeBoard();
    const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
    const explanation = getHintExplanation(move, board, 'en');
    expect(explanation).toBe('Move your piece to a better position!');
  });

  it('returns positional explanation in zh-TW when no capture', () => {
    const board = initializeBoard();
    const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
    const explanation = getHintExplanation(move, board, 'zh-TW');
    expect(explanation).toBe('把你的棋子移到更好的位置！');
  });

  it('returns checkmate explanation when move leads to checkmate', () => {
    // Classic back-rank mate setup
    const board = emptyBoardWithKings();
    board.currentTurn = Color.WHITE;
    // Black king on g8
    board.squares[0][4] = null;
    board.squares[0][6] = { type: PieceType.KING, color: Color.BLACK };
    // Black pawns blocking escape on f7, g7, h7
    board.squares[1][5] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][6] = { type: PieceType.PAWN, color: Color.BLACK };
    board.squares[1][7] = { type: PieceType.PAWN, color: Color.BLACK };
    // White rook on d1 can deliver Rd8#
    board.squares[7][3] = { type: PieceType.ROOK, color: Color.WHITE };

    const mateMove = { from: { row: 7, col: 3 }, to: { row: 0, col: 3 }, promotion: null };

    const explanation = getHintExplanation(mateMove, board, 'en');
    expect(explanation).toBe('This move gives checkmate!');
  });

  it('defaults to English when lang is not specified', () => {
    const board = initializeBoard();
    const move = { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null };
    const explanation = getHintExplanation(move, board);
    expect(explanation).toBe('Move your piece to a better position!');
  });
});
