import { GoBoard, IntersectionState, StoneColor } from './types';

const BOARD_SIZE = 9;

const VALID_INTERSECTION_STATES = new Set<string>([
  IntersectionState.EMPTY,
  IntersectionState.BLACK,
  IntersectionState.WHITE,
]);

const VALID_STONE_COLORS = new Set<string>([
  StoneColor.BLACK,
  StoneColor.WHITE,
]);

export function serializeBoard(board: GoBoard): string {
  return JSON.stringify(board);
}

export function deserializeBoard(json: string): GoBoard {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: failed to parse input string');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid board: expected a JSON object');
  }

  const obj = parsed as Record<string, unknown>;

  // Validate grid
  if (!Array.isArray(obj.grid)) {
    throw new Error('Invalid board: missing or invalid "grid" field');
  }
  if (obj.grid.length !== BOARD_SIZE) {
    throw new Error(`Invalid board: grid must have ${BOARD_SIZE} rows, got ${obj.grid.length}`);
  }
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = obj.grid[r];
    if (!Array.isArray(row)) {
      throw new Error(`Invalid board: grid row ${r} is not an array`);
    }
    if (row.length !== BOARD_SIZE) {
      throw new Error(`Invalid board: grid row ${r} must have ${BOARD_SIZE} columns, got ${row.length}`);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!VALID_INTERSECTION_STATES.has(row[c] as string)) {
        throw new Error(`Invalid board: grid[${r}][${c}] has invalid value "${row[c]}"`);
      }
    }
  }

  // Validate currentTurn
  if (!VALID_STONE_COLORS.has(obj.currentTurn as string)) {
    throw new Error(`Invalid board: "currentTurn" must be a valid StoneColor, got "${obj.currentTurn}"`);
  }

  // Validate prisoners
  if (typeof obj.blackPrisoners !== 'number' || !Number.isFinite(obj.blackPrisoners) || obj.blackPrisoners < 0) {
    throw new Error(`Invalid board: "blackPrisoners" must be a non-negative number, got "${obj.blackPrisoners}"`);
  }
  if (typeof obj.whitePrisoners !== 'number' || !Number.isFinite(obj.whitePrisoners) || obj.whitePrisoners < 0) {
    throw new Error(`Invalid board: "whitePrisoners" must be a non-negative number, got "${obj.whitePrisoners}"`);
  }

  // Validate previousBoardGrid
  if (obj.previousBoardGrid !== null) {
    if (!Array.isArray(obj.previousBoardGrid)) {
      throw new Error('Invalid board: "previousBoardGrid" must be a 9×9 array or null');
    }
    if (obj.previousBoardGrid.length !== BOARD_SIZE) {
      throw new Error(`Invalid board: "previousBoardGrid" must have ${BOARD_SIZE} rows`);
    }
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row = obj.previousBoardGrid[r];
      if (!Array.isArray(row) || row.length !== BOARD_SIZE) {
        throw new Error(`Invalid board: "previousBoardGrid" row ${r} must have ${BOARD_SIZE} columns`);
      }
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!VALID_INTERSECTION_STATES.has(row[c] as string)) {
          throw new Error(`Invalid board: previousBoardGrid[${r}][${c}] has invalid value "${row[c]}"`);
        }
      }
    }
  }

  // Validate consecutivePasses
  if (typeof obj.consecutivePasses !== 'number' || !Number.isFinite(obj.consecutivePasses) || obj.consecutivePasses < 0) {
    throw new Error(`Invalid board: "consecutivePasses" must be a non-negative number, got "${obj.consecutivePasses}"`);
  }

  // Validate moveCount
  if (typeof obj.moveCount !== 'number' || !Number.isFinite(obj.moveCount) || obj.moveCount < 0) {
    throw new Error(`Invalid board: "moveCount" must be a non-negative number, got "${obj.moveCount}"`);
  }

  return {
    grid: obj.grid as IntersectionState[][],
    currentTurn: obj.currentTurn as StoneColor,
    blackPrisoners: obj.blackPrisoners as number,
    whitePrisoners: obj.whitePrisoners as number,
    previousBoardGrid: obj.previousBoardGrid as IntersectionState[][] | null,
    consecutivePasses: obj.consecutivePasses as number,
    moveCount: obj.moveCount as number,
  };
}
