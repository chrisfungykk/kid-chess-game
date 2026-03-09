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
import type { GoHintResult } from './types';

const BOARD_SIZE = 9;

function colorToState(color: StoneColor): IntersectionState {
  return color === StoneColor.BLACK ? IntersectionState.BLACK : IntersectionState.WHITE;
}


const messages = {
  capture: { en: 'You can capture stones here!', 'zh-TW': '你可以在這裡吃子！' },
  defend: { en: 'Protect your stones from being captured!', 'zh-TW': '保護你的棋子不被吃掉！' },
  territory: { en: 'Expand your territory here!', 'zh-TW': '在這裡擴展你的領地！' },
  general: { en: 'This looks like a good spot!', 'zh-TW': '這看起來是個好位置！' },
} as const;

function getMessage(category: keyof typeof messages, lang: string): string {
  const key = lang === 'zh-TW' ? 'zh-TW' : 'en';
  return messages[category][key];
}

/**
 * Find a move that captures opponent stones.
 */
function findCaptureHint(board: GoBoard, color: StoneColor, legalMoves: GoPosition[]): GoPosition | null {
  for (const move of legalMoves) {
    const captures = findCaptures(board, move, color);
    if (captures.length > 0) {
      return move;
    }
  }
  return null;
}

/**
 * Find a move that defends an own group with only 1 liberty.
 * The defending move must add liberties to the endangered group.
 */
function findDefendHint(board: GoBoard, color: StoneColor, legalMoves: GoPosition[]): GoPosition | null {
  const ownState = colorToState(color);
  const checked = new Set<string>();

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const pos: GoPosition = { row, col };
      const key = `${row},${col}`;
      if (checked.has(key)) continue;
      if (board.grid[row][col] !== ownState) continue;

      const group = getGroup(board, pos);
      for (const s of group) checked.add(`${s.row},${s.col}`);

      const liberties = getLiberties(board, group);
      if (liberties.length !== 1) continue;

      // This group is in atari — find a legal move that adds liberties
      for (const move of legalMoves) {
        // Simulate placing the stone
        const simGrid = board.grid.map((r) => [...r]);
        simGrid[move.row][move.col] = ownState;
        const simBoard: GoBoard = { ...board, grid: simGrid };

        const newGroup = getGroup(simBoard, group[0]);
        const newLiberties = getLiberties(simBoard, newGroup);
        if (newLiberties.length > 1) {
          return move;
        }
      }
    }
  }
  return null;
}

/**
 * Find a move near the center or that extends territory.
 * Prefers moves closer to the center of the board.
 */
function findTerritoryHint(legalMoves: GoPosition[]): GoPosition | null {
  if (legalMoves.length === 0) return null;

  const center = (BOARD_SIZE - 1) / 2;
  let best: GoPosition | null = null;
  let bestDist = Infinity;

  for (const move of legalMoves) {
    const dist = Math.abs(move.row - center) + Math.abs(move.col - center);
    if (dist < bestDist) {
      bestDist = dist;
      best = move;
    }
  }

  // Only suggest territory hint if the move is reasonably central
  if (best && bestDist <= center) {
    return best;
  }
  return null;
}

/**
 * Analyzes the board and generates a kid-friendly hint for the given color.
 * Priority: capture > defend > territory > general.
 * Returns null if no legal moves exist.
 */
export function generateGoHint(
  board: GoBoard,
  color: StoneColor,
  lang: string
): GoHintResult | null {
  const legalMoves = getAllLegalMoves({ ...board, currentTurn: color });
  if (legalMoves.length === 0) return null;

  // 1. Capture opportunity
  const captureMove = findCaptureHint(board, color, legalMoves);
  if (captureMove) {
    return {
      position: captureMove,
      category: 'capture',
      message: getMessage('capture', lang),
    };
  }

  // 2. Defend endangered group
  const defendMove = findDefendHint(board, color, legalMoves);
  if (defendMove) {
    return {
      position: defendMove,
      category: 'defend',
      message: getMessage('defend', lang),
    };
  }

  // 3. Territory extension
  const territoryMove = findTerritoryHint(legalMoves);
  if (territoryMove) {
    return {
      position: territoryMove,
      category: 'territory',
      message: getMessage('territory', lang),
    };
  }

  // 4. General — pick the first legal move
  return {
    position: legalMoves[0],
    category: 'general',
    message: getMessage('general', lang),
  };
}
