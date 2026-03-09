import { Board, Color, Move, PieceType, Position } from './types';
import { isValidPosition, getPiece, cloneBoard } from './board';

// Direction vectors
const DIAGONAL_DIRECTIONS: Position[] = [
  { row: -1, col: -1 }, { row: -1, col: 1 },
  { row: 1, col: -1 }, { row: 1, col: 1 },
];

const STRAIGHT_DIRECTIONS: Position[] = [
  { row: -1, col: 0 }, { row: 1, col: 0 },
  { row: 0, col: -1 }, { row: 0, col: 1 },
];

const ALL_DIRECTIONS: Position[] = [...DIAGONAL_DIRECTIONS, ...STRAIGHT_DIRECTIONS];

const KNIGHT_OFFSETS: Position[] = [
  { row: -2, col: -1 }, { row: -2, col: 1 },
  { row: -1, col: -2 }, { row: -1, col: 2 },
  { row: 1, col: -2 }, { row: 1, col: 2 },
  { row: 2, col: -1 }, { row: 2, col: 1 },
];

/**
 * Check if a square is attacked by any piece of the given color.
 */
export function isSquareAttacked(board: Board, position: Position, byColor: Color): boolean {
  // Check knight attacks
  for (const offset of KNIGHT_OFFSETS) {
    const pos: Position = { row: position.row + offset.row, col: position.col + offset.col };
    if (isValidPosition(pos)) {
      const piece = board.squares[pos.row][pos.col];
      if (piece && piece.color === byColor && piece.type === PieceType.KNIGHT) return true;
    }
  }

  // Check sliding attacks (bishop/rook/queen)
  for (const dir of ALL_DIRECTIONS) {
    for (let dist = 1; dist < 8; dist++) {
      const pos: Position = { row: position.row + dir.row * dist, col: position.col + dir.col * dist };
      if (!isValidPosition(pos)) break;
      const piece = board.squares[pos.row][pos.col];
      if (piece) {
        if (piece.color === byColor) {
          const isDiagonal = dir.row !== 0 && dir.col !== 0;
          const isStraight = dir.row === 0 || dir.col === 0;
          if (piece.type === PieceType.QUEEN) return true;
          if (isDiagonal && piece.type === PieceType.BISHOP) return true;
          if (isStraight && piece.type === PieceType.ROOK) return true;
        }
        break; // blocked by a piece
      }
    }
  }

  // Check king attacks (1 square in any direction)
  for (const dir of ALL_DIRECTIONS) {
    const pos: Position = { row: position.row + dir.row, col: position.col + dir.col };
    if (isValidPosition(pos)) {
      const piece = board.squares[pos.row][pos.col];
      if (piece && piece.color === byColor && piece.type === PieceType.KING) return true;
    }
  }

  // Check pawn attacks
  // A white pawn at (r, c) attacks (r-1, c±1). So to check if position is attacked
  // by a white pawn, look at (position.row+1, position.col±1).
  const pawnDir = byColor === Color.WHITE ? 1 : -1;
  for (const colOffset of [-1, 1]) {
    const pos: Position = { row: position.row + pawnDir, col: position.col + colOffset };
    if (isValidPosition(pos)) {
      const piece = board.squares[pos.row][pos.col];
      if (piece && piece.color === byColor && piece.type === PieceType.PAWN) return true;
    }
  }

  return false;
}

/**
 * Generate pseudo-legal pawn moves (forward, double, captures, en passant, promotion).
 */
export function generatePawnMoves(board: Board, position: Position, color: Color): Move[] {
  const moves: Move[] = [];
  const direction = color === Color.WHITE ? -1 : 1;
  const startRow = color === Color.WHITE ? 6 : 1;
  const promotionRow = color === Color.WHITE ? 0 : 7;

  const addMoveOrPromotions = (from: Position, to: Position) => {
    if (to.row === promotionRow) {
      // Add all promotion options
      moves.push({ from, to, promotion: PieceType.QUEEN });
      moves.push({ from, to, promotion: PieceType.ROOK });
      moves.push({ from, to, promotion: PieceType.BISHOP });
      moves.push({ from, to, promotion: PieceType.KNIGHT });
    } else {
      moves.push({ from, to, promotion: null });
    }
  };

  // Forward 1
  const oneForward: Position = { row: position.row + direction, col: position.col };
  if (isValidPosition(oneForward) && !board.squares[oneForward.row][oneForward.col]) {
    addMoveOrPromotions(position, oneForward);

    // Forward 2 from starting rank
    if (position.row === startRow) {
      const twoForward: Position = { row: position.row + direction * 2, col: position.col };
      if (!board.squares[twoForward.row][twoForward.col]) {
        moves.push({ from: position, to: twoForward, promotion: null });
      }
    }
  }

  // Diagonal captures
  for (const colOffset of [-1, 1]) {
    const capturePos: Position = { row: position.row + direction, col: position.col + colOffset };
    if (isValidPosition(capturePos)) {
      const target = board.squares[capturePos.row][capturePos.col];
      if (target && target.color !== color) {
        addMoveOrPromotions(position, capturePos);
      }
    }
  }

  // En passant
  if (board.enPassantTarget) {
    const epRow = color === Color.WHITE ? 3 : 4;
    if (position.row === epRow) {
      const epTarget = board.enPassantTarget;
      if (
        epTarget.row === position.row + direction &&
        Math.abs(epTarget.col - position.col) === 1
      ) {
        moves.push({ from: position, to: epTarget, promotion: null });
      }
    }
  }

  return moves;
}

/**
 * Generate pseudo-legal knight moves.
 */
export function generateKnightMoves(board: Board, position: Position, color: Color): Move[] {
  const moves: Move[] = [];
  for (const offset of KNIGHT_OFFSETS) {
    const to: Position = { row: position.row + offset.row, col: position.col + offset.col };
    if (isValidPosition(to)) {
      const target = board.squares[to.row][to.col];
      if (!target || target.color !== color) {
        moves.push({ from: position, to, promotion: null });
      }
    }
  }
  return moves;
}

/**
 * Generate pseudo-legal sliding moves for bishop, rook, or queen.
 */
export function generateSlidingMoves(
  board: Board,
  position: Position,
  color: Color,
  directions: Position[]
): Move[] {
  const moves: Move[] = [];
  for (const dir of directions) {
    for (let dist = 1; dist < 8; dist++) {
      const to: Position = { row: position.row + dir.row * dist, col: position.col + dir.col * dist };
      if (!isValidPosition(to)) break;
      const target = board.squares[to.row][to.col];
      if (target) {
        if (target.color !== color) {
          moves.push({ from: position, to, promotion: null });
        }
        break; // blocked
      }
      moves.push({ from: position, to, promotion: null });
    }
  }
  return moves;
}

/**
 * Generate pseudo-legal king moves (1 square any direction + castling).
 */
export function generateKingMoves(board: Board, position: Position, color: Color): Move[] {
  const moves: Move[] = [];

  // Normal king moves (1 square in any direction)
  for (const dir of ALL_DIRECTIONS) {
    const to: Position = { row: position.row + dir.row, col: position.col + dir.col };
    if (isValidPosition(to)) {
      const target = board.squares[to.row][to.col];
      if (!target || target.color !== color) {
        moves.push({ from: position, to, promotion: null });
      }
    }
  }

  // Castling
  const opponentColor = color === Color.WHITE ? Color.BLACK : Color.WHITE;
  const kingRow = color === Color.WHITE ? 7 : 0;

  // Only attempt castling if king is on its starting square
  if (position.row === kingRow && position.col === 4) {
    // King must not be in check
    if (!isSquareAttacked(board, position, opponentColor)) {
      // Kingside castling
      const kingsideRight = color === Color.WHITE
        ? board.castlingRights.whiteKingside
        : board.castlingRights.blackKingside;

      if (kingsideRight) {
        const f = board.squares[kingRow][5];
        const g = board.squares[kingRow][6];
        if (!f && !g) {
          // King doesn't pass through or end in check
          if (
            !isSquareAttacked(board, { row: kingRow, col: 5 }, opponentColor) &&
            !isSquareAttacked(board, { row: kingRow, col: 6 }, opponentColor)
          ) {
            moves.push({ from: position, to: { row: kingRow, col: 6 }, promotion: null });
          }
        }
      }

      // Queenside castling
      const queensideRight = color === Color.WHITE
        ? board.castlingRights.whiteQueenside
        : board.castlingRights.blackQueenside;

      if (queensideRight) {
        const b = board.squares[kingRow][1];
        const c = board.squares[kingRow][2];
        const d = board.squares[kingRow][3];
        if (!b && !c && !d) {
          // King doesn't pass through or end in check
          if (
            !isSquareAttacked(board, { row: kingRow, col: 3 }, opponentColor) &&
            !isSquareAttacked(board, { row: kingRow, col: 2 }, opponentColor)
          ) {
            moves.push({ from: position, to: { row: kingRow, col: 2 }, promotion: null });
          }
        }
      }
    }
  }

  return moves;
}

/**
 * Simulate a move on a cloned board (for king safety checks).
 * This is a lightweight simulation — it moves the piece and handles captures,
 * en passant removal, and castling rook movement.
 */
function simulateMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard.squares[move.from.row][move.from.col];
  if (!piece) return newBoard;

  // Move the piece
  newBoard.squares[move.to.row][move.to.col] = move.promotion
    ? { type: move.promotion, color: piece.color }
    : piece;
  newBoard.squares[move.from.row][move.from.col] = null;

  // Handle en passant capture
  if (piece.type === PieceType.PAWN && board.enPassantTarget) {
    if (move.to.row === board.enPassantTarget.row && move.to.col === board.enPassantTarget.col) {
      // Remove the captured pawn
      const capturedPawnRow = move.from.row;
      newBoard.squares[capturedPawnRow][move.to.col] = null;
    }
  }

  // Handle castling rook movement
  if (piece.type === PieceType.KING && Math.abs(move.to.col - move.from.col) === 2) {
    const row = move.from.row;
    if (move.to.col === 6) {
      // Kingside
      newBoard.squares[row][5] = newBoard.squares[row][7];
      newBoard.squares[row][7] = null;
    } else if (move.to.col === 2) {
      // Queenside
      newBoard.squares[row][3] = newBoard.squares[row][0];
      newBoard.squares[row][0] = null;
    }
  }

  return newBoard;
}

/**
 * Find the king position for a given color.
 */
function findKing(board: Board, color: Color): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board.squares[row][col];
      if (piece && piece.type === PieceType.KING && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Get all legal moves for a piece at the given position.
 * Filters pseudo-legal moves by king safety.
 */
export function getLegalMoves(board: Board, position: Position): Move[] {
  if (!isValidPosition(position)) return [];

  const piece = getPiece(board, position);
  if (!piece) return [];
  if (piece.color !== board.currentTurn) return [];

  let pseudoLegalMoves: Move[];

  switch (piece.type) {
    case PieceType.PAWN:
      pseudoLegalMoves = generatePawnMoves(board, position, piece.color);
      break;
    case PieceType.KNIGHT:
      pseudoLegalMoves = generateKnightMoves(board, position, piece.color);
      break;
    case PieceType.BISHOP:
      pseudoLegalMoves = generateSlidingMoves(board, position, piece.color, DIAGONAL_DIRECTIONS);
      break;
    case PieceType.ROOK:
      pseudoLegalMoves = generateSlidingMoves(board, position, piece.color, STRAIGHT_DIRECTIONS);
      break;
    case PieceType.QUEEN:
      pseudoLegalMoves = generateSlidingMoves(board, position, piece.color, ALL_DIRECTIONS);
      break;
    case PieceType.KING:
      pseudoLegalMoves = generateKingMoves(board, position, piece.color);
      break;
    default:
      pseudoLegalMoves = [];
  }

  // Filter: only keep moves that don't leave own king in check
  const opponentColor = piece.color === Color.WHITE ? Color.BLACK : Color.WHITE;
  return pseudoLegalMoves.filter(move => {
    const simulated = simulateMove(board, move);
    const kingPos = findKing(simulated, piece.color);
    if (!kingPos) return false;
    return !isSquareAttacked(simulated, kingPos, opponentColor);
  });
}

/**
 * Get all legal moves for all pieces of a given color.
 */
export function getAllLegalMoves(board: Board, color: Color): Move[] {
  const allMoves: Move[] = [];
  // Temporarily ensure currentTurn matches the requested color for getLegalMoves
  const originalTurn = board.currentTurn;
  board.currentTurn = color;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board.squares[row][col];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { row, col });
        allMoves.push(...moves);
      }
    }
  }

  board.currentTurn = originalTurn;
  return allMoves;
}
