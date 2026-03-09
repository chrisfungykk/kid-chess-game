import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setLanguage } from '../i18n/i18nModule';

// Use dynamic imports to get fresh module state per test
async function freshApp() {
  vi.resetModules();
  const appModule = await import('./App');
  const App = appModule.default;
  const GameContext = appModule.GameContext;
  return { App, GameContext };
}

describe('App component', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the game title', async () => {
    const { App } = await freshApp();
    render(<App />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('renders the ChessBoard component', async () => {
    const { App } = await freshApp();
    render(<App />);
    expect(screen.getByTestId('chess-board')).toBeInTheDocument();
  });

  it('renders the ScoreDisplay component', async () => {
    const { App } = await freshApp();
    render(<App />);
    expect(screen.getByTestId('score-display')).toBeInTheDocument();
  });

  it('renders the GameControls component', async () => {
    const { App } = await freshApp();
    render(<App />);
    expect(screen.getByTestId('game-controls')).toBeInTheDocument();
  });

  it('renders the HintButton component', async () => {
    const { App } = await freshApp();
    render(<App />);
    expect(screen.getByTestId('hint-button-wrapper')).toBeInTheDocument();
  });

  it('shows Play buttons when game has not started', async () => {
    const { App } = await freshApp();
    render(<App />);
    expect(screen.getByTestId('play-easy-btn')).toBeInTheDocument();
    expect(screen.getByTestId('play-medium-btn')).toBeInTheDocument();
  });

  it('shows score area with star and trophy', async () => {
    const { App } = await freshApp();
    render(<App />);
    expect(screen.getByText('⭐')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('shows language toggle button', async () => {
    const { App } = await freshApp();
    render(<App />);
    expect(screen.getByTestId('language-toggle-btn')).toBeInTheDocument();
    expect(screen.getByTestId('language-toggle-btn').textContent).toContain('繁體中文');
  });

  it('starts a game when Play Easy is clicked', async () => {
    const { App } = await freshApp();
    render(<App />);
    fireEvent.click(screen.getByTestId('play-easy-btn'));
    expect(screen.getByTestId('restart-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('play-easy-btn')).not.toBeInTheDocument();
  });

  it('toggles language when language button is clicked', async () => {
    const { App } = await freshApp();
    render(<App />);
    fireEvent.click(screen.getByTestId('language-toggle-btn'));
    expect(screen.getByTestId('language-toggle-btn').textContent).toContain('English');
  });

  it('exports GameContext', async () => {
    const { GameContext } = await freshApp();
    expect(GameContext).toBeDefined();
    expect(typeof GameContext).toBe('object');
  });

  it('shows Restart button during gameplay', async () => {
    const { App } = await freshApp();
    render(<App />);
    fireEvent.click(screen.getByTestId('play-easy-btn'));
    expect(screen.getByTestId('restart-btn')).toBeInTheDocument();
  });

  it('restarts the game when Restart is clicked', async () => {
    const { App } = await freshApp();
    render(<App />);
    fireEvent.click(screen.getByTestId('play-easy-btn'));
    fireEvent.click(screen.getByTestId('restart-btn'));
    expect(screen.getByTestId('restart-btn')).toBeInTheDocument();
  });

  it('hint button is enabled during gameplay', async () => {
    const { App } = await freshApp();
    render(<App />);
    fireEvent.click(screen.getByTestId('play-easy-btn'));
    expect(screen.getByTestId('hint-button')).not.toBeDisabled();
  });

  it('hint button is disabled before game starts', async () => {
    const { App } = await freshApp();
    render(<App />);
    expect(screen.getByTestId('hint-button')).toBeDisabled();
  });
});
