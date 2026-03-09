import {
  GoBoard,
  GoScoreResult,
  IntersectionState,
  StoneColor,
  TerritoryMap,
  TerritoryOwner,
} from './types';
import { isValidPosition } from './board';

const BOARD_SIZE = 9;
const KOMI = 6.5;

const DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * Flood-fill to find a connected empty region starting from (startRow, startCol).
 * Returns the set of positions in the region and the set of bordering stone colors.
 */
function floodFillEmpty(
  grid: IntersectionState[][],
  startRow: number,
  startCol: number,
  visited: Set<string>
): { region: { row: number; col: number }[]; borderColors: Set<IntersectionState> } {
  const region: { row: number; col: number }[] = [];
  const borderColors = new Set<IntersectionState>();
  const stack: { row: number; col: number }[] = [{ row: startRow, col: startCol }];

  while (stack.length > 0) {
    const { row, col } = stack.pop()!;
    const key = posKey(row, col);
    if (visited.has(key)) continue;
    visited.add(key);

    region.push({ row, col });

    for (const d of DIRECTIONS) {
      const nr = row + d.row;
      const nc = col + d.col;
      if (!isValidPosition({ row: nr, col: nc })) continue;

      const state = grid[nr][nc];
      if (state === IntersectionState.EMPTY) {
        if (!visited.has(posKey(nr, nc))) {
          stack.push({ row: nr, col: nc });
        }
      } else {
        borderColors.add(state);
      }
    }
  }

  return { region, borderColors };
}

/**
 * Determines territory ownership for every position on the board.
 * Stones are marked as 'black_stone' or 'white_stone'.
 * Empty regions bordered only by black → 'black', only by white → 'white', otherwise → 'neutral'.
 */
export function findTerritory(board: GoBoard): TerritoryMap {
  const territories: TerritoryOwner[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 'neutral' as TerritoryOwner)
  );

  // Mark stones
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const state = board.grid[r][c];
      if (state === IntersectionState.BLACK) {
        territories[r][c] = 'black_stone';
      } else if (state === IntersectionState.WHITE) {
        territories[r][c] = 'white_stone';
      }
    }
  }

  // Flood-fill empty regions
  const visited = new Set<string>();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board.grid[r][c] !== IntersectionState.EMPTY) continue;
      if (visited.has(posKey(r, c))) continue;

      const { region, borderColors } = floodFillEmpty(board.grid, r, c, visited);

      let owner: TerritoryOwner = 'neutral';
      const hasBlack = borderColors.has(IntersectionState.BLACK);
      const hasWhite = borderColors.has(IntersectionState.WHITE);

      if (hasBlack && !hasWhite) {
        owner = 'black';
      } else if (hasWhite && !hasBlack) {
        owner = 'white';
      }

      for (const pos of region) {
        territories[pos.row][pos.col] = owner;
      }
    }
  }

  return { territories };
}

/**
 * Calculates area scores for both players.
 * Area score = stones on board + territory.
 * White receives 6.5 komi (compensation for Black's first-move advantage).
 */
export function calculateScore(board: GoBoard): GoScoreResult {
  const { territories } = findTerritory(board);

  let blackStones = 0;
  let whiteStones = 0;
  let blackTerritory = 0;
  let whiteTerritory = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const owner = territories[r][c];
      switch (owner) {
        case 'black_stone':
          blackStones++;
          break;
        case 'white_stone':
          whiteStones++;
          break;
        case 'black':
          blackTerritory++;
          break;
        case 'white':
          whiteTerritory++;
          break;
      }
    }
  }

  const blackScore = blackStones + blackTerritory;
  const whiteScore = whiteStones + whiteTerritory + KOMI;

  let winner: StoneColor | 'tie';
  if (blackScore > whiteScore) {
    winner = StoneColor.BLACK;
  } else if (whiteScore > blackScore) {
    winner = StoneColor.WHITE;
  } else {
    winner = 'tie';
  }

  return {
    blackScore,
    whiteScore,
    blackTerritory,
    whiteTerritory,
    blackStones,
    whiteStones,
    komi: KOMI,
    winner,
  };
}
