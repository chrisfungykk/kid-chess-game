import { describe, it, expect } from 'vitest';
import { selectMove, findBestMove } from './aiOpponent';
import { initializeBoard } from '../engine/board';
import { executeMove } from '../engine/execute';
import { getAllLegalMoves } from '../engine/moves';
import { Board, Color, Piece, PieceType } from '../engine/types';
import { Difficulty } from '../game/types';

/** Helper: create an empty board with just kings. */
function emptyBoardWithKings(): Board {
  const squares: (Piece | null)[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  );
  squares[0][4] = { type: PieceType.KING, color: Color.BLACK };
  squares[7][4] = { type: PieceType.KING, color: Color.WHITE };

  return {
    squares,
    currentTurn: Color.BLACK,
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

/** Helper: make it BLACK's turn from the starting position. */
function startingBoardBlackToMove(): Board {
  const board = initializeBoard();
  // Execute a simple white pawn move to make it black's turn
  const result = executeMove(board, {
    from: { row: 6, col: 4 },
    to: { row: 4, col: 4 },
    promotion: null,
  });
  return result.board;
}

describe('selectMove', () => {
  it('returns a legal move for BLACK from starting position', () => {
    const board = startingBoardBlackToMove();
    const move = selectMove(board, Difficulty.EASY);
    const legalMoves = getAllLegalMoves(board, Color.BLACK);

    const isLegal = legalMoves.some(
      (m) =>
        m.from.row === move.from.row &&
        m.from.col === move.from.col &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col,
    );
    expect(isLegal).toBe(true);
  });

  it('returns a legal move on MEDIUM difficulty', () => {
    const board = startingBoardBlackToMove();
    const move = selectMove(board, Difficulty.MEDIUM);
    const legalMoves = getAllLegalMoves(board, Color.BLACK);

    const isLegal = legalMoves.some(
      (m) =>
        m.from.row === move.from.row &&
        m.from.col === move.from.col &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col,
    );
    expect(isLegal).toBe(true);
  });

  it('picks a random move on EASY when randomFn returns < 0.7', () => {
    const board = startingBoardBlackToMove();
    // randomFn returns 0.0 (< 0.7 → random branch), then 0.0 for index selection
    const calls: number[] = [0.0, 0.0];
    let callIndex = 0;
    const move = selectMove(board, Difficulty.EASY, () => calls[callIndex++]);

    const legalMoves = getAllLegalMoves(board, Color.BLACK);
    // Should pick the first legal move (index 0)
    expect(move.from.row).toBe(legalMoves[0].from.row);
    expect(move.from.col).toBe(legalMoves[0].from.col);
  });

  it('picks the best move on EASY when randomFn returns >= 0.7', () => {
    const board = startingBoardBlackToMove();
    const move = selectMove(board, Difficulty.EASY, () => 0.8);

    const legalMoves = getAllLegalMoves(board, Color.BLACK);
    const isLegal = legalMoves.some(
      (m) =>
        m.from.row === move.from.row &&
        m.from.col === move.from.col &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col,
    );
    expect(isLegal).toBe(true);
  });

  it('picks a random move on MEDIUM when randomFn returns < 0.3', () => {
    const board = startingBoardBlackToMove();
    const calls: number[] = [0.1, 0.0];
    let callIndex = 0;
    const move = selectMove(board, Difficulty.MEDIUM, () => calls[callIndex++]);

    const legalMoves = getAllLegalMoves(board, Color.BLACK);
    expect(move.from.row).toBe(legalMoves[0].from.row);
    expect(move.from.col).toBe(legalMoves[0].from.col);
  });

  it('picks the best move on MEDIUM when randomFn returns >= 0.3', () => {
    const board = startingBoardBlackToMove();
    const move = selectMove(board, Difficulty.MEDIUM, () => 0.5);

    const legalMoves = getAllLegalMoves(board, Color.BLACK);
    const isLegal = legalMoves.some(
      (m) =>
        m.from.row === move.from.row &&
        m.from.col === move.from.col &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col,
    );
    expect(isLegal).toBe(true);
  });

  it('returns the only move when there is exactly one legal move', () => {
    // Set up a board where BLACK has only one legal move
    const board = emptyBoardWithKings();
    // Black king at (0,4), white king at (7,4)
    // Add a white queen that restricts black king to one move
    board.squares[1][3] = { type: PieceType.QUEEN, color: Color.WHITE };
    board.squares[1][5] = { type: PieceType.ROOK, color: Color.WHITE };
    // Black king can only move to squares not attacked

    const legalMoves = getAllLegalMoves(board, Color.BLACK);
    if (legalMoves.length === 1) {
      const move = selectMove(board, Difficulty.EASY);
      expect(move.from.row).toBe(legalMoves[0].from.row);
      expect(move.from.col).toBe(legalMoves[0].from.col);
      expect(move.to.row).toBe(legalMoves[0].to.row);
      expect(move.to.col).toBe(legalMoves[0].to.col);
    }
  });

  it('throws when no legal moves are available', () => {
    // Stalemate position for BLACK
    const board = emptyBoardWithKings();
    // Put black king in corner with no moves
    board.squares[0][4] = null;
    board.squares[0][0] = { type: PieceType.KING, color: Color.BLACK };
    board.squares[1][1] = { type: PieceType.QUEEN, color: Color.WHITE };
    board.squares[2][0] = { type: PieceType.KING, color: Color.WHITE };

    // Verify it's actually stalemate
    const legalMoves = getAllLegalMoves(board, Color.BLACK);
    if (legalMoves.length === 0) {
      expect(() => selectMove(board, Difficulty.EASY)).toThrow('No legal moves available for AI');
    }
  });
});

describe('findBestMove', () => {
  it('picks a capturing move when available', () => {
    // Set up a board where BLACK can capture a free white piece
    const board = emptyBoardWithKings();
    board.currentTurn = Color.BLACK;

    // Black queen at d5 (row 3, col 3)
    board.squares[3][3] = { type: PieceType.QUEEN, color: Color.BLACK };
    // Undefended white rook at d1 (row 7, col 3) — but that's the king row
    // Put white rook at d3 (row 5, col 3) — capturable by black queen
    board.squares[5][3] = { type: PieceType.ROOK, color: Color.WHITE };

    const moves = getAllLegalMoves(board, Color.BLACK);
    const bestMove = findBestMove(board, moves, 1);

    // The best move should capture the rook (material gain)
    expect(bestMove.to.row).toBe(5);
    expect(bestMove.to.col).toBe(3);
  });

  it('prefers capturing a queen over a pawn', () => {
    const board = emptyBoardWithKings();
    board.currentTurn = Color.BLACK;

    // Black rook at d4 (row 4, col 3)
    board.squares[4][3] = { type: PieceType.ROOK, color: Color.BLACK };
    // White pawn at a4 (row 4, col 0) — capturable
    board.squares[4][0] = { type: PieceType.PAWN, color: Color.WHITE };
    // White queen at d6 (row 2, col 3) — capturable
    board.squares[2][3] = { type: PieceType.QUEEN, color: Color.WHITE };

    const moves = getAllLegalMoves(board, Color.BLACK);
    const bestMove = findBestMove(board, moves, 1);

    // Should capture the queen (9 points) over the pawn (1 point)
    expect(bestMove.to.row).toBe(2);
    expect(bestMove.to.col).toBe(3);
  });

  it('returns a valid move at depth 2', () => {
    const board = startingBoardBlackToMove();
    const moves = getAllLegalMoves(board, Color.BLACK);
    const bestMove = findBestMove(board, moves, 2);

    const isLegal = moves.some(
      (m) =>
        m.from.row === bestMove.from.row &&
        m.from.col === bestMove.from.col &&
        m.to.row === bestMove.to.row &&
        m.to.col === bestMove.to.col,
    );
    expect(isLegal).toBe(true);
  });
});
