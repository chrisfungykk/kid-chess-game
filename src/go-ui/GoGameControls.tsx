import React, { useState } from 'react';
import { StoneColor } from '../go-engine/types';

export interface GoGameControlsProps {
  gameStatus: 'idle' | 'playing' | 'finished';
  currentTurn: StoneColor;
  isPlayerTurn: boolean;
  score: number;
  highScore: number;
  difficulty: 'easy' | 'medium';
  mode: 'vs_ai' | 'vs_player';
  onPass: () => void;
  onResign: () => void;
  onHint: () => void;
  onNewGame: (difficulty: 'easy' | 'medium', mode: 'vs_ai' | 'vs_player') => void;
  onBack: () => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export default function GoGameControls({
  gameStatus,
  currentTurn,
  isPlayerTurn,
  score,
  highScore,
  difficulty,
  mode,
  onPass,
  onResign,
  onHint,
  onNewGame,
  onBack,
  t,
}: GoGameControlsProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium'>(difficulty);
  const [selectedMode, setSelectedMode] = useState<'vs_ai' | 'vs_player'>(mode);

  const isPlaying = gameStatus === 'playing';
  const isIdle = gameStatus === 'idle';
  const isFinished = gameStatus === 'finished';

  const handleResign = () => {
    if (window.confirm(t('go.confirmResign'))) {
      onResign();
    }
  };

  return (
    <div style={styles.wrapper} data-testid="go-game-controls">
      {/* Turn indicator */}
      {isPlaying && (
        <div style={styles.turnIndicator} data-testid="turn-indicator">
          {currentTurn === StoneColor.BLACK ? t('go.turn.black') : t('go.turn.white')}
        </div>
      )}

      {/* Score display */}
      <div style={styles.scoreWrapper} data-testid="go-score-display">
        <div style={styles.scoreBox}>
          <span style={styles.emoji}>⭐</span>
          <span style={styles.scoreLabel}>{t('score.current', { score: String(score) })}</span>
        </div>
        <div style={styles.scoreBox}>
          <span style={styles.emoji}>🏆</span>
          <span style={styles.scoreLabel}>{t('score.high', { score: String(highScore) })}</span>
        </div>
      </div>

      {/* Action buttons when playing */}
      {isPlaying && (
        <div style={styles.buttonRow} data-testid="action-buttons">
          <button
            style={{ ...styles.btn, ...styles.btnPass }}
            onClick={onPass}
            disabled={!isPlayerTurn}
            data-testid="pass-btn"
          >
            ✋ {t('go.pass')}
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnHint }}
            onClick={onHint}
            disabled={!isPlayerTurn}
            data-testid="hint-btn"
          >
            {t('game.hint')} 💡
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnResign }}
            onClick={handleResign}
            data-testid="resign-btn"
          >
            🏳️ {t('go.resign')}
          </button>
        </div>
      )}

      {/* Setup controls when idle or finished */}
      {(isIdle || isFinished) && (
        <div style={styles.setupSection} data-testid="setup-controls">
          {/* Difficulty selector */}
          <div style={styles.selectorGroup}>
            <button
              style={{
                ...styles.selectorBtn,
                ...(selectedDifficulty === 'easy' ? styles.selectorActive : {}),
              }}
              onClick={() => setSelectedDifficulty('easy')}
              data-testid="difficulty-easy-btn"
            >
              🎮 {t('go.difficulty.easy')}
            </button>
            <button
              style={{
                ...styles.selectorBtn,
                ...(selectedDifficulty === 'medium' ? styles.selectorActive : {}),
              }}
              onClick={() => setSelectedDifficulty('medium')}
              data-testid="difficulty-medium-btn"
            >
              🧠 {t('go.difficulty.medium')}
            </button>
          </div>

          {/* Mode selector */}
          <div style={styles.selectorGroup}>
            <button
              style={{
                ...styles.selectorBtn,
                ...(selectedMode === 'vs_ai' ? styles.selectorActive : {}),
              }}
              onClick={() => setSelectedMode('vs_ai')}
              data-testid="mode-vs-ai-btn"
            >
              🤖 {t('go.mode.vsAi')}
            </button>
            <button
              style={{
                ...styles.selectorBtn,
                ...(selectedMode === 'vs_player' ? styles.selectorActive : {}),
              }}
              onClick={() => setSelectedMode('vs_player')}
              data-testid="mode-vs-player-btn"
            >
              👫 {t('go.mode.vsPlayer')}
            </button>
          </div>

          {/* New Game / Play Again button */}
          <button
            style={{ ...styles.btn, ...styles.btnNewGame }}
            onClick={() => onNewGame(selectedDifficulty, selectedMode)}
            data-testid="new-game-btn"
          >
            🎯 {isFinished ? t('go.playAgain') : t('go.newGame')}
          </button>
        </div>
      )}

      {/* Back button */}
      <button
        style={{ ...styles.btn, ...styles.btnBack }}
        onClick={onBack}
        data-testid="back-btn"
      >
        ← {t('gameSelector.title')}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px',
    width: '100%',
    maxWidth: '480px',
    boxSizing: 'border-box' as const,
    padding: '0 8px',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
  },
  turnIndicator: {
    fontSize: 'clamp(1rem, 3.5vw, 1.3rem)',
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: '4px 14px',
    background: '#ffffffcc',
    borderRadius: '20px',
    textAlign: 'center' as const,
  },
  scoreWrapper: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    width: '100%',
  },
  scoreBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#ffffffcc',
    borderRadius: '20px',
    padding: '6px 12px',
    fontSize: 'clamp(0.9rem, 3vw, 1.15rem)',
    fontWeight: 'bold',
    color: '#1a5276',
  },
  emoji: {
    fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)',
  },
  scoreLabel: {
    whiteSpace: 'nowrap' as const,
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    width: '100%',
  },
  btn: {
    fontSize: 'clamp(0.85rem, 3vw, 1.1rem)',
    padding: '8px 14px',
    borderRadius: '20px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
    fontWeight: 'bold',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    whiteSpace: 'nowrap' as const,
    flex: '1 1 auto',
    minWidth: '0',
    textAlign: 'center' as const,
  },
  btnPass: {
    background: 'linear-gradient(135deg, #58d68d 0%, #2ecc71 100%)',
    boxShadow: '0 4px 0 #1a9c54, 0 6px 12px rgba(46,204,113,0.3)',
  },
  btnHint: {
    background: 'linear-gradient(135deg, #f9e154 0%, #f1c40f 100%)',
    boxShadow: '0 4px 0 #d4ac0d, 0 6px 12px rgba(241,196,15,0.3)',
    color: '#2c3e50',
  },
  btnResign: {
    background: 'linear-gradient(135deg, #f1948a 0%, #e74c3c 100%)',
    boxShadow: '0 4px 0 #c0392b, 0 6px 12px rgba(231,76,60,0.3)',
  },
  btnNewGame: {
    background: 'linear-gradient(135deg, #5dade2 0%, #3498db 100%)',
    boxShadow: '0 4px 0 #2471a3, 0 6px 12px rgba(52,152,219,0.3)',
    flex: '0 0 auto',
  },
  btnBack: {
    background: 'linear-gradient(135deg, #aab7b8 0%, #7f8c8d 100%)',
    boxShadow: '0 4px 0 #616a6b, 0 6px 12px rgba(127,140,141,0.3)',
    flex: '0 0 auto',
  },
  setupSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  selectorGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    width: '100%',
  },
  selectorBtn: {
    fontSize: 'clamp(0.8rem, 2.8vw, 1rem)',
    padding: '6px 12px',
    borderRadius: '16px',
    border: '2px solid #bdc3c7',
    background: '#ecf0f1',
    color: '#2c3e50',
    cursor: 'pointer',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
    fontWeight: 'bold',
    transition: 'all 0.15s ease',
    flex: '1 1 auto',
    minWidth: '0',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  },
  selectorActive: {
    border: '2px solid #3498db',
    background: 'linear-gradient(135deg, #d6eaf8 0%, #aed6f1 100%)',
    color: '#1a5276',
    boxShadow: '0 2px 8px rgba(52,152,219,0.3)',
  },
};
