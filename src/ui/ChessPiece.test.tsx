import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChessPiece, { getPieceSymbol } from './ChessPiece';
import { PieceType, Color, Piece } from '../engine/types';

describe('ChessPiece', () => {
  const whitePawn: Piece = { type: PieceType.PAWN, color: Color.WHITE };
  const blackKing: Piece = { type: PieceType.KING, color: Color.BLACK };
  const whiteQueen: Piece = { type: PieceType.QUEEN, color: Color.WHITE };

  it('renders the correct Unicode symbol for a white pawn', () => {
    render(<ChessPiece piece={whitePawn} />);
    expect(screen.getByText('♙')).toBeInTheDocument();
  });

  it('renders the correct Unicode symbol for a black king', () => {
    render(<ChessPiece piece={blackKing} />);
    expect(screen.getByText('♚')).toBeInTheDocument();
  });

  it('renders all white piece symbols correctly', () => {
    const pieces: [PieceType, string][] = [
      [PieceType.KING, '♔'],
      [PieceType.QUEEN, '♕'],
      [PieceType.ROOK, '♖'],
      [PieceType.BISHOP, '♗'],
      [PieceType.KNIGHT, '♘'],
      [PieceType.PAWN, '♙'],
    ];
    for (const [type, symbol] of pieces) {
      const { unmount } = render(<ChessPiece piece={{ type, color: Color.WHITE }} />);
      expect(screen.getByText(symbol)).toBeInTheDocument();
      unmount();
    }
  });

  it('renders all black piece symbols correctly', () => {
    const pieces: [PieceType, string][] = [
      [PieceType.KING, '♚'],
      [PieceType.QUEEN, '♛'],
      [PieceType.ROOK, '♜'],
      [PieceType.BISHOP, '♝'],
      [PieceType.KNIGHT, '♞'],
      [PieceType.PAWN, '♟'],
    ];
    for (const [type, symbol] of pieces) {
      const { unmount } = render(<ChessPiece piece={{ type, color: Color.BLACK }} />);
      expect(screen.getByText(symbol)).toBeInTheDocument();
      unmount();
    }
  });

  it('is draggable', () => {
    render(<ChessPiece piece={whitePawn} />);
    const el = screen.getByTestId('chess-piece');
    expect(el.getAttribute('draggable')).toBe('true');
  });

  it('has an accessible aria-label with color and type', () => {
    render(<ChessPiece piece={whiteQueen} />);
    const el = screen.getByTestId('chess-piece');
    expect(el.getAttribute('aria-label')).toBe('WHITE QUEEN');
  });

  it('applies will-change: transform for 60fps performance', () => {
    render(<ChessPiece piece={whitePawn} />);
    const el = screen.getByTestId('chess-piece');
    expect(el.style.willChange).toBe('transform');
  });

  it('applies CSS transition when animated is true', () => {
    render(<ChessPiece piece={whitePawn} animated={true} />);
    const el = screen.getByTestId('chess-piece');
    expect(el.style.transition).toContain('transform');
    expect(el.style.transition).toContain('opacity');
  });

  it('does not apply CSS transition when animated is false', () => {
    render(<ChessPiece piece={whitePawn} animated={false} />);
    const el = screen.getByTestId('chess-piece');
    expect(el.style.transition).toBe('none');
  });

  it('applies shake animation when shaking is true', () => {
    render(<ChessPiece piece={whitePawn} shaking={true} />);
    const el = screen.getByTestId('chess-piece');
    expect(el.style.animation).toContain('chess-piece-shake');
  });

  it('does not apply shake animation when shaking is false', () => {
    render(<ChessPiece piece={whitePawn} shaking={false} />);
    const el = screen.getByTestId('chess-piece');
    expect(el.style.animation).toBe('none');
  });

  it('defaults animated and shaking to false', () => {
    render(<ChessPiece piece={whitePawn} />);
    const el = screen.getByTestId('chess-piece');
    expect(el.style.transition).toBe('none');
    expect(el.style.animation).toBe('none');
  });

  it('has a large kid-friendly font size', () => {
    render(<ChessPiece piece={whitePawn} />);
    const el = screen.getByTestId('chess-piece');
    expect(el.style.fontSize).toContain('clamp');
  });
});

describe('getPieceSymbol', () => {
  it('returns correct symbol for each piece', () => {
    expect(getPieceSymbol({ type: PieceType.KING, color: Color.WHITE })).toBe('♔');
    expect(getPieceSymbol({ type: PieceType.QUEEN, color: Color.BLACK })).toBe('♛');
    expect(getPieceSymbol({ type: PieceType.ROOK, color: Color.WHITE })).toBe('♖');
    expect(getPieceSymbol({ type: PieceType.BISHOP, color: Color.BLACK })).toBe('♝');
    expect(getPieceSymbol({ type: PieceType.KNIGHT, color: Color.WHITE })).toBe('♘');
    expect(getPieceSymbol({ type: PieceType.PAWN, color: Color.BLACK })).toBe('♟');
  });
});
