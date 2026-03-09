import React, { useEffect, useRef, useState } from 'react';
import { useGameContext } from './App';

export default function ScoreDisplay() {
  const { gameState, t } = useGameContext();
  const { currentScore, highScore } = gameState.score;
  const prevScoreRef = useRef(currentScore);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (currentScore > prevScoreRef.current) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 800);
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = currentScore;
  }, [currentScore]);

  // Update ref after celebration triggers
  useEffect(() => {
    prevScoreRef.current = currentScore;
  }, [currentScore]);

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.wrapper} data-testid="score-display">
        <div
          style={{
            ...styles.scoreBox,
            ...(celebrating ? styles.scoreBoxCelebrating : {}),
          }}
        >
          <span style={styles.emoji}>⭐</span>
          <span style={styles.label}>{t('score.current', { score: String(currentScore) })}</span>
          {celebrating && (
            <span style={styles.sparkles} data-testid="score-celebration">
              ✨🌟✨
            </span>
          )}
        </div>
        <div style={styles.scoreBox}>
          <span style={styles.emoji}>🏆</span>
          <span style={styles.label}>{t('score.high', { score: String(highScore) })}</span>
        </div>
      </div>
    </>
  );
}

const keyframes = `
@keyframes scoreBounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.15); }
  60% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
@keyframes sparkle {
  0% { opacity: 0; transform: scale(0.5) translateY(0); }
  50% { opacity: 1; transform: scale(1.2) translateY(-6px); }
  100% { opacity: 0; transform: scale(0.5) translateY(-12px); }
}
`;

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  scoreBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffffcc',
    borderRadius: '20px',
    padding: '8px 20px',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1a5276',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
    position: 'relative' as const,
    transition: 'transform 0.2s ease',
  },
  scoreBoxCelebrating: {
    animation: 'scoreBounce 0.6s ease',
  },
  emoji: {
    fontSize: '1.5rem',
  },
  label: {
    whiteSpace: 'nowrap' as const,
  },
  sparkles: {
    position: 'absolute' as const,
    top: '-8px',
    right: '-4px',
    fontSize: '1rem',
    animation: 'sparkle 0.8s ease forwards',
    pointerEvents: 'none' as const,
  },
};
