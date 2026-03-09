import { Board, Color, Move } from '../engine/types';
import { getAllLegalMoves } from '../engine/moves';
import { simulateMove } from '../engine/execute';
import { evaluatePosition, PIECE_VALUES } from '../engine/evaluation';
import { isCheckmate } from '../engine/detection';
import { getPiece } from '../engine/board';
import { HintResult } from './types';

/**
 * Get the opposite color.
 */
function oppositeColor(color: Color): Color {
  return color === Color.WHITE ? Color.BLACK : Color.WHITE;
}

/**
 * Direction multiplier: WHITE wants positive scores, BLACK wants negative.
 */
function directionMultiplier(color: Color): number {
  return color === Color.WHITE ? 1 : -1;
}

/**
 * Normalize a raw score to a confidence value between 0.0 and 1.0.
 * Uses a sigmoid-like mapping so extreme scores saturate near 0 or 1.
 */
function normalizeScore(score: number): number {
  if (!isFinite(score)) return 1.0;
  // Map score through a sigmoid: 1 / (1 + e^(-score))
  const normalized = 1 / (1 + Math.exp(-score));
  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Generate a hint for the given player by evaluating all legal moves
 * and picking the highest-scored one.
 *
 * Returns null if no legal moves are available.
 */
export function generateHint(board: Board, playerColor: Color, lang: string = 'en'): HintResult | null {
  const allMoves = getAllLegalMoves(board, playerColor);
  if (allMoves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove: Move = allMoves[0];
  const opponent = oppositeColor(playerColor);

  for (const move of allMoves) {
    const simulatedBoard = simulateMove(board, move);
    let score = evaluatePosition(simulatedBoard) * directionMultiplier(playerColor);

    // Bonus for captures
    const capturedPiece = getPiece(board, move.to);
    if (capturedPiece && capturedPiece.color !== playerColor) {
      score += PIECE_VALUES[capturedPiece.type] * 0.1;
    }

    // Bonus for checkmate
    if (isCheckmate(simulatedBoard, opponent)) {
      score = Infinity;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  const explanation = getHintExplanation(bestMove, board, lang);
  const confidence = normalizeScore(bestScore);

  return {
    suggestedMove: bestMove,
    explanation,
    confidence,
  };
}

/**
 * Generate a kid-friendly explanation for a suggested move.
 * Supports "en" (English) and "zh-TW" (Traditional Chinese).
 */
export function getHintExplanation(move: Move, board: Board, lang: string = 'en'): string {
  const opponent = board.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;
  const capturedPiece = getPiece(board, move.to);
  const isCapture = capturedPiece !== null && capturedPiece.color !== board.currentTurn;

  // Check if this move leads to checkmate
  const simulatedBoard = simulateMove(board, move);
  const leadsToCheckmate = isCheckmate(simulatedBoard, opponent);

  if (leadsToCheckmate) {
    return lang === 'zh-TW' ? '這步棋將軍！' : 'This move gives checkmate!';
  }

  if (isCapture) {
    return lang === 'zh-TW' ? '試試吃掉那個棋子！' : 'Try capturing that piece!';
  }

  return lang === 'zh-TW' ? '把你的棋子移到更好的位置！' : 'Move your piece to a better position!';
}
