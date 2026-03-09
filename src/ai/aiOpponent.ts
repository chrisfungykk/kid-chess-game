import { Board, Color, Move } from '../engine/types';
import { getAllLegalMoves } from '../engine/moves';
import { simulateMove } from '../engine/execute';
import { evaluatePosition } from '../engine/evaluation';
import { Difficulty } from '../game/types';

/**
 * Find the best move for BLACK using minimax evaluation.
 * AI plays BLACK, so it minimizes the score (negative = black advantage).
 * At depth 0, returns evaluatePosition(board).
 */
export function findBestMove(board: Board, moves: Move[], depth: number): Move {
  let bestMove = moves[0];
  let bestScore = Infinity; // BLACK minimizes

  for (const move of moves) {
    const simulated = simulateMove(board, move);
    const score = minimax(simulated, depth - 1, false);
    if (score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Minimax evaluation. WHITE maximizes, BLACK minimizes.
 * @param board - current board state
 * @param depth - remaining depth to search
 * @param isMaximizing - true if it's WHITE's turn (maximizing)
 */
function minimax(board: Board, depth: number, isMaximizing: boolean): number {
  if (depth <= 0) {
    return evaluatePosition(board);
  }

  const color = isMaximizing ? Color.WHITE : Color.BLACK;
  const moves = getAllLegalMoves(board, color);

  if (moves.length === 0) {
    // No legal moves: either checkmate or stalemate
    // If the current side has no moves and is in check, it's checkmate
    // Return a very high/low score for checkmate, 0 for stalemate
    return evaluatePosition(board);
  }

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const simulated = simulateMove(board, move);
      const score = minimax(simulated, depth - 1, false);
      if (score > maxScore) {
        maxScore = score;
      }
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const simulated = simulateMove(board, move);
      const score = minimax(simulated, depth - 1, true);
      if (score < minScore) {
        minScore = score;
      }
    }
    return minScore;
  }
}

/**
 * Select a move for the AI (BLACK) based on difficulty level.
 *
 * EASY: 70% random legal move, 30% best evaluated move (depth 1)
 * MEDIUM: 30% random legal move, 70% best evaluated move (depth 2)
 *
 * @param board - current board state (BLACK to move)
 * @param difficulty - EASY or MEDIUM
 * @param randomFn - optional random function for testability (returns 0-1)
 */
export function selectMove(
  board: Board,
  difficulty: Difficulty,
  randomFn: () => number = Math.random,
): Move {
  const allMoves = getAllLegalMoves(board, Color.BLACK);

  if (allMoves.length === 0) {
    throw new Error('No legal moves available for AI');
  }

  if (allMoves.length === 1) {
    return allMoves[0];
  }

  const randomValue = randomFn();

  if (difficulty === Difficulty.EASY) {
    // 70% random, 30% best move (depth 1)
    if (randomValue < 0.7) {
      return allMoves[Math.floor(randomFn() * allMoves.length)];
    }
    return findBestMove(board, allMoves, 1);
  }

  // MEDIUM: 30% random, 70% best move (depth 2)
  if (randomValue < 0.3) {
    return allMoves[Math.floor(randomFn() * allMoves.length)];
  }
  return findBestMove(board, allMoves, 2);
}
