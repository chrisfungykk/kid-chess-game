import React from 'react';

export interface GoStoneProps {
  color: 'black' | 'white';
  preview?: boolean;
  size?: number;
}

export default function GoStone({ color, preview = false, size }: GoStoneProps) {
  const isBlack = color === 'black';

  const style: React.CSSProperties = {
    width: size ? `${size}px` : '85%',
    height: size ? `${size}px` : '85%',
    borderRadius: '50%',
    background: isBlack
      ? 'radial-gradient(circle at 35% 35%, #555, #111)'
      : 'radial-gradient(circle at 35% 35%, #fff, #ddd)',
    boxShadow: isBlack
      ? '2px 3px 6px rgba(0, 0, 0, 0.5)'
      : '2px 3px 6px rgba(0, 0, 0, 0.25)',
    border: isBlack ? 'none' : '1px solid #ccc',
    opacity: preview ? 0.4 : 1,
    display: 'inline-block',
    pointerEvents: 'none',
  };

  return (
    <div
      data-testid={`go-stone-${color}`}
      style={style}
      role="img"
      aria-label={`${color} stone${preview ? ' preview' : ''}`}
    />
  );
}
