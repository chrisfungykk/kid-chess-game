import { describe, it, expect } from 'vitest';
import { serializeBoard, deserializeBoard } from './serialize';
import { createEmptyBoard } from './board';
import { IntersectionState, StoneColor } from './types';

describe('serializeBoard', () => {
  it('serializes an empty board to a valid JSON string', () => {
    const board = createEmptyBoard();
    const json = serializeBoard(board);
    const parsed = JSON.parse(json);
    expect(parsed.currentTurn).toBe(StoneColor.BLACK);
    expect(parsed.blackPrisoners).toBe(0);
    expect(parsed.whitePrisoners).toBe(0);
    expect(parsed.consecutivePasses).toBe(0);
    expect(parsed.moveCount).toBe(0);
    expect(parsed.grid.length).toBe(9);
    expect(parsed.grid[0].length).toBe(9);
  });

  it('preserves stone placements in serialization', () => {
    const board = createEmptyBoard();
    board.grid[0][0] = IntersectionState.BLACK;
    board.grid[4][4] = IntersectionState.WHITE;
    const json = serializeBoard(board);
    const parsed = JSON.parse(json);
    expect(parsed.grid[0][0]).toBe('BLACK');
    expect(parsed.grid[4][4]).toBe('WHITE');
    expect(parsed.grid[1][1]).toBe('EMPTY');
  });
});

describe('deserializeBoard', () => {
  it('round-trips an empty board', () => {
    const board = createEmptyBoard();
    const result = deserializeBoard(serializeBoard(board));
    expect(result).toEqual(board);
  });

  it('round-trips a board with stones and state', () => {
    const board = createEmptyBoard();
    board.grid[2][3] = IntersectionState.BLACK;
    board.grid[5][5] = IntersectionState.WHITE;
    board.currentTurn = StoneColor.WHITE;
    board.blackPrisoners = 3;
    board.whitePrisoners = 1;
    board.consecutivePasses = 1;
    board.moveCount = 10;
    board.previousBoardGrid = createEmptyBoard().grid;

    const result = deserializeBoard(serializeBoard(board));
    expect(result).toEqual(board);
  });

  it('throws on malformed JSON', () => {
    expect(() => deserializeBoard('not json')).toThrow('Invalid JSON');
  });

  it('throws on non-object JSON', () => {
    expect(() => deserializeBoard('"hello"')).toThrow('expected a JSON object');
    expect(() => deserializeBoard('42')).toThrow('expected a JSON object');
    expect(() => deserializeBoard('[]')).toThrow('expected a JSON object');
    expect(() => deserializeBoard('null')).toThrow('expected a JSON object');
  });

  it('throws on missing grid', () => {
    const board = createEmptyBoard();
    const obj = JSON.parse(serializeBoard(board));
    delete obj.grid;
    expect(() => deserializeBoard(JSON.stringify(obj))).toThrow('"grid"');
  });

  it('throws on wrong grid size', () => {
    const board = createEmptyBoard();
    const obj = JSON.parse(serializeBoard(board));
    obj.grid = obj.grid.slice(0, 5);
    expect(() => deserializeBoard(JSON.stringify(obj))).toThrow('9 rows');
  });

  it('throws on invalid intersection state in grid', () => {
    const board = createEmptyBoard();
    const obj = JSON.parse(serializeBoard(board));
    obj.grid[0][0] = 'INVALID';
    expect(() => deserializeBoard(JSON.stringify(obj))).toThrow('grid[0][0]');
  });

  it('throws on invalid currentTurn', () => {
    const board = createEmptyBoard();
    const obj = JSON.parse(serializeBoard(board));
    obj.currentTurn = 'BLUE';
    expect(() => deserializeBoard(JSON.stringify(obj))).toThrow('"currentTurn"');
  });

  it('throws on negative blackPrisoners', () => {
    const board = createEmptyBoard();
    const obj = JSON.parse(serializeBoard(board));
    obj.blackPrisoners = -1;
    expect(() => deserializeBoard(JSON.stringify(obj))).toThrow('"blackPrisoners"');
  });

  it('throws on non-number whitePrisoners', () => {
    const board = createEmptyBoard();
    const obj = JSON.parse(serializeBoard(board));
    obj.whitePrisoners = 'five';
    expect(() => deserializeBoard(JSON.stringify(obj))).toThrow('"whitePrisoners"');
  });

  it('throws on negative consecutivePasses', () => {
    const board = createEmptyBoard();
    const obj = JSON.parse(serializeBoard(board));
    obj.consecutivePasses = -1;
    expect(() => deserializeBoard(JSON.stringify(obj))).toThrow('"consecutivePasses"');
  });

  it('throws on negative moveCount', () => {
    const board = createEmptyBoard();
    const obj = JSON.parse(serializeBoard(board));
    obj.moveCount = -5;
    expect(() => deserializeBoard(JSON.stringify(obj))).toThrow('"moveCount"');
  });

  it('throws on invalid previousBoardGrid', () => {
    const board = createEmptyBoard();
    const obj = JSON.parse(serializeBoard(board));
    obj.previousBoardGrid = 'not an array';
    expect(() => deserializeBoard(JSON.stringify(obj))).toThrow('"previousBoardGrid"');
  });

  it('accepts null previousBoardGrid', () => {
    const board = createEmptyBoard();
    board.previousBoardGrid = null;
    const result = deserializeBoard(serializeBoard(board));
    expect(result.previousBoardGrid).toBeNull();
  });
});
