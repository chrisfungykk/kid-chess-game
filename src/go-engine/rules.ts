import { GoBoard, GoPosition, IntersectionState, PlaceStoneResult, StoneColor } from './types';
import { isValidPosition, getIntersection, setIntersection } from './board';

const BOARD_SIZE = 9;

const DIRECTIONS: GoPosition[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

function posKey(pos: GoPosition): string {
  return `${pos.row},${pos.col}`;
}

function getAdjacentPositions(pos: GoPosition): GoPosition[] {
  return DIRECTIONS.map((d) => ({ row: pos.row + d.row, col: pos.col + d.col })).filter(
    isValidPosition
  );
}

function colorToState(color: StoneColor): IntersectionState {
  return color === StoneColor.BLACK ? IntersectionState.BLACK : IntersectionState.WHITE;
}

function oppositeColor(color: StoneColor): StoneColor {
  return color === StoneColor.BLACK ? StoneColor.WHITE : StoneColor.BLACK;
}

function gridsEqual(a: IntersectionState[][], b: IntersectionState[][]): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function removeStones(board: GoBoard, stones: GoPosition[]): GoBoard {
  let result = board;
  for (const stone of stones) {
    result = setIntersection(result, stone, IntersectionState.EMPTY);
  }
  return result;
}

/**
 * Flood-fill to find all connected stones of the same color starting from `pos`.
 * Returns empty array if the position is empty.
 */
export function getGroup(board: GoBoard, pos: GoPosition): GoPosition[] {
  const state = getIntersection(board, pos);
  if (state === IntersectionState.EMPTY) {
    return [];
  }

  const group: GoPosition[] = [];
  const visited = new Set<string>();
  const stack: GoPosition[] = [pos];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = posKey(current);
    if (visited.has(key)) continue;
    visited.add(key);

    const currentState = getIntersection(board, current);
    if (currentState !== state) continue;

    group.push(current);

    for (const neighbor of getAdjacentPositions(current)) {
      if (!visited.has(posKey(neighbor))) {
        stack.push(neighbor);
      }
    }
  }

  return group;
}

/**
 * Returns all unique empty positions adjacent to any stone in the group (the group's liberties).
 */
export function getLiberties(board: GoBoard, group: GoPosition[]): GoPosition[] {
  const libertySet = new Set<string>();
  const liberties: GoPosition[] = [];

  for (const stone of group) {
    for (const neighbor of getAdjacentPositions(stone)) {
      const key = posKey(neighbor);
      if (!libertySet.has(key) && getIntersection(board, neighbor) === IntersectionState.EMPTY) {
        libertySet.add(key);
        liberties.push(neighbor);
      }
    }
  }

  return liberties;
}

/**
 * Simulates placing a stone of `color` at `pos` and returns all opponent stones
 * that would be captured (have zero liberties after the placement).
 */
export function findCaptures(board: GoBoard, pos: GoPosition, color: StoneColor): GoPosition[] {
  const stoneState = colorToState(color);
  const opponentState =
    color === StoneColor.BLACK ? IntersectionState.WHITE : IntersectionState.BLACK;

  // Simulate placing the stone
  const simBoard = setIntersection(board, pos, stoneState);

  const captured: GoPosition[] = [];
  const checked = new Set<string>();

  for (const neighbor of getAdjacentPositions(pos)) {
    const key = posKey(neighbor);
    if (checked.has(key)) continue;

    if (getIntersection(simBoard, neighbor) === opponentState) {
      const group = getGroup(simBoard, neighbor);
      for (const stone of group) {
        checked.add(posKey(stone));
      }

      const liberties = getLiberties(simBoard, group);
      if (liberties.length === 0) {
        captured.push(...group);
      }
    }
  }

  return captured;
}

/**
 * Checks whether placing a stone at `pos` is legal for the current player.
 * Validates: position validity, occupied check, suicide rule, and ko rule.
 */
export function isLegalMove(board: GoBoard, pos: GoPosition): boolean {
  if (!isValidPosition(pos)) return false;
  if (getIntersection(board, pos) !== IntersectionState.EMPTY) return false;

  const currentColor = board.currentTurn;
  const stoneState = colorToState(currentColor);
  const captures = findCaptures(board, pos, currentColor);

  let simBoard = setIntersection(board, pos, stoneState);

  if (captures.length > 0) {
    simBoard = removeStones(simBoard, captures);
  } else {
    // No captures — check suicide
    const group = getGroup(simBoard, pos);
    const liberties = getLiberties(simBoard, group);
    if (liberties.length === 0) return false;
  }

  // Ko check
  if (board.previousBoardGrid && gridsEqual(simBoard.grid, board.previousBoardGrid)) {
    return false;
  }

  return true;
}

/**
 * Returns all legal positions for the current player on the board.
 */
export function getAllLegalMoves(board: GoBoard): GoPosition[] {
  const moves: GoPosition[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const pos: GoPosition = { row, col };
      if (isLegalMove(board, pos)) {
        moves.push(pos);
      }
    }
  }
  return moves;
}

/**
 * Places a stone at `pos` for the current player.
 * Validates the move, resolves captures, updates prisoners, stores previous board for ko,
 * switches turn, and returns the result.
 */
export function placeStone(board: GoBoard, pos: GoPosition): PlaceStoneResult {
  const currentColor = board.currentTurn;
  const stoneState = colorToState(currentColor);

  if (!isValidPosition(pos)) {
    return { success: false, board, captured: [], error: 'occupied' };
  }

  if (getIntersection(board, pos) !== IntersectionState.EMPTY) {
    return { success: false, board, captured: [], error: 'occupied' };
  }

  const captures = findCaptures(board, pos, currentColor);

  // Place the stone
  let newBoard = setIntersection(board, pos, stoneState);

  // Resolve opponent captures first
  if (captures.length > 0) {
    newBoard = removeStones(newBoard, captures);
  }

  // Re-evaluate placed stone's group after opponent captures resolved
  const placedGroup = getGroup(newBoard, pos);
  const placedLiberties = getLiberties(newBoard, placedGroup);

  if (placedLiberties.length === 0 && captures.length === 0) {
    return { success: false, board, captured: [], error: 'suicide' };
  }

  // Ko check
  if (board.previousBoardGrid && gridsEqual(newBoard.grid, board.previousBoardGrid)) {
    return { success: false, board, captured: [], error: 'ko_violation' };
  }

  // Store current grid as previousBoardGrid for next ko check
  const previousBoardGrid = board.grid.map((row) => [...row]);

  // Update prisoner count
  const capturedCount = captures.length;
  const blackPrisoners =
    currentColor === StoneColor.BLACK
      ? board.blackPrisoners + capturedCount
      : board.blackPrisoners;
  const whitePrisoners =
    currentColor === StoneColor.WHITE
      ? board.whitePrisoners + capturedCount
      : board.whitePrisoners;

  const finalBoard: GoBoard = {
    ...newBoard,
    currentTurn: oppositeColor(currentColor),
    blackPrisoners,
    whitePrisoners,
    previousBoardGrid,
    consecutivePasses: 0,
    moveCount: board.moveCount + 1,
  };

  return { success: true, board: finalBoard, captured: captures };
}
