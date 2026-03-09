import { Board, Color, PieceType } from './types';
import { isSquareAttacked, getAllLegalMoves } from './moves';
import { GameStatus } from '../game/types';

/**
 * Find the king position for a given color.
 */
function findKing(board: Board, color: Color): { row: number; col: number } | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board.squares[row][col];
      if (piece && piece.type === PieceType.KING && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Check if the given color's king is currently in check.
 */
export function isCheck(board: Board, color: Color): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor = color === Color.WHITE ? Color.BLACK : Color.WHITE;
  return isSquareAttacked(board, kingPos, opponentColor);
}

/**
 * Check if the given color is in checkmate:
 * the king is in check AND there are no legal moves.
 */
export function isCheckmate(board: Board, color: Color): boolean {
  if (!isCheck(board, color)) return false;
  return getAllLegalMoves(board, color).length === 0;
}

/**
 * Check if the given color is in stalemate:
 * the king is NOT in check AND there are no legal moves.
 */
export function isStalemate(board: Board, color: Color): boolean {
  if (isCheck(board, color)) return false;
  return getAllLegalMoves(board, color).length === 0;
}

/**
 * Determine the game status for the given color.
 */
export function checkGameStatus(board: Board, color: Color): GameStatus {
  if (isCheckmate(board, color)) return GameStatus.CHECKMATE;
  if (isStalemate(board, color)) return GameStatus.STALEMATE;
  if (isCheck(board, color)) return GameStatus.CHECK;
  return GameStatus.IN_PROGRESS;
}
