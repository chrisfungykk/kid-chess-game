import React, { createContext, useState, useCallback, useContext } from 'react';
import { GameState, Difficulty } from '../game/types';
import { Move } from '../engine/types';
import { HintResult } from '../hints/types';
import {
  startNewGame,
  restartGame,
  selectPiece,
  makeMove,
  requestHint,
  getGameState,
  GameMoveResult,
} from '../game/gameManager';
import { setLanguage, getLanguage, translate } from '../i18n/i18nModule';
import ChessBoard from './ChessBoard';
import ScoreDisplay from './ScoreDisplay';
import HintButton from './HintButton';
import GameControls from './GameControls';
import GameStatusOverlay from './GameStatusOverlay';

// --- Game Context ---

export interface GameContextValue {
  gameState: GameState;
  legalMoves: Move[];
  selectedPosition: { row: number; col: number } | null;
  activeHint: HintResult | null;
  onStartGame: (difficulty: Difficulty) => void;
  onRestartGame: () => void;
  onSelectPiece: (row: number, col: number) => void;
  onMakeMove: (row: number, col: number) => GameMoveResult | null;
  onRequestHint: () => void;
  onToggleLanguage: () => void;
  language: string;
  t: (key: string, params?: Record<string, string>) => string;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameContext.Provider');
  return ctx;
}

// --- App Component ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>(getGameState);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
  const [activeHint, setActiveHint] = useState<HintResult | null>(null);
  const [language, setLang] = useState<string>(getLanguage);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => translate(key, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );

  const onStartGame = useCallback((difficulty: Difficulty) => {
    const state = startNewGame(difficulty);
    setGameState(state);
    setLegalMoves([]);
    setSelectedPosition(null);
    setActiveHint(null);
  }, []);

  const onRestartGame = useCallback(() => {
    const state = restartGame();
    setGameState(state);
    setLegalMoves([]);
    setSelectedPosition(null);
    setActiveHint(null);
  }, []);

  const onSelectPiece = useCallback((row: number, col: number) => {
    const moves = selectPiece({ row, col });
    setLegalMoves(moves);
    setSelectedPosition(moves.length > 0 ? { row, col } : null);
    setActiveHint(null);
  }, []);

  const onMakeMove = useCallback((row: number, col: number): GameMoveResult | null => {
    if (!selectedPosition) return null;
    const result = makeMove(selectedPosition, { row, col });
    setGameState(result.gameState);
    setLegalMoves([]);
    setSelectedPosition(null);
    setActiveHint(null);
    return result;
  }, [selectedPosition]);

  const onRequestHint = useCallback(() => {
    const hint = requestHint();
    if (hint) {
      setGameState(getGameState());
      setActiveHint(hint);
    }
  }, []);

  const onToggleLanguage = useCallback(() => {
    const next = getLanguage() === 'en' ? 'zh-TW' : 'en';
    setLanguage(next);
    setLang(next);
  }, []);

  const contextValue: GameContextValue = {
    gameState,
    legalMoves,
    selectedPosition,
    activeHint,
    onStartGame,
    onRestartGame,
    onSelectPiece,
    onMakeMove,
    onRequestHint,
    onToggleLanguage,
    language,
    t,
  };

  return (
    <GameContext.Provider value={contextValue}>
      <div style={styles.container}>
        <h1 style={styles.title}>♟️ {t('game.title', undefined)} ♟️</h1>

        <ScoreDisplay />

        {/* Game board area */}
        <div style={styles.boardArea}>
          <ChessBoard />
        </div>

        <GameStatusOverlay />

        <HintButton />

        <GameControls />
      </div>
    </GameContext.Provider>
  );
}

// --- Kid-Friendly Styles ---

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive, sans-serif',
    padding: '16px',
    position: 'relative',
  },
  title: {
    fontSize: '2.5rem',
    color: '#5b2c6f',
    textShadow: '2px 2px 0 #f9e79f',
    margin: '8px 0',
  },
  boardArea: {
    width: '100%',
    maxWidth: '480px',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
};
