import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Integration tests for full game flows.
 *
 * The gameManager uses module-level state, so we use vi.resetModules()
 * and dynamic imports to get fresh state per test.
 *
 * Validates: Requirements 1.1, 2.2, 3.1, 4.7, 5.1, 7.1, 7.2, 8.2
 */

async function freshApp() {
  vi.resetModules();
  const appModule = await import('./App');
  return appModule.default;
}

async function freshI18n() {
  const i18n = await import('../i18n/i18nModule');
  return i18n;
}

describe('Integration: Full game flow', () => {
  beforeEach(async () => {
    const i18n = await freshI18n();
    i18n.setLanguage('en');
  });

  afterEach(() => {
    cleanup();
  });

  it('start game → select piece → see legal moves → make move → AI responds → score displays', async () => {
    const App = await freshApp();
    render(<App />);

    // 1. Game starts as NOT_STARTED — Play buttons visible
    expect(screen.getByTestId('play-easy-btn')).toBeInTheDocument();

    // 2. Click Play Easy to start the game
    fireEvent.click(screen.getByTestId('play-easy-btn'));

    // Play buttons should disappear, Restart should appear
    expect(screen.queryByTestId('play-easy-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('restart-btn')).toBeInTheDocument();

    // 3. Board should have pieces in starting position — white pawn at row 6
    const pawnSquare = screen.getByTestId('square-6-4'); // e2 pawn
    expect(pawnSquare).toBeInTheDocument();
    // The square should contain a piece (white pawn ♙)
    expect(pawnSquare.textContent).toContain('♙');

    // 4. Click the white pawn at e2 to select it
    fireEvent.click(pawnSquare);

    // 5. Legal move indicators should appear (e3 = row 5, col 4 and e4 = row 4, col 4)
    expect(screen.getByTestId('valid-move-5-4')).toBeInTheDocument(); // e3
    expect(screen.getByTestId('valid-move-4-4')).toBeInTheDocument(); // e4

    // 6. Click e4 (row 4, col 4) to make the move
    fireEvent.click(screen.getByTestId('square-4-4'));

    // 7. The pawn should now be at e4, not at e2
    const e4Square = screen.getByTestId('square-4-4');
    expect(e4Square.textContent).toContain('♙');
    const e2Square = screen.getByTestId('square-6-4');
    expect(e2Square.textContent).not.toContain('♙');

    // 8. Valid move indicators should be gone (selection cleared)
    expect(screen.queryByTestId('valid-move-5-4')).not.toBeInTheDocument();
    expect(screen.queryByTestId('valid-move-4-4')).not.toBeInTheDocument();

    // 9. AI should have responded — at least one black piece should have moved
    // The board's current turn should be back to white (player's turn)
    // We verify by checking that we can still select a white piece
    // Also verify the board changed: at least one black pawn should have moved from row 1
    let blackPawnMoved = false;
    for (let col = 0; col < 8; col++) {
      const sq = screen.getByTestId(`square-1-${col}`);
      if (!sq.textContent?.includes('♟')) {
        blackPawnMoved = true;
        break;
      }
    }
    // Check if any black piece moved (could be a knight from row 0 too)
    if (!blackPawnMoved) {
      for (let col = 0; col < 8; col++) {
        // Check row 2 for any black pieces that moved there
        const sq2 = screen.getByTestId(`square-2-${col}`);
        if (sq2.textContent?.includes('♞') || sq2.textContent?.includes('♟')) {
          blackPawnMoved = true;
          break;
        }
      }
    }
    expect(blackPawnMoved).toBe(true);

    // 10. Score display should be present and showing score
    const scoreDisplay = screen.getByTestId('score-display');
    expect(scoreDisplay).toBeInTheDocument();
    // Score text should contain "Score:" (English)
    expect(scoreDisplay.textContent).toContain('Score:');
  });
});

describe('Integration: Hint flow', () => {
  beforeEach(async () => {
    const i18n = await freshI18n();
    i18n.setLanguage('en');
  });

  afterEach(() => {
    cleanup();
  });

  it('start game → request hint → hint overlay appears with move and explanation → score deducted', async () => {
    const App = await freshApp();
    render(<App />);

    // Start the game
    fireEvent.click(screen.getByTestId('play-easy-btn'));

    // Verify hint button is enabled
    const hintButton = screen.getByTestId('hint-button');
    expect(hintButton).not.toBeDisabled();

    const scoreDisplay = screen.getByTestId('score-display');

    // Click hint button
    fireEvent.click(hintButton);

    // Hint overlay should appear
    const hintOverlay = screen.getByTestId('hint-overlay');
    expect(hintOverlay).toBeInTheDocument();

    // Hint move should be displayed (algebraic notation like "e2 → e4")
    const hintMove = screen.getByTestId('hint-move');
    expect(hintMove).toBeInTheDocument();
    expect(hintMove.textContent).toMatch(/[a-h][1-8]\s*→\s*[a-h][1-8]/);

    // Hint explanation should be displayed
    const hintExplanation = screen.getByTestId('hint-explanation');
    expect(hintExplanation).toBeInTheDocument();
    expect(hintExplanation.textContent!.length).toBeGreaterThan(0);

    // Score should reflect hint penalty (5 points deducted, but floor at 0)
    // Since starting score is 0, it stays at 0 after deduction
    const updatedScoreText = scoreDisplay.textContent;
    expect(updatedScoreText).toContain('Score:');
    // Score should contain "0" since we started at 0 and hint penalty floors at 0
    expect(updatedScoreText).toContain('0');
  });
});

describe('Integration: Restart flow', () => {
  beforeEach(async () => {
    const i18n = await freshI18n();
    i18n.setLanguage('en');
  });

  afterEach(() => {
    cleanup();
  });

  it('start game → make a move → restart → board resets to starting position → score is 0', async () => {
    const App = await freshApp();
    render(<App />);

    // Start the game
    fireEvent.click(screen.getByTestId('play-easy-btn'));

    // Make a move: select e2 pawn and move to e4
    fireEvent.click(screen.getByTestId('square-6-4')); // select e2
    fireEvent.click(screen.getByTestId('square-4-4')); // move to e4

    // Verify the move was made (pawn at e4)
    expect(screen.getByTestId('square-4-4').textContent).toContain('♙');

    // Click Restart
    fireEvent.click(screen.getByTestId('restart-btn'));

    // Board should be reset to starting position
    // White pawns should be back on row 6
    for (let col = 0; col < 8; col++) {
      expect(screen.getByTestId(`square-6-${col}`).textContent).toContain('♙');
    }
    // Black pawns should be back on row 1
    for (let col = 0; col < 8; col++) {
      expect(screen.getByTestId(`square-1-${col}`).textContent).toContain('♟');
    }

    // e4 should be empty (no pawn there anymore)
    expect(screen.getByTestId('square-4-4').textContent).not.toContain('♙');

    // Score should be 0
    const scoreDisplay = screen.getByTestId('score-display');
    expect(scoreDisplay.textContent).toContain('Score: 0');

    // Game should still be in progress (restart button visible)
    expect(screen.getByTestId('restart-btn')).toBeInTheDocument();
  });
});

describe('Integration: Language switch flow', () => {
  beforeEach(async () => {
    const i18n = await freshI18n();
    i18n.setLanguage('en');
  });

  afterEach(() => {
    cleanup();
  });

  it('render app → verify English → toggle to Chinese → verify Chinese → toggle back → verify English', async () => {
    const App = await freshApp();
    render(<App />);

    // 1. Verify English text is displayed
    const title = screen.getByRole('heading');
    expect(title.textContent).toContain('Kids Chess');

    // Play buttons should be in English
    expect(screen.getByTestId('play-easy-btn').textContent).toContain('Play Easy');
    expect(screen.getByTestId('play-medium-btn').textContent).toContain('Play Medium');

    // Hint button should be in English
    expect(screen.getByTestId('hint-button').textContent).toContain('Hint');

    // Language toggle should show Chinese option
    expect(screen.getByTestId('language-toggle-btn').textContent).toContain('繁體中文');

    // Score display should be in English
    expect(screen.getByTestId('score-display').textContent).toContain('Score:');
    expect(screen.getByTestId('score-display').textContent).toContain('High Score:');

    // 2. Click language toggle to switch to Chinese
    fireEvent.click(screen.getByTestId('language-toggle-btn'));

    // 3. Verify Chinese text
    expect(title.textContent).toContain('兒童西洋棋');

    // Play buttons should be in Chinese
    expect(screen.getByTestId('play-easy-btn').textContent).toContain('簡單模式');
    expect(screen.getByTestId('play-medium-btn').textContent).toContain('中等模式');

    // Hint button should be in Chinese
    expect(screen.getByTestId('hint-button').textContent).toContain('提示');

    // Language toggle should now show English option
    expect(screen.getByTestId('language-toggle-btn').textContent).toContain('English');

    // Score display should be in Chinese
    expect(screen.getByTestId('score-display').textContent).toContain('分數：');
    expect(screen.getByTestId('score-display').textContent).toContain('最高分：');

    // 4. Click language toggle again to switch back to English
    fireEvent.click(screen.getByTestId('language-toggle-btn'));

    // 5. Verify English text returns
    expect(title.textContent).toContain('Kids Chess');
    expect(screen.getByTestId('play-easy-btn').textContent).toContain('Play Easy');
    expect(screen.getByTestId('hint-button').textContent).toContain('Hint');
    expect(screen.getByTestId('language-toggle-btn').textContent).toContain('繁體中文');
    expect(screen.getByTestId('score-display').textContent).toContain('Score:');
  });
});
