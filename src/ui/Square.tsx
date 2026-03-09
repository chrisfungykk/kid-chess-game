import React, { useCallback } from 'react';
import { Piece, Position } from '../engine/types';
import ChessPiece from './ChessPiece';

export interface SquareProps {
  piece: Piece | null;
  position: Position;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isCheck: boolean;
  isAnimated?: boolean;
  isShaking?: boolean;
  onClick: (position: Position) => void;
  onDrop: (position: Position) => void;
  onDragStart: (position: Position) => void;
}

export default function Square({
  piece,
  position,
  isLight,
  isSelected,
  isValidMove,
  isCheck,
  isAnimated = false,
  isShaking = false,
  onClick,
  onDrop,
  onDragStart,
}: SquareProps) {
  const handleClick = useCallback(() => {
    onClick(position);
  }, [onClick, position]);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!piece) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(position);
    },
    [piece, onDragStart, position],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDrop(position);
    },
    [onDrop, position],
  );

  let bgColor = isLight ? '#f0d9b5' : '#b58863';
  if (isSelected) bgColor = '#7fc97f';
  if (isCheck) bgColor = '#e74c3c';

  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bgColor,
    position: 'relative',
    cursor: piece || isValidMove ? 'pointer' : 'default',
    userSelect: 'none',
    fontSize: 'clamp(1.5rem, 5vw, 3rem)',
    transition: 'background-color 0.15s ease',
  };

  return (
    <div
      data-testid={`square-${position.row}-${position.col}`}
      style={style}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      aria-label={`Square ${String.fromCharCode(97 + position.col)}${8 - position.row}${piece ? ` ${piece.color} ${piece.type}` : ''}${isSelected ? ' selected' : ''}${isValidMove ? ' valid move' : ''}${isCheck ? ' check' : ''}`}
    >
      {isValidMove && (
        <div
          data-testid={`valid-move-${position.row}-${position.col}`}
          style={{
            position: 'absolute',
            width: '30%',
            height: '30%',
            borderRadius: '50%',
            backgroundColor: 'rgba(46, 204, 113, 0.6)',
            pointerEvents: 'none',
          }}
        />
      )}
      {piece && (
        <span
          onDragStart={handleDragStart}
          style={{ lineHeight: 1, pointerEvents: 'auto' }}
        >
          <ChessPiece piece={piece} animated={isAnimated} shaking={isShaking} />
        </span>
      )}
    </div>
  );
}
