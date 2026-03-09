import React, { useCallback } from 'react';
import { useGameContext } from './App';
import Square from './Square';
import { Position, Color, PieceType } from '../engine/types';
import { isCheck } from '../engine/detection';

export default function ChessBoard() {
  const {
    gameState,
    legalMoves,
    selectedPosition,
    onSelectPiece,
    onMakeMove,
  } = useGameContext();

  const board = gameState.board;

  // Determine if the current player's king is in check
  const whiteInCheck = isCheck(board, Color.WHITE);
  const blackInCheck = isCheck(board, Color.BLACK);

  const isValidMoveTarget = useCallback(
    (row: number, col: number): boolean => {
      return legalMoves.some((m) => m.to.row === row && m.to.col === col);
    },
    [legalMoves],
  );

  const isKingInCheck = useCallback(
    (row: number, col: number): boolean => {
      const piece = board.squares[row][col];
      if (!piece || piece.type !== PieceType.KING) return false;
      if (piece.color === Color.WHITE && whiteInCheck) return true;
      if (piece.color === Color.BLACK && blackInCheck) return true;
      return false;
    },
    [board.squares, whiteInCheck, blackInCheck],
  );

  const handleSquareClick = useCallback(
    (position: Position) => {
      // If clicking a valid move target, make the move
      if (selectedPosition && isValidMoveTarget(position.row, position.col)) {
        onMakeMove(position.row, position.col);
        return;
      }
      // Otherwise try to select the piece at this position
      onSelectPiece(position.row, position.col);
    },
    [selectedPosition, isValidMoveTarget, onMakeMove, onSelectPiece],
  );

  const handleDragStart = useCallback(
    (position: Position) => {
      onSelectPiece(position.row, position.col);
    },
    [onSelectPiece],
  );

  const handleDrop = useCallback(
    (position: Position) => {
      if (selectedPosition) {
        onMakeMove(position.row, position.col);
      }
    },
    [selectedPosition, onMakeMove],
  );

  return (
    <div
      data-testid="chess-board"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        border: '3px solid #8e6b3e',
      }}
    >
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => {
          const isLight = (row + col) % 2 === 0;
          const piece = board.squares[row][col];
          const isSelected =
            selectedPosition !== null &&
            selectedPosition.row === row &&
            selectedPosition.col === col;

          return (
            <Square
              key={`${row}-${col}`}
              piece={piece}
              position={{ row, col }}
              isLight={isLight}
              isSelected={isSelected}
              isValidMove={isValidMoveTarget(row, col)}
              isCheck={isKingInCheck(row, col)}
              onClick={handleSquareClick}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
            />
          );
        }),
      )}
    </div>
  );
}
