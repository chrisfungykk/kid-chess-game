import { Board, Color, Move, MoveRecord, Piece, PieceType, Position } from './types';
import { cloneBoard } from './board';
import { isSquareAttacked } from './moves';

export interface MoveResult {
  board: Board;
  capturedPiece: Piece | null;
  wasCheck: boolean;
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
 * Generate a simple algebraic notation string for a move.
 */
function generateNotation(board: Board, move: Move, capturedPiece: Piece | null, wasCheck: boolean): string {
  const piece = board.squares[move.from.row][move.from.col];
  if (!piece) return '';

  // Castling
  if (piece.type === PieceType.KING && Math.abs(move.to.col - move.from.col) === 2) {
    return move.to.col === 6 ? 'O-O' : 'O-O-O';
  }

  const colLetter = (col: number) => String.fromCharCode(97 + col); // a-h
  const rowNumber = (row: number) => String(8 - row); // 1-8

  let notation = '';

  if (piece.type !== PieceType.PAWN) {
    const pieceLetters: Record<PieceType, string> = {
      [PieceType.KING]: 'K',
      [PieceType.QUEEN]: 'Q',
      [PieceType.ROOK]: 'R',
      [PieceType.BISHOP]: 'B',
      [PieceType.KNIGHT]: 'N',
      [PieceType.PAWN]: '',
    };
    notation += pieceLetters[piece.type];
  }

  if (capturedPiece) {
    if (piece.type === PieceType.PAWN) {
      notation += colLetter(move.from.col);
    }
    notation += 'x';
  }

  notation += colLetter(move.to.col) + rowNumber(move.to.row);

  if (move.promotion) {
    const promoLetters: Record<PieceType, string> = {
      [PieceType.QUEEN]: 'Q',
      [PieceType.ROOK]: 'R',
      [PieceType.BISHOP]: 'B',
      [PieceType.KNIGHT]: 'N',
      [PieceType.KING]: '',
      [PieceType.PAWN]: '',
    };
    notation += '=' + promoLetters[move.promotion];
  }

  if (wasCheck) {
    notation += '+';
  }

  return notation;
}

/**
 * Execute a move on the board, returning a full MoveResult with updated board,
 * capture info, and check status. Updates all game state fields.
 */
export function executeMove(board: Board, move: Move): MoveResult {
  const newBoard = cloneBoard(board);
  const piece = newBoard.squares[move.from.row][move.from.col];
  if (!piece) {
    return { board: newBoard, capturedPiece: null, wasCheck: false };
  }

  const opponentColor = piece.color === Color.WHITE ? Color.BLACK : Color.WHITE;

  // Determine captured piece
  let capturedPiece: Piece | null = newBoard.squares[move.to.row][move.to.col];

  // En passant capture detection
  const isEnPassant =
    piece.type === PieceType.PAWN &&
    board.enPassantTarget !== null &&
    move.to.row === board.enPassantTarget.row &&
    move.to.col === board.enPassantTarget.col;

  if (isEnPassant) {
    capturedPiece = newBoard.squares[move.from.row][move.to.col];
    newBoard.squares[move.from.row][move.to.col] = null;
  }

  // Move the piece
  if (move.promotion) {
    newBoard.squares[move.to.row][move.to.col] = { type: move.promotion, color: piece.color };
  } else {
    newBoard.squares[move.to.row][move.to.col] = piece;
  }
  newBoard.squares[move.from.row][move.from.col] = null;

  // Handle castling: move the rook
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

  // Update en passant target
  if (piece.type === PieceType.PAWN && Math.abs(move.to.row - move.from.row) === 2) {
    const epRow = (move.from.row + move.to.row) / 2;
    newBoard.enPassantTarget = { row: epRow, col: move.from.col };
  } else {
    newBoard.enPassantTarget = null;
  }

  // Update castling rights
  updateCastlingRights(newBoard, move, piece);

  // Switch turn
  newBoard.currentTurn = opponentColor;

  // Update half-move clock
  if (piece.type === PieceType.PAWN || capturedPiece) {
    newBoard.halfMoveClock = 0;
  } else {
    newBoard.halfMoveClock = board.halfMoveClock + 1;
  }

  // Update full move number (increment after black's move)
  if (piece.color === Color.BLACK) {
    newBoard.fullMoveNumber = board.fullMoveNumber + 1;
  }

  // Check if opponent's king is now in check
  const opponentKingPos = findKing(newBoard, opponentColor);
  const wasCheck = opponentKingPos !== null && isSquareAttacked(newBoard, opponentKingPos, piece.color);

  // Generate notation
  const notation = generateNotation(board, move, capturedPiece, wasCheck);

  // Add move record to history
  const record: MoveRecord = {
    move: {
      from: { ...move.from },
      to: { ...move.to },
      promotion: move.promotion,
    },
    capturedPiece: capturedPiece ? { ...capturedPiece } : null,
    wasCheck,
    notation,
  };
  newBoard.moveHistory.push(record);

  return { board: newBoard, capturedPiece, wasCheck };
}

/**
 * Update castling rights based on the move just made.
 */
function updateCastlingRights(board: Board, move: Move, piece: Piece): void {
  // King moves revoke both castling rights for that color
  if (piece.type === PieceType.KING) {
    if (piece.color === Color.WHITE) {
      board.castlingRights.whiteKingside = false;
      board.castlingRights.whiteQueenside = false;
    } else {
      board.castlingRights.blackKingside = false;
      board.castlingRights.blackQueenside = false;
    }
  }

  // Rook moves or captures revoke the relevant castling right
  if (piece.type === PieceType.ROOK) {
    if (piece.color === Color.WHITE) {
      if (move.from.row === 7 && move.from.col === 7) board.castlingRights.whiteKingside = false;
      if (move.from.row === 7 && move.from.col === 0) board.castlingRights.whiteQueenside = false;
    } else {
      if (move.from.row === 0 && move.from.col === 7) board.castlingRights.blackKingside = false;
      if (move.from.row === 0 && move.from.col === 0) board.castlingRights.blackQueenside = false;
    }
  }

  // If a rook is captured on its starting square, revoke that right
  if (move.to.row === 0 && move.to.col === 0) board.castlingRights.blackQueenside = false;
  if (move.to.row === 0 && move.to.col === 7) board.castlingRights.blackKingside = false;
  if (move.to.row === 7 && move.to.col === 0) board.castlingRights.whiteQueenside = false;
  if (move.to.row === 7 && move.to.col === 7) board.castlingRights.whiteKingside = false;
}

/**
 * Simulate a move on the board without mutating the original.
 * Lighter than executeMove — does NOT update moveHistory, halfMoveClock, or fullMoveNumber.
 * Used for position evaluation by AI and hint system.
 */
export function simulateMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard.squares[move.from.row][move.from.col];
  if (!piece) return newBoard;

  // En passant capture
  const isEnPassant =
    piece.type === PieceType.PAWN &&
    board.enPassantTarget !== null &&
    move.to.row === board.enPassantTarget.row &&
    move.to.col === board.enPassantTarget.col;

  if (isEnPassant) {
    newBoard.squares[move.from.row][move.to.col] = null;
  }

  // Move the piece (with promotion)
  if (move.promotion) {
    newBoard.squares[move.to.row][move.to.col] = { type: move.promotion, color: piece.color };
  } else {
    newBoard.squares[move.to.row][move.to.col] = piece;
  }
  newBoard.squares[move.from.row][move.from.col] = null;

  // Handle castling rook movement
  if (piece.type === PieceType.KING && Math.abs(move.to.col - move.from.col) === 2) {
    const row = move.from.row;
    if (move.to.col === 6) {
      newBoard.squares[row][5] = newBoard.squares[row][7];
      newBoard.squares[row][7] = null;
    } else if (move.to.col === 2) {
      newBoard.squares[row][3] = newBoard.squares[row][0];
      newBoard.squares[row][0] = null;
    }
  }

  // Update en passant target
  if (piece.type === PieceType.PAWN && Math.abs(move.to.row - move.from.row) === 2) {
    const epRow = (move.from.row + move.to.row) / 2;
    newBoard.enPassantTarget = { row: epRow, col: move.from.col };
  } else {
    newBoard.enPassantTarget = null;
  }

  // Update castling rights
  updateCastlingRights(newBoard, move, piece);

  // Switch turn
  newBoard.currentTurn = piece.color === Color.WHITE ? Color.BLACK : Color.WHITE;

  return newBoard;
}
