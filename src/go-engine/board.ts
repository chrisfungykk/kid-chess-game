import { IntersectionState, StoneColor, GoBoard, GoPosition } from './types';

const BOARD_SIZE = 9;

export function createEmptyBoard(): GoBoard {
  const grid: IntersectionState[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => IntersectionState.EMPTY)
  );

  return {
    grid,
    currentTurn: StoneColor.BLACK,
    blackPrisoners: 0,
    whitePrisoners: 0,
    previousBoardGrid: null,
    consecutivePasses: 0,
    moveCount: 0,
  };
}

export function isValidPosition(pos: GoPosition): boolean {
  return (
    Number.isInteger(pos.row) &&
    Number.isInteger(pos.col) &&
    pos.row >= 0 &&
    pos.row < BOARD_SIZE &&
    pos.col >= 0 &&
    pos.col < BOARD_SIZE
  );
}

export function getIntersection(board: GoBoard, pos: GoPosition): IntersectionState {
  if (!isValidPosition(pos)) {
    throw new Error(`Invalid position: (${pos.row}, ${pos.col})`);
  }
  return board.grid[pos.row][pos.col];
}

export function setIntersection(board: GoBoard, pos: GoPosition, state: IntersectionState): GoBoard {
  if (!isValidPosition(pos)) {
    throw new Error(`Invalid position: (${pos.row}, ${pos.col})`);
  }

  const newGrid = board.grid.map((row, r) =>
    r === pos.row ? row.map((cell, c) => (c === pos.col ? state : cell)) : [...row]
  );

  return {
    ...board,
    grid: newGrid,
  };
}
