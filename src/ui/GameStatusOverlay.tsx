import React from 'react';
import { useGameContext } from './App';
import { GameStatus } from '../game/types';


/**
 * GameStatusOverlay — kid-friendly overlay for checkmate, stalemate, draw,
 * and a non-blocking banner for check.
 *
 * Renders nothing when the game is NOT_STARTED or IN_PROGRESS.
 */
export default function GameStatusOverlay() {
  const { gameState, onRestartGame, t } = useGameContext();
  const { status, board, playerColor } = gameState;

  // Render nothing for normal play states
  if (status === GameStatus.NOT_STARTED || status === GameStatus.IN_PROGRESS) {
    return null;
  }

  // CHECK — non-blocking banner (not a full overlay)
  if (status === GameStatus.CHECK) {
    return (
      <div data-testid="check-banner" style={styles.checkBanner}>
        ⚠️ {t('game.check')}
      </div>
    );
  }

  // Game-ending states: CHECKMATE, STALEMATE, DRAW
  const isGameOver =
    status === GameStatus.CHECKMATE ||
    status === GameStatus.STALEMATE ||
    status === GameStatus.DRAW;

  if (!isGameOver) return null;

  // Determine the message
  let message = '';
  if (status === GameStatus.CHECKMATE) {
    // currentTurn is the player who is IN checkmate (lost).
    // If currentTurn !== playerColor, the player won.
    const playerWon = board.currentTurn !== playerColor;
    message = playerWon ? t('game.checkmateWin') : t('game.checkmateLose');
  } else if (status === GameStatus.STALEMATE) {
    message = t('game.stalemate');
  } else {
    message = t('game.draw');
  }

  return (
    <div data-testid="game-status-overlay" style={styles.overlay}>
      <div data-testid="overlay-modal" style={styles.modal}>
        <p data-testid="overlay-message" style={styles.message}>
          {message}
        </p>
        <button
          data-testid="play-again-btn"
          style={styles.playAgainBtn}
          onClick={onRestartGame}
        >
          🔄 {t('game.playAgain')}
        </button>
      </div>
    </div>
  );
}

// --- Kid-Friendly Styles ---

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: 'linear-gradient(135deg, #fff9c4 0%, #ffe0b2 100%)',
    borderRadius: '28px',
    padding: '40px 56px',
    textAlign: 'center' as const,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
    maxWidth: '420px',
    width: '90%',
  },
  message: {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    color: '#5b2c6f',
    margin: '0 0 24px',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
    lineHeight: 1.3,
  },
  playAgainBtn: {
    fontSize: '1.3rem',
    padding: '14px 36px',
    borderRadius: '18px',
    border: 'none',
    background: '#27ae60',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
    fontWeight: 'bold',
    boxShadow: '0 4px 0 #1a9c54',
    transition: 'transform 0.1s',
  },
  checkBanner: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#c0392b',
    background: '#fadbd8',
    borderRadius: '14px',
    padding: '10px 28px',
    marginBottom: '8px',
    textAlign: 'center' as const,
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
  },
};
