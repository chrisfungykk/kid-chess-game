import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameContext, GameContextValue } from './App';
import ScoreDisplay from './ScoreDisplay';
import { GameStatus, Difficulty } from '../game/types';
import { Color } from '../engine/types';

function makeContext(overrides: Partial<GameContextValue> = {}): GameContextValue {
  return {
    gameState: {
      board: { squares: [], currentTurn: Color.WHITE, moveHistory: [], castlingRights: { whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true }, enPassantTarget: null, halfMoveClock: 0, fullMoveNumber: 1 },
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
    t: (key: string, params?: Record<string, string>) => {
      if (key === 'score.current' && params?.score) return `Score: ${params.score}`;
      if (key === 'score.high' && params?.score) return `High Score: ${params.score}`;
      return key;
    },
    ...overrides,
  };
}

function renderWithContext(ctx: GameContextValue) {
  return render(
    <GameContext.Provider value={ctx}>
      <ScoreDisplay />
    </GameContext.Provider>,
  );
}

describe('ScoreDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders current score and high score', () => {
    const ctx = makeContext();
    ctx.gameState.score.currentScore = 50;
    ctx.gameState.score.highScore = 120;
    renderWithContext(ctx);

    expect(screen.getByText('Score: 50')).toBeInTheDocument();
    expect(screen.getByText('High Score: 120')).toBeInTheDocument();
  });

  it('displays star emoji for current score', () => {
    const ctx = makeContext();
    renderWithContext(ctx);
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('displays trophy emoji for high score', () => {
    const ctx = makeContext();
    renderWithContext(ctx);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('shows celebration animation when score increases', () => {
    const ctx = makeContext();
    ctx.gameState.score.currentScore = 0;
    const { rerender } = renderWithContext(ctx);

    // No celebration initially
    expect(screen.queryByTestId('score-celebration')).not.toBeInTheDocument();

    // Increase score
    const ctx2 = makeContext();
    ctx2.gameState.score.currentScore = 30;
    rerender(
      <GameContext.Provider value={ctx2}>
        <ScoreDisplay />
      </GameContext.Provider>,
    );

    expect(screen.getByTestId('score-celebration')).toBeInTheDocument();
  });

  it('celebration disappears after timeout', () => {
    const ctx = makeContext();
    ctx.gameState.score.currentScore = 0;
    const { rerender } = renderWithContext(ctx);

    const ctx2 = makeContext();
    ctx2.gameState.score.currentScore = 10;
    rerender(
      <GameContext.Provider value={ctx2}>
        <ScoreDisplay />
      </GameContext.Provider>,
    );

    expect(screen.getByTestId('score-celebration')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.queryByTestId('score-celebration')).not.toBeInTheDocument();
  });

  it('does not celebrate when score decreases', () => {
    const ctx = makeContext();
    ctx.gameState.score.currentScore = 50;
    const { rerender } = renderWithContext(ctx);

    const ctx2 = makeContext();
    ctx2.gameState.score.currentScore = 45;
    rerender(
      <GameContext.Provider value={ctx2}>
        <ScoreDisplay />
      </GameContext.Provider>,
    );

    expect(screen.queryByTestId('score-celebration')).not.toBeInTheDocument();
  });

  it('has a score-display test id on the wrapper', () => {
    const ctx = makeContext();
    renderWithContext(ctx);
    expect(screen.getByTestId('score-display')).toBeInTheDocument();
  });
});
