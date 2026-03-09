import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GameContext, GameContextValue } from './App';
import GameStatusOverlay from './GameStatusOverlay';
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
        'game.checkmate': 'Checkmate!',
        'game.checkmateWin': 'Checkmate! You win! 🎉',
        'game.checkmateLose': 'Oh no, checkmate! 😢',
        'game.stalemate': "It's a draw! 🤝",
        'game.draw': "It's a draw! 🤝",
        'game.check': 'Check! ⚠️',
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
      <GameStatusOverlay />
    </GameContext.Provider>,
  );
}

describe('GameStatusOverlay', () => {
  // --- Renders nothing for non-terminal states ---
  it('renders nothing when status is NOT_STARTED', () => {
    const { container } = renderWithContext(makeContext());
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when status is IN_PROGRESS', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.IN_PROGRESS;
    const { container } = renderWithContext(ctx);
    expect(container.innerHTML).toBe('');
  });

  // --- CHECK: non-blocking banner ---
  it('shows a check banner (not overlay) when status is CHECK', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECK;
    renderWithContext(ctx);
    expect(screen.getByTestId('check-banner')).toBeInTheDocument();
    expect(screen.getByTestId('check-banner').textContent).toContain('Check!');
    expect(screen.queryByTestId('game-status-overlay')).not.toBeInTheDocument();
  });

  // --- CHECKMATE: player wins ---
  it('shows win message when player wins by checkmate', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECKMATE;
    ctx.gameState.playerColor = Color.WHITE;
    // currentTurn is BLACK = the side that got checkmated, so WHITE (player) won
    ctx.gameState.board.currentTurn = Color.BLACK;
    renderWithContext(ctx);
    expect(screen.getByTestId('game-status-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-message').textContent).toContain('You win!');
    expect(screen.getByTestId('overlay-message').textContent).toContain('🎉');
  });

  // --- CHECKMATE: player loses ---
  it('shows lose message when player loses by checkmate', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECKMATE;
    ctx.gameState.playerColor = Color.WHITE;
    // currentTurn is WHITE = the side that got checkmated, so player lost
    ctx.gameState.board.currentTurn = Color.WHITE;
    renderWithContext(ctx);
    expect(screen.getByTestId('overlay-message').textContent).toContain('Oh no');
    expect(screen.getByTestId('overlay-message').textContent).toContain('😢');
  });

  // --- STALEMATE ---
  it('shows stalemate message with draw emoji', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.STALEMATE;
    renderWithContext(ctx);
    expect(screen.getByTestId('game-status-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-message').textContent).toContain('draw');
    expect(screen.getByTestId('overlay-message').textContent).toContain('🤝');
  });

  // --- DRAW ---
  it('shows draw message for DRAW status', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.DRAW;
    renderWithContext(ctx);
    expect(screen.getByTestId('game-status-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-message').textContent).toContain('draw');
    expect(screen.getByTestId('overlay-message').textContent).toContain('🤝');
  });

  // --- Play Again button ---
  it('shows Play Again button on checkmate', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECKMATE;
    ctx.gameState.board.currentTurn = Color.BLACK;
    renderWithContext(ctx);
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
    expect(screen.getByTestId('play-again-btn').textContent).toContain('Play Again');
  });

  it('shows Play Again button on stalemate', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.STALEMATE;
    renderWithContext(ctx);
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
  });

  it('shows Play Again button on draw', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.DRAW;
    renderWithContext(ctx);
    expect(screen.getByTestId('play-again-btn')).toBeInTheDocument();
  });

  it('calls onRestartGame when Play Again is clicked', () => {
    const onRestartGame = vi.fn();
    const ctx = makeContext({ onRestartGame });
    ctx.gameState.status = GameStatus.CHECKMATE;
    ctx.gameState.board.currentTurn = Color.BLACK;
    renderWithContext(ctx);
    fireEvent.click(screen.getByTestId('play-again-btn'));
    expect(onRestartGame).toHaveBeenCalledOnce();
  });

  // --- Overlay has semi-transparent backdrop ---
  it('overlay has a semi-transparent dark backdrop', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.CHECKMATE;
    ctx.gameState.board.currentTurn = Color.BLACK;
    renderWithContext(ctx);
    const overlay = screen.getByTestId('game-status-overlay');
    expect(overlay.style.position).toBe('fixed');
    expect(overlay.style.background).toContain('rgba');
  });

  // --- Modal styling ---
  it('overlay modal has rounded corners', () => {
    const ctx = makeContext();
    ctx.gameState.status = GameStatus.STALEMATE;
    renderWithContext(ctx);
    const modal = screen.getByTestId('overlay-modal');
    expect(modal.style.borderRadius).toBeTruthy();
  });

  // --- i18n: uses t() for text ---
  it('uses t() function for all displayed text', () => {
    const tSpy = vi.fn((key: string) => `translated:${key}`);
    const ctx = makeContext({ t: tSpy });
    ctx.gameState.status = GameStatus.STALEMATE;
    renderWithContext(ctx);
    expect(tSpy).toHaveBeenCalledWith('game.stalemate');
    expect(tSpy).toHaveBeenCalledWith('game.playAgain');
  });

  it('uses t() for check banner text', () => {
    const tSpy = vi.fn((key: string) => `translated:${key}`);
    const ctx = makeContext({ t: tSpy });
    ctx.gameState.status = GameStatus.CHECK;
    renderWithContext(ctx);
    expect(tSpy).toHaveBeenCalledWith('game.check');
  });
});
