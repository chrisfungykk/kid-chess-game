import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GameContext, GameContextValue } from './App';
import GameControls from './GameControls';
import { GameStatus, Difficulty } from '../game/types';
import { Color } from '../engine/types';

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
      status: GameStatus.NOT_STARTED,
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
        'game.playEasy': 'Play Easy',
        'game.playMedium': 'Play Medium',
        'game.restart': 'Restart',
        'game.playAgain': 'Play Again',
      };
      return map[key] ?? key;
    },
    ...overrides,
  };
}

function renderWithContext(ctx: GameContextValue) {
  return render(
    <GameContext.Provider value={ctx}>
      <GameControls />
    </GameContext.Provider>,
  );
}

describe('GameControls', () => {
  // --- NOT_STARTED state ---
  it('shows Play Easy and Play Medium buttons when game is NOT_STARTED', () => {
    renderWithContext(makeContext());
    expect(screen.getByTestId('play-easy-btn')).toBeInTheDocument();
    expect(screen.getByTestId('play-medium-btn')).toBeInTheDocument();
  });

  it('does not show Restart or Play Again when NOT_STARTED', () => {
    renderWithContext(makeContext());
    expect(screen.queryByTestId('restart-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('play-again-btn')).not.toBeInTheDocument();
  });

  it('calls onStartGame with EASY when Play Easy is clicked', () => {
    const onStartGame = vi.fn();
    renderWithContext(makeContext({ onStartGame }));
    fireEvent.click(screen.getByTestId('play-easy-btn'));
    expect(onStartGame).toHaveBeenCalledWith(Difficulty.EASY);
  });

  it('calls onStartGame with MEDIUM when Play Medium is clicked', () => {
    const onStartGame = vi.fn();
    renderWithContext(makeContext({ onStartGame }));
    fireEvent.click(screen.getByTestId('play-medium-btn'));
    expect(onStartGame).toHaveBeenCalledWith(Difficulty.MEDIUM);
  });

  // --- IN_PROGRESS state ---
  it('shows Restart button when game is IN_PROGRESS', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.IN_PROGRESS;
    renderWithContext(ctx);
    expect(screen.getByTestId('restart-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('play-easy-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('play-again-btn')).not.toBeInTheDocument();
  });

  it('shows Restart button when game is CHECK', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECK;
    renderWithContext(ctx);
    expect(screen.getByTestId('restart-btn')).toBeInTheDocument();
  });

  it('calls onRestartGame when Restart is clicked', () => {
    const onRestartGame = vi.fn();
    const ctx = makeContext({ onRestartGame });
    ctx.gameState.status = GameStatus.IN_PROGRESS;
    renderWithContext(ctx);
    fireEvent.click(screen.getByTestId('restart-btn'));
    expect(onRestartGame).toHaveBeenCalledOnce();
  });

  // --- Game over states ---
  it('shows Play Again button when game is CHECKMATE', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECKMATE;
    renderWithContext(ctx);
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('restart-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('play-easy-btn')).not.toBeInTheDocument();
  });

  it('shows Play Again button when game is STALEMATE', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.STALEMATE;
    renderWithContext(ctx);
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
  });

  it('shows Play Again button when game is DRAW', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.DRAW;
    renderWithContext(ctx);
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
  });

  it('calls onRestartGame when Play Again is clicked', () => {
    const onRestartGame = vi.fn();
    const ctx = makeContext({ onRestartGame });
    ctx.gameState.status = GameStatus.CHECKMATE;
    renderWithContext(ctx);
    fireEvent.click(screen.getByTestId('play-again-btn'));
    expect(onRestartGame).toHaveBeenCalledOnce();
  });

  // --- Language toggle ---
  it('always shows language toggle button', () => {
    renderWithContext(makeContext());
    expect(screen.getByTestId('language-toggle-btn')).toBeInTheDocument();
  });

  it('shows 繁體中文 when current language is en', () => {
    renderWithContext(makeContext({ language: 'en' }));
    expect(screen.getByTestId('language-toggle-btn').textContent).toContain('繁體中文');
  });

  it('shows English when current language is zh-TW', () => {
    renderWithContext(makeContext({ language: 'zh-TW' }));
    expect(screen.getByTestId('language-toggle-btn').textContent).toContain('English');
  });

  it('calls onToggleLanguage when language button is clicked', () => {
    const onToggleLanguage = vi.fn();
    renderWithContext(makeContext({ onToggleLanguage }));
    fireEvent.click(screen.getByTestId('language-toggle-btn'));
    expect(onToggleLanguage).toHaveBeenCalledOnce();
  });

  it('shows 🌐 emoji on language toggle', () => {
    renderWithContext(makeContext());
    expect(screen.getByTestId('language-toggle-btn').textContent).toContain('🌐');
  });

  // --- Wrapper ---
  it('has a game-controls test id on the wrapper', () => {
    renderWithContext(makeContext());
    expect(screen.getByTestId('game-controls')).toBeInTheDocument();
  });

  // --- Language toggle visible in all states ---
  it('shows language toggle during IN_PROGRESS', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.IN_PROGRESS;
    renderWithContext(ctx);
    expect(screen.getByTestId('language-toggle-btn')).toBeInTheDocument();
  });

  it('shows language toggle during CHECKMATE', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECKMATE;
    renderWithContext(ctx);
    expect(screen.getByTestId('language-toggle-btn')).toBeInTheDocument();
  });
});
