import { Board, Color, PieceType } from './types';

/**
 * Material values for each piece type used in position evaluation.
 * King has no material value since it can't be captured.
 */
export const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.PAWN]: 1,
  [PieceType.KNIGHT]: 3,
  [PieceType.BISHOP]: 3,
  [PieceType.ROOK]: 5,
  [PieceType.QUEEN]: 9,
  [PieceType.KING]: 0,
};

/** Bonus for a piece occupying a center square (d4/d5/e4/e5). */
const CENTER_CONTROL_BONUS = 0.3;

/** Bonus for a knight or bishop that has moved off its starting square. */
const DEVELOPMENT_BONUS = 0.2;

/**
 * Starting positions for knights and bishops (row, col) per color.
 * White: knights on (7,1),(7,6), bishops on (7,2),(7,5)
 * Black: knights on (0,1),(0,6), bishops on (0,2),(0,5)
 */
const STARTING_SQUARES: Record<Color, { row: number; col: number }[]> = {
  [Color.WHITE]: [
    { row: 7, col: 1 },
    { row: 7, col: 6 },
    { row: 7, col: 2 },
    { row: 7, col: 5 },
  ],
  [Color.BLACK]: [
    { row: 0, col: 1 },
    { row: 0, col: 6 },
    { row: 0, col: 2 },
    { row: 0, col: 5 },
  ],
};

function isCenterSquare(row: number, col: number): boolean {
  return row >= 3 && row <= 4 && col >= 3 && col <= 4;
}

function isOnStartingSquare(row: number, col: number, color: Color): boolean {
  return STARTING_SQUARES[color].some(sq => sq.row === row && sq.col === col);
}

/**
 * Evaluate a board position and return a numeric score.
 * Positive = white advantage, negative = black advantage.
 *
 * Evaluation factors:
 * - Material counting using PIECE_VALUES
 * - Center control bonus for pieces on d4/d5/e4/e5
 * - Development bonus for knights/bishops off starting squares
 */
export function evaluatePosition(board: Board): number {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board.squares[row][col];
      if (!piece) continue;

      const sign = piece.color === Color.WHITE ? 1 : -1;

      // Material value
      score += sign * PIECE_VALUES[piece.type];

      // Center control bonus
      if (isCenterSquare(row, col)) {
        score += sign * CENTER_CONTROL_BONUS;
      }

      // Development bonus for knights and bishops off starting squares
      if (
        (piece.type === PieceType.KNIGHT || piece.type === PieceType.BISHOP) &&
        !isOnStartingSquare(row, col, piece.color)
      ) {
        score += sign * DEVELOPMENT_BONUS;
      }
    }
  }

  return score;
}
