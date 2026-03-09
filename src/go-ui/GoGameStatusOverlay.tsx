import React from 'react';
import { StoneColor, GoScoreResult } from '../go-engine/types';

export interface GoGameStatusOverlayProps {
  gameStatus: 'idle' | 'playing' | 'finished';
  winner: StoneColor | 'tie' | null;
  scoreResult: GoScoreResult | null;
  t: (key: string, params?: Record<string, string>) => string;
}

export default function GoGameStatusOverlay({
  gameStatus,
  winner,
  scoreResult,
  t,
}: GoGameStatusOverlayProps) {
  if (gameStatus !== 'finished') {
    return null;
  }

  const winnerMessage =
    winner === StoneColor.BLACK
      ? t('go.status.blackWins')
      : winner === StoneColor.WHITE
        ? t('go.status.whiteWins')
        : t('go.status.tie');

  return (
    <div data-testid="go-status-overlay" style={styles.overlay}>
      <div data-testid="go-status-modal" style={styles.modal}>
        {scoreResult ? (
          <>
            <p data-testid="go-winner-message" style={styles.message}>
              {winnerMessage}
            </p>
            <div style={styles.scoresContainer}>
              <div style={styles.scoreCard} data-testid="go-black-score">
                <span style={styles.stoneIcon}>⚫</span>
                <span style={styles.scoreTotal}>{t('go.black')}: {scoreResult.blackScore}</span>
                <span style={styles.scoreDetail}>
                  {t('go.territory')}: {scoreResult.blackTerritory}, {t('go.score')}: {scoreResult.blackStones}
                </span>
              </div>
              <div style={styles.scoreCard} data-testid="go-white-score">
                <span style={styles.stoneIcon}>⚪</span>
                <span style={styles.scoreTotal}>{t('go.white')}: {scoreResult.whiteScore}</span>
                <span style={styles.scoreDetail}>
                  {t('go.territory')}: {scoreResult.whiteTerritory}, {t('go.score')}: {scoreResult.whiteStones}, {t('go.komi')}: {scoreResult.komi}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p data-testid="go-resign-message" style={styles.message}>
            {t('go.status.resigned', {
              player: winner === StoneColor.BLACK ? t('go.white') : t('go.black'),
            })}
          </p>
        )}
      </div>
    </div>
  );
}

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
    padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 48px)',
    textAlign: 'center' as const,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
    maxWidth: '440px',
    width: '90%',
    boxSizing: 'border-box' as const,
  },
  message: {
    fontSize: 'clamp(1.4rem, 4.5vw, 2rem)',
    fontWeight: 'bold',
    color: '#5b2c6f',
    margin: '0 0 20px',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
    lineHeight: 1.3,
  },
  scoresContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  scoreCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    background: '#ffffffcc',
    borderRadius: '16px',
    padding: '12px 20px',
  },
  stoneIcon: {
    fontSize: '1.6rem',
  },
  scoreTotal: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
  },
  scoreDetail: {
    fontSize: '0.95rem',
    color: '#7f8c8d',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
  },
};
