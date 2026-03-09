import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GameContext, GameContextValue } from './App';
import HintButton from './HintButton';
import { GameStatus, Difficulty } from '../game/types';
import { Color } from '../engine/types';
import { HintResult } from '../hints/types';

function makeContext(overrides: Partial<GameContextValue> = {}): GameContextValue {
  return {
    gameState: {
      board: {
        squares: [],
        currentTurn: Color.WHITE,
        moveHistory: [],
        castlingRights: { whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true },
        enPassantTarget: null,
        halfMoveClock: 0,
        fullMoveNumber: 1,
      },
      status: GameStatus.IN_PROGRESS,
      playerColor: Color.WHITE,
      difficulty: Difficulty.EASY,
      score: { currentScore: 0, capturePoints: 0, checkmateBonus: 0, hintPenalty: 0, highScore: 0 },
      hintsUsed: 0,
    },
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
    t: (key: string) => {
      const map: Record<string, string> = {
        'game.hint': 'Hint',
      };
      return map[key] ?? key;
    },
    ...overrides,
  };
}

function renderWithContext(ctx: GameContextValue) {
  return render(
    <GameContext.Provider value={ctx}>
      <HintButton />
    </GameContext.Provider>,
  );
}

const sampleHint: HintResult = {
  suggestedMove: {
    from: { row: 6, col: 4 }, // e2
    to: { row: 4, col: 4 },   // e4
    promotion: null,
  },
  explanation: 'Move your pawn forward to control the center!',
  confidence: 0.8,
};

describe('HintButton', () => {
  it('renders the hint button with translated text', () => {
    renderWithContext(makeContext());
    const btn = screen.getByTestId('hint-button');
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toContain('Hint');
    expect(btn.textContent).toContain('💡');
  });

  it('calls onRequestHint when clicked', () => {
    const onRequestHint = vi.fn();
    renderWithContext(makeContext({ onRequestHint }));
    fireEvent.click(screen.getByTestId('hint-button'));
    expect(onRequestHint).toHaveBeenCalledOnce();
  });

  it('is disabled when game is NOT_STARTED', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.NOT_STARTED;
    renderWithContext(ctx);
    expect(screen.getByTestId('hint-button')).toBeDisabled();
  });

  it('is disabled when game is CHECKMATE', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECKMATE;
    renderWithContext(ctx);
    expect(screen.getByTestId('hint-button')).toBeDisabled();
  });

  it('is disabled when game is STALEMATE', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.STALEMATE;
    renderWithContext(ctx);
    expect(screen.getByTestId('hint-button')).toBeDisabled();
  });

  it('is disabled when game is DRAW', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.DRAW;
    renderWithContext(ctx);
    expect(screen.getByTestId('hint-button')).toBeDisabled();
  });

  it('is enabled when game is IN_PROGRESS', () => {
    renderWithContext(makeContext());
    expect(screen.getByTestId('hint-button')).not.toBeDisabled();
  });

  it('is enabled when game is CHECK', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECK;
    renderWithContext(ctx);
    expect(screen.getByTestId('hint-button')).not.toBeDisabled();
  });

  it('does not show hint overlay when activeHint is null', () => {
    renderWithContext(makeContext());
    expect(screen.queryByTestId('hint-overlay')).not.toBeInTheDocument();
  });

  it('shows hint overlay when activeHint is present', () => {
    renderWithContext(makeContext({ activeHint: sampleHint }));
    expect(screen.getByTestId('hint-overlay')).toBeInTheDocument();
  });

  it('displays the suggested move in algebraic notation', () => {
    renderWithContext(makeContext({ activeHint: sampleHint }));
    const moveEl = screen.getByTestId('hint-move');
    expect(moveEl.textContent).toContain('e2');
    expect(moveEl.textContent).toContain('e4');
    expect(moveEl.textContent).toContain('→');
  });

  it('displays the hint explanation text', () => {
    renderWithContext(makeContext({ activeHint: sampleHint }));
    expect(screen.getByTestId('hint-explanation')).toHaveTextContent(
      'Move your pawn forward to control the center!',
    );
  });

  it('displays explanation in the active language (zh-TW)', () => {
    const zhHint: HintResult = {
      suggestedMove: { from: { row: 7, col: 1 }, to: { row: 5, col: 2 }, promotion: null },
      explanation: '把你的騎士移到這裡來保護你的兵！',
      confidence: 0.7,
    };
    renderWithContext(makeContext({ activeHint: zhHint, language: 'zh-TW' }));
    expect(screen.getByTestId('hint-explanation')).toHaveTextContent(
      '把你的騎士移到這裡來保護你的兵！',
    );
  });

  it('converts corner positions correctly (a8, h1)', () => {
    const cornerHint: HintResult = {
      suggestedMove: { from: { row: 0, col: 0 }, to: { row: 7, col: 7 }, promotion: null },
      explanation: 'Test corner move',
      confidence: 0.5,
    };
    renderWithContext(makeContext({ activeHint: cornerHint }));
    const moveEl = screen.getByTestId('hint-move');
    expect(moveEl.textContent).toContain('a8');
    expect(moveEl.textContent).toContain('h1');
  });

  it('does not call onRequestHint when button is disabled', () => {
    const onRequestHint = vi.fn();
    const ctx = makeContext({ onRequestHint });
    ctx.gameState.status = GameStatus.NOT_STARTED;
    renderWithContext(ctx);
    fireEvent.click(screen.getByTestId('hint-button'));
    expect(onRequestHint).not.toHaveBeenCalled();
  });
});
