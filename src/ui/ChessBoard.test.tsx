import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { GameContext, GameContextValue } from './App';
import ChessBoard from './ChessBoard';
import Square from './Square';
import { Color, PieceType, Piece, Move } from '../engine/types';
import { initializeBoard } from '../engine/board';
import { GameStatus, Difficulty } from '../game/types';
import { GameState } from '../game/types';
import { ScoreState } from '../score/types';

function makeScore(): ScoreState {
  return { currentScore: 0, capturePoints: 0, checkmateBonus: 0, hintPenalty: 0, highScore: 0 };
}

function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    board: initializeBoard(),
    status: GameStatus.IN_PROGRESS,
    playerColor: Color.WHITE,
    difficulty: Difficulty.EASY,
    score: makeScore(),
    hintsUsed: 0,
    ...overrides,
  };
}

function renderWithContext(
  ui: React.ReactElement,
  contextOverrides?: Partial<GameContextValue>,
) {
  const defaultCtx: GameContextValue = {
    gameState: makeGameState(),
    legalMoves: [],
    selectedPosition: null,
    activeHint: null,
    onStartGame: vi.fn(),
    onRestartGame: vi.fn(),
    onSelectPiece: vi.fn(),
    onMakeMove: vi.fn(),
    onRequestHint: vi.fn(),
    onToggleLanguage: vi.fn(),
    language: 'en',
    t: (key: string) => key,
  };
  const ctx = { ...defaultCtx, ...contextOverrides };
  return render(
    <GameContext.Provider value={ctx}>{ui}</GameContext.Provider>,
  );
}

// --- Square component tests ---

describe('Square', () => {
  const baseProps = {
    piece: null as Piece | null,
    position: { row: 0, col: 0 },
    isLight: true,
    isSelected: false,
    isValidMove: false,
    isCheck: false,
    onClick: vi.fn(),
    onDrop: vi.fn(),
    onDragStart: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an empty light square', () => {
    render(<Square {...baseProps} />);
    const sq = screen.getByTestId('square-0-0');
    expect(sq).toBeInTheDocument();
    expect(sq.style.backgroundColor).toBe('rgb(240, 217, 181)'); // #f0d9b5
  });

  it('renders a dark square', () => {
    render(<Square {...baseProps} isLight={false} position={{ row: 0, col: 1 }} />);
    const sq = screen.getByTestId('square-0-1');
    expect(sq.style.backgroundColor).toBe('rgb(181, 136, 99)'); // #b58863
  });

  it('renders a piece symbol when piece is provided', () => {
    const piece: Piece = { type: PieceType.KING, color: Color.WHITE };
    render(<Square {...baseProps} piece={piece} />);
    expect(screen.getByText('♔')).toBeInTheDocument();
  });

  it('highlights selected square with green', () => {
    render(<Square {...baseProps} isSelected={true} />);
    const sq = screen.getByTestId('square-0-0');
    expect(sq.style.backgroundColor).toBe('rgb(127, 201, 127)'); // #7fc97f
  });

  it('shows green dot when isValidMove is true', () => {
    render(<Square {...baseProps} isValidMove={true} position={{ row: 3, col: 4 }} />);
    expect(screen.getByTestId('valid-move-3-4')).toBeInTheDocument();
  });

  it('does not show green dot when isValidMove is false', () => {
    render(<Square {...baseProps} isValidMove={false} position={{ row: 3, col: 4 }} />);
    expect(screen.queryByTestId('valid-move-3-4')).toBeNull();
  });

  it('highlights check square with red', () => {
    render(<Square {...baseProps} isCheck={true} />);
    const sq = screen.getByTestId('square-0-0');
    expect(sq.style.backgroundColor).toBe('rgb(231, 76, 60)'); // #e74c3c
  });

  it('calls onClick with position when clicked', () => {
    const onClick = vi.fn();
    render(<Square {...baseProps} onClick={onClick} position={{ row: 2, col: 5 }} />);
    fireEvent.click(screen.getByTestId('square-2-5'));
    expect(onClick).toHaveBeenCalledWith({ row: 2, col: 5 });
  });

  it('calls onDrop with position on drop event', () => {
    const onDrop = vi.fn();
    render(<Square {...baseProps} onDrop={onDrop} position={{ row: 4, col: 3 }} />);
    fireEvent.drop(screen.getByTestId('square-4-3'));
    expect(onDrop).toHaveBeenCalledWith({ row: 4, col: 3 });
  });

  it('piece is draggable', () => {
    const piece: Piece = { type: PieceType.PAWN, color: Color.WHITE };
    render(<Square {...baseProps} piece={piece} />);
    const pieceEl = screen.getByText('♙');
    expect(pieceEl.getAttribute('draggable')).toBe('true');
  });

  it('has accessible aria-label', () => {
    const piece: Piece = { type: PieceType.QUEEN, color: Color.BLACK };
    render(<Square {...baseProps} piece={piece} position={{ row: 0, col: 3 }} isSelected={true} />);
    const sq = screen.getByTestId('square-0-3');
    expect(sq.getAttribute('aria-label')).toContain('BLACK');
    expect(sq.getAttribute('aria-label')).toContain('QUEEN');
    expect(sq.getAttribute('aria-label')).toContain('selected');
  });
});

// --- ChessBoard component tests ---

describe('ChessBoard', () => {
  it('renders an 8x8 grid of 64 squares', () => {
    renderWithContext(<ChessBoard />);
    const board = screen.getByTestId('chess-board');
    expect(board).toBeInTheDocument();
    // 64 squares
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        expect(screen.getByTestId(`square-${r}-${c}`)).toBeInTheDocument();
      }
    }
  });

  it('renders pieces in starting position', () => {
    renderWithContext(<ChessBoard />);
    // White rook at row 7, col 0
    const sq = screen.getByTestId('square-7-0');
    expect(sq.textContent).toContain('♖');
    // Black queen at row 0, col 3
    const bq = screen.getByTestId('square-0-3');
    expect(bq.textContent).toContain('♛');
    // White pawn at row 6, col 4
    const wp = screen.getByTestId('square-6-4');
    expect(wp.textContent).toContain('♙');
  });

  it('highlights selected square', () => {
    renderWithContext(<ChessBoard />, {
      selectedPosition: { row: 6, col: 4 },
      legalMoves: [
        { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, promotion: null },
        { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null },
      ],
    });
    const selected = screen.getByTestId('square-6-4');
    expect(selected.style.backgroundColor).toBe('rgb(127, 201, 127)');
  });

  it('shows valid move dots for legal moves', () => {
    const moves: Move[] = [
      { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, promotion: null },
      { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null },
    ];
    renderWithContext(<ChessBoard />, {
      selectedPosition: { row: 6, col: 4 },
      legalMoves: moves,
    });
    expect(screen.getByTestId('valid-move-5-4')).toBeInTheDocument();
    expect(screen.getByTestId('valid-move-4-4')).toBeInTheDocument();
    // Non-target square should not have dot
    expect(screen.queryByTestId('valid-move-3-4')).toBeNull();
  });

  it('calls onSelectPiece when clicking a square with a piece', () => {
    const onSelectPiece = vi.fn();
    renderWithContext(<ChessBoard />, { onSelectPiece });
    fireEvent.click(screen.getByTestId('square-6-0'));
    expect(onSelectPiece).toHaveBeenCalledWith(6, 0);
  });

  it('calls onMakeMove when clicking a valid move target', () => {
    const onMakeMove = vi.fn().mockReturnValue(null);
    const moves: Move[] = [
      { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null },
    ];
    renderWithContext(<ChessBoard />, {
      selectedPosition: { row: 6, col: 4 },
      legalMoves: moves,
      onMakeMove,
    });
    fireEvent.click(screen.getByTestId('square-4-4'));
    expect(onMakeMove).toHaveBeenCalledWith(4, 4);
  });

  it('supports drag and drop: onDragStart selects piece, onDrop makes move', () => {
    const onSelectPiece = vi.fn();
    const onMakeMove = vi.fn().mockReturnValue(null);
    const moves: Move[] = [
      { from: { row: 6, col: 4 }, to: { row: 4, col: 4 }, promotion: null },
    ];
    renderWithContext(<ChessBoard />, {
      selectedPosition: { row: 6, col: 4 },
      legalMoves: moves,
      onSelectPiece,
      onMakeMove,
    });

    // Simulate drag start on the piece
    const pieceEl = screen.getByTestId('square-6-4').querySelector('[draggable]');
    if (pieceEl) {
      fireEvent.dragStart(pieceEl, {
        dataTransfer: { effectAllowed: 'move' },
      });
      expect(onSelectPiece).toHaveBeenCalledWith(6, 4);
    }

    // Simulate drop on target square
    fireEvent.drop(screen.getByTestId('square-4-4'));
    expect(onMakeMove).toHaveBeenCalledWith(4, 4);
  });

  it('has rounded corners and board styling', () => {
    renderWithContext(<ChessBoard />);
    const board = screen.getByTestId('chess-board');
    expect(board.style.borderRadius).toBe('12px');
    expect(board.style.display).toBe('grid');
  });
});
