import { Board, CastlingRights, Color, Piece, PieceType, Position } from './types';

/**
 * Check if a position is within the valid 8x8 board bounds.
 */
export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row <= 7 && pos.col >= 0 && pos.col <= 7;
}

/**
 * Get the piece at a given position, or null if empty/out of bounds.
 */
export function getPiece(board: Board, pos: Position): Piece | null {
  if (!isValidPosition(pos)) return null;
  return board.squares[pos.row][pos.col];
}

/**
 * Deep-clone a board so mutations to the clone don't affect the original.
 */
export function cloneBoard(board: Board): Board {
  const squares: (Piece | null)[][] = board.squares.map(row =>
    row.map(piece => (piece ? { ...piece } : null))
  );

  return {
    squares,
    currentTurn: board.currentTurn,
    moveHistory: board.moveHistory.map(record => ({
      ...record,
      move: {
        from: { ...record.move.from },
        to: { ...record.move.to },
        promotion: record.move.promotion,
      },
      capturedPiece: record.capturedPiece ? { ...record.capturedPiece } : null,
    })),
    castlingRights: { ...board.castlingRights },
    enPassantTarget: board.enPassantTarget ? { ...board.enPassantTarget } : null,
    halfMoveClock: board.halfMoveClock,
    fullMoveNumber: board.fullMoveNumber,
  };
}

/**
 * Create the standard chess starting position with all 32 pieces.
 *
 * Row 0: Black major pieces (Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook)
 * Row 1: Black pawns
 * Rows 2-5: Empty
 * Row 6: White pawns
 * Row 7: White major pieces (Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook)
 */
export function initializeBoard(): Board {
  const squares: (Piece | null)[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null)
  );

  const backRank: PieceType[] = [
    PieceType.ROOK,
    PieceType.KNIGHT,
    PieceType.BISHOP,
    PieceType.QUEEN,
    PieceType.KING,
    PieceType.BISHOP,
    PieceType.KNIGHT,
    PieceType.ROOK,
  ];

  // Black major pieces on row 0
  for (let col = 0; col < 8; col++) {
    squares[0][col] = { type: backRank[col], color: Color.BLACK };
  }

  // Black pawns on row 1
  for (let col = 0; col < 8; col++) {
    squares[1][col] = { type: PieceType.PAWN, color: Color.BLACK };
  }

  // White pawns on row 6
  for (let col = 0; col < 8; col++) {
    squares[6][col] = { type: PieceType.PAWN, color: Color.WHITE };
  }

  // White major pieces on row 7
  for (let col = 0; col < 8; col++) {
    squares[7][col] = { type: backRank[col], color: Color.WHITE };
  }

  const castlingRights: CastlingRights = {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  };

  return {
    squares,
    currentTurn: Color.WHITE,
    moveHistory: [],
    castlingRights,
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
  };
}
