import React from 'react';
import { useGameContext } from './App';
import { GameStatus, Difficulty } from '../game/types';

export default function GameControls() {
  const { gameState, onStartGame, onRestartGame, onToggleLanguage, language, t } = useGameContext();

  const isNotStarted = gameState.status === GameStatus.NOT_STARTED;
  const isPlaying =
    gameState.status === GameStatus.IN_PROGRESS || gameState.status === GameStatus.CHECK;
  const isGameOver =
    gameState.status === GameStatus.CHECKMATE ||
    gameState.status === GameStatus.STALEMATE ||
    gameState.status === GameStatus.DRAW;

  return (
    <div style={styles.wrapper} data-testid="game-controls">
      {isNotStarted && (
        <>
          <button
            style={{ ...styles.btn, ...styles.btnEasy }}
            onClick={() => onStartGame(Difficulty.EASY)}
            data-testid="play-easy-btn"
          >
            🎮 {t('game.playEasy')}
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnMedium }}
            onClick={() => onStartGame(Difficulty.MEDIUM)}
            data-testid="play-medium-btn"
          >
            🧠 {t('game.playMedium')}
          </button>
        </>
      )}

      {isPlaying && (
        <button
          style={{ ...styles.btn, ...styles.btnRestart }}
          onClick={onRestartGame}
          data-testid="restart-btn"
        >
          🔄 {t('game.restart')}
        </button>
      )}

      {isGameOver && (
        <button
          style={{ ...styles.btn, ...styles.btnPlayAgain }}
          onClick={onRestartGame}
          data-testid="play-again-btn"
        >
          🎉 {t('game.playAgain')}
        </button>
      )}

      <button
        style={{ ...styles.btn, ...styles.btnLang }}
        onClick={onToggleLanguage}
        data-testid="language-toggle-btn"
      >
        🌐 {language === 'en' ? '繁體中文' : 'English'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    marginTop: '8px',
  },
  btn: {
    fontSize: '1.2rem',
    padding: '12px 28px',
    borderRadius: '20px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
    fontWeight: 'bold',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  btnEasy: {
    background: 'linear-gradient(135deg, #58d68d 0%, #2ecc71 100%)',
    boxShadow: '0 4px 0 #1a9c54, 0 6px 12px rgba(46,204,113,0.3)',
  },
  btnMedium: {
    background: 'linear-gradient(135deg, #bb8fce 0%, #8e44ad 100%)',
    boxShadow: '0 4px 0 #6c3483, 0 6px 12px rgba(142,68,173,0.3)',
  },
  btnRestart: {
    background: 'linear-gradient(135deg, #f1948a 0%, #e74c3c 100%)',
    boxShadow: '0 4px 0 #c0392b, 0 6px 12px rgba(231,76,60,0.3)',
  },
  btnPlayAgain: {
    background: 'linear-gradient(135deg, #58d68d 0%, #27ae60 100%)',
    boxShadow: '0 4px 0 #1e8449, 0 6px 12px rgba(39,174,96,0.3)',
  },
  btnLang: {
    background: 'linear-gradient(135deg, #5dade2 0%, #3498db 100%)',
    boxShadow: '0 4px 0 #2471a3, 0 6px 12px rgba(52,152,219,0.3)',
  },
};
