import React, { useState } from 'react';

export interface GameSelectorProps {
  onSelectChess: () => void;
  onSelectGo: () => void;
  t: (key: string, params?: Record<string, string>) => string;
  onToggleLanguage: () => void;
}

export default function GameSelector({
  onSelectChess,
  onSelectGo,
  t,
  onToggleLanguage,
}: GameSelectorProps) {
  const [hoveredCard, setHoveredCard] = useState<'chess' | 'go' | null>(null);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{t('gameSelector.title')}</h1>

      <div style={styles.cardRow}>
        {/* Chess card */}
        <button
          data-testid="select-chess"
          style={{
            ...styles.card,
            ...styles.chessCard,
            ...(hoveredCard === 'chess' ? styles.cardHover : {}),
          }}
          onClick={onSelectChess}
          onMouseEnter={() => setHoveredCard('chess')}
          onMouseLeave={() => setHoveredCard(null)}
          aria-label={t('gameSelector.chess')}
        >
          <span style={styles.cardIcon}>♟️</span>
          <span style={styles.cardLabel}>{t('gameSelector.chess')}</span>
        </button>

        {/* Go card */}
        <button
          data-testid="select-go"
          style={{
            ...styles.card,
            ...styles.goCard,
            ...(hoveredCard === 'go' ? styles.cardHover : {}),
          }}
          onClick={onSelectGo}
          onMouseEnter={() => setHoveredCard('go')}
          onMouseLeave={() => setHoveredCard(null)}
          aria-label={t('gameSelector.go')}
        >
          <span style={styles.cardIcon}>⚫</span>
          <span style={styles.cardLabel}>{t('gameSelector.go')}</span>
        </button>
      </div>

      {/* Language toggle */}
      <button
        data-testid="language-toggle"
        style={styles.langBtn}
        onClick={onToggleLanguage}
      >
        🌐 {t('language.toggle')}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive, sans-serif',
    padding: '24px',
    boxSizing: 'border-box' as const,
    gap: '24px',
  },
  title: {
    fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
    color: '#5b2c6f',
    textShadow: '2px 2px 0 #f9e79f',
    margin: 0,
    textAlign: 'center' as const,
  },
  cardRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    width: '100%',
    maxWidth: '480px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    flex: '1 1 140px',
    maxWidth: '220px',
    aspectRatio: '0.9',
    borderRadius: '28px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive, sans-serif',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    gap: '12px',
    padding: '20px',
  },
  chessCard: {
    background: 'linear-gradient(135deg, #d6eaf8 0%, #aed6f1 100%)',
    boxShadow: '0 8px 0 #2471a3, 0 12px 24px rgba(52, 152, 219, 0.3)',
  },
  goCard: {
    background: 'linear-gradient(135deg, #d5f5e3 0%, #a9dfbf 100%)',
    boxShadow: '0 8px 0 #1e8449, 0 12px 24px rgba(46, 204, 113, 0.3)',
  },
  cardHover: {
    transform: 'translateY(-6px) scale(1.04)',
  },
  cardIcon: {
    fontSize: 'clamp(2.5rem, 8vw, 4rem)',
  },
  cardLabel: {
    fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  langBtn: {
    fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
    padding: '8px 20px',
    borderRadius: '20px',
    border: 'none',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
    boxShadow: '0 4px 0 #bdbdbd, 0 6px 12px rgba(0, 0, 0, 0.1)',
    color: '#2c3e50',
    cursor: 'pointer',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive, sans-serif',
    fontWeight: 'bold',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
};
