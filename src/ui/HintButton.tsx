import React from 'react';
import { useGameContext } from './App';
import { GameStatus } from '../game/types';

/** Convert row/col (0-7) to algebraic notation like "e2" */
function toAlgebraic(row: number, col: number): string {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = String(8 - row);
  return `${file}${rank}`;
}

export default function HintButton() {
  const { gameState, activeHint, onRequestHint, t } = useGameContext();

  const disabledStatuses = [
    GameStatus.NOT_STARTED,
    GameStatus.CHECKMATE,
    GameStatus.STALEMATE,
    GameStatus.DRAW,
  ];
  const disabled = disabledStatuses.includes(gameState.status);

  return (
    <div style={styles.wrapper} data-testid="hint-button-wrapper">
      <button
        style={{
          ...styles.button,
          ...(disabled ? styles.buttonDisabled : {}),
        }}
        onClick={onRequestHint}
        disabled={disabled}
        data-testid="hint-button"
      >
        {t('game.hint')} 💡
      </button>

      {activeHint && (
        <div style={styles.hintOverlay} data-testid="hint-overlay">
          <div style={styles.moveInfo} data-testid="hint-move">
            {toAlgebraic(activeHint.suggestedMove.from.row, activeHint.suggestedMove.from.col)}
            {' → '}
            {toAlgebraic(activeHint.suggestedMove.to.row, activeHint.suggestedMove.to.col)}
          </div>
          <div style={styles.explanation} data-testid="hint-explanation">
            {activeHint.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  button: {
    fontSize: '1.2rem',
    padding: '12px 28px',
    borderRadius: '20px',
    border: 'none',
    background: 'linear-gradient(135deg, #f9c846 0%, #f39c12 100%)',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
    fontWeight: 'bold',
    boxShadow: '0 4px 0 #d68910, 0 6px 12px rgba(243,156,18,0.3)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: '0 2px 0 #bbb',
  },
  hintOverlay: {
    background: 'linear-gradient(135deg, #d5f5e3 0%, #abebc6 100%)',
    borderRadius: '16px',
    padding: '12px 20px',
    maxWidth: '320px',
    textAlign: 'center' as const,
    boxShadow: '0 4px 12px rgba(39,174,96,0.2)',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
  },
  moveInfo: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#1a5276',
    marginBottom: '4px',
  },
  explanation: {
    fontSize: '1rem',
    color: '#2c3e50',
    lineHeight: 1.4,
  },
};
