import React from 'react';
import { Piece } from '../engine/types';

export interface ChessPieceProps {
  piece: Piece;
  animated?: boolean;
  shaking?: boolean;
}

const PIECE_SYMBOLS: Record<string, string> = {
  'WHITE-KING': '♔',
  'WHITE-QUEEN': '♕',
  'WHITE-ROOK': '♖',
  'WHITE-BISHOP': '♗',
  'WHITE-KNIGHT': '♘',
  'WHITE-PAWN': '♙',
  'BLACK-KING': '♚',
  'BLACK-QUEEN': '♛',
  'BLACK-ROOK': '♜',
  'BLACK-BISHOP': '♝',
  'BLACK-KNIGHT': '♞',
  'BLACK-PAWN': '♟',
};

export function getPieceSymbol(piece: Piece): string {
  return PIECE_SYMBOLS[`${piece.color}-${piece.type}`] ?? '?';
}

const shakeKeyframes = `
@keyframes chess-piece-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
`;

let styleInjected = false;
function injectShakeStyle() {
  if (styleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = shakeKeyframes;
  document.head.appendChild(style);
  styleInjected = true;
}

export default function ChessPiece({ piece, animated = false, shaking = false }: ChessPieceProps) {
  injectShakeStyle();

  const style: React.CSSProperties = {
    fontSize: 'clamp(2rem, 6vw, 3.5rem)',
    lineHeight: 1,
    display: 'inline-block',
    willChange: 'transform',
    transition: animated ? 'transform 0.3s ease, opacity 0.3s ease' : 'none',
    animation: shaking ? 'chess-piece-shake 0.4s ease' : 'none',
    cursor: 'grab',
    userSelect: 'none',
    filter: `drop-shadow(1px 2px 2px rgba(0,0,0,0.3))`,
  };

  return (
    <span
      data-testid="chess-piece"
      draggable
      style={style}
      role="img"
      aria-label={`${piece.color} ${piece.type}`}
    >
      {getPieceSymbol(piece)}
    </span>
  );
}
