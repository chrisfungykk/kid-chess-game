// Chess Engine Core Types

export enum PieceType {
  KING = 'KING',
  QUEEN = 'QUEEN',
  ROOK = 'ROOK',
  BISHOP = 'BISHOP',
  KNIGHT = 'KNIGHT',
  PAWN = 'PAWN',
}

export enum Color {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
}

export interface Piece {
  type: PieceType;
  color: Color;
}

export interface Position {
  row: number; // 0-7
  col: number; // 0-7
}

export interface Move {
  from: Position;
  to: Position;
  promotion: PieceType | null;
}

export interface MoveRecord {
  move: Move;
  capturedPiece: Piece | null;
  wasCheck: boolean;
  notation: string;
}

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

export interface Board {
  squares: (Piece | null)[][];
  currentTurn: Color;
  moveHistory: MoveRecord[];
  castlingRights: CastlingRights;
  enPassantTarget: Position | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}
