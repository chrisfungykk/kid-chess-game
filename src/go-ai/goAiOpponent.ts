import {
  GoBoard,
  GoPosition,
  StoneColor,
  IntersectionState,
  getAllLegalMoves,
  findCaptures,
  getGroup,
  getLiberties,
} from '../go-engine';

export type GoDifficulty = 'easy' | 'medium';

const BOARD_SIZE = 9;
const CENTER = (BOARD_SIZE - 1) / 2;

/**
 * Score a potential move at `pos` for the given `color`.
 * Considers captures, center proximity, group safety (liberties), and territory influence.
 */
export function evaluateGoPosition(board: GoBoard, pos: GoPosition, color: StoneColor): number {
  let score = 0;

  // 1. Captures — high value
  const captures = findCaptures(board, pos, color);
  score += captures.length * 10;

  // 2. Center proximity — moderate value (closer to center = higher)
  const distFromCenter = Math.abs(pos.row - CENTER) + Math.abs(pos.col - CENTER);
  const maxDist = CENTER * 2;
  score += ((maxDist - distFromCenter) / maxDist) * 3;

  // 3. Group safety — simulate placement and check liberties of resulting group
  const stoneState = color === StoneColor.BLACK ? IntersectionState.BLACK : IntersectionState.WHITE;
  const simBoard = { ...board, grid: board.grid.map((r) => [...r]) };
  simBoard.grid[pos.row][pos.col] = stoneState;

  // Remove captured stones from simulation for accurate liberty count
  for (const cap of captures) {
    simBoard.grid[cap.row][cap.col] = IntersectionState.EMPTY;
  }

  const group = getGroup(simBoard, pos);
  const liberties = getLiberties(simBoard, group);
  score += Math.min(liberties.length, 5) * 1.5;

  // 4. Territory influence — count adjacent empty spaces
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  let adjacentEmpty = 0;
  for (const d of directions) {
    const nr = pos.row + d.row;
    const nc = pos.col + d.col;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      if (board.grid[nr][nc] === IntersectionState.EMPTY) {
        adjacentEmpty++;
      }
    }
  }
  score += adjacentEmpty * 0.5;

  return score;
}

/**
 * Select an AI move based on difficulty level.
 * - Easy: random legal move biased toward captures and center.
 * - Medium: one-ply evaluation, picks the best-scoring move.
 * Returns `null` when no beneficial moves exist (AI passes).
 */
export function selectGoMove(board: GoBoard, difficulty: GoDifficulty): GoPosition | null {
  const legalMoves = getAllLegalMoves(board);
  if (legalMoves.length === 0) {
    return null;
  }

  const currentColor = board.currentTurn;

  if (difficulty === 'medium') {
    let bestScore = -Infinity;
    let bestMove: GoPosition | null = null;

    for (const move of legalMoves) {
      const score = evaluateGoPosition(board, move, currentColor);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // Pass if no move scores above a minimal threshold
    if (bestScore < 1) {
      return null;
    }

    return bestMove;
  }

  // Easy: weighted random selection biased toward captures and center
  const weights: number[] = legalMoves.map((move) => {
    let weight = 1;

    // Bias toward captures
    const captures = findCaptures(board, move, currentColor);
    if (captures.length > 0) {
      weight += captures.length * 5;
    }

    // Bias toward center
    const distFromCenter = Math.abs(move.row - CENTER) + Math.abs(move.col - CENTER);
    const maxDist = CENTER * 2;
    weight += ((maxDist - distFromCenter) / maxDist) * 2;

    return weight;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < legalMoves.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return legalMoves[i];
    }
  }

  // Fallback — should not reach here, but return last move
  return legalMoves[legalMoves.length - 1];
}
