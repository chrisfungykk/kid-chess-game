export enum StoneColor {
  BLACK = 'BLACK',
  WHITE = 'WHITE',
}

export enum IntersectionState {
  EMPTY = 'EMPTY',
  BLACK = 'BLACK',
  WHITE = 'WHITE',
}

export interface GoPosition {
  row: number;
  col: number;
}

export interface GoBoard {
  grid: IntersectionState[][];
  currentTurn: StoneColor;
  blackPrisoners: number;
  whitePrisoners: number;
  previousBoardGrid: IntersectionState[][] | null;
  consecutivePasses: number;
  moveCount: number;
}

export interface PlaceStoneResult {
  success: boolean;
  board: GoBoard;
  captured: GoPosition[];
  error?: 'occupied' | 'suicide' | 'ko_violation' | 'game_over';
}

export interface GoScoreResult {
  blackScore: number;
  whiteScore: number;
  blackTerritory: number;
  whiteTerritory: number;
  blackStones: number;
  whiteStones: number;
  komi: number;
  winner: StoneColor | 'tie';
}

export interface TerritoryMap {
  territories: TerritoryOwner[][];
}

export type TerritoryOwner = 'black' | 'white' | 'neutral' | 'black_stone' | 'white_stone';
