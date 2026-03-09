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

// Go imports
import { GoBoard, GoGameControls, GoGameStatusOverlay, GameSelector } from '../go-ui';
import {
  startNewGoGame,
  makeGoMove,
  passGoTurn,
  resignGoGame,
  requestGoHint,
  getGoGameState,
} from '../go-game';
import type { GoGameState } from '../go-game/types';
import type { GoPosition } from '../go-engine/types';
import { StoneColor, findTerritory } from '../go-engine';

// --- Game Context (Chess) ---

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

// --- Selected game type ---
type SelectedGame = 'none' | 'chess' | 'go';

// --- App Component ---

export default function App() {
  // Game selector state
  const [selectedGame, setSelectedGame] = useState<SelectedGame>('none');

  // --- Chess state ---
  const [gameState, setGameState] = useState<GameState>(getGameState);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
  const [activeHint, setActiveHint] = useState<HintResult | null>(null);

  // --- Go state ---
  const [goGameState, setGoGameState] = useState<GoGameState>(getGoGameState);

  // --- Shared state ---
  const [language, setLang] = useState<string>(getLanguage);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => translate(key, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );

  const onToggleLanguage = useCallback(() => {
    const next = getLanguage() === 'en' ? 'zh-TW' : 'en';
    setLanguage(next);
    setLang(next);
  }, []);

  // --- Chess handlers ---
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

  // --- Go handlers ---
  const onGoNewGame = useCallback((difficulty: 'easy' | 'medium', mode: 'vs_ai' | 'vs_player') => {
    const state = startNewGoGame(difficulty, mode);
    setGoGameState(state);
  }, []);

  const onGoMove = useCallback((pos: GoPosition) => {
    const result = makeGoMove(pos);
    setGoGameState(result.gameState);
  }, []);

  const onGoPass = useCallback(() => {
    const result = passGoTurn();
    setGoGameState(result.gameState);
  }, []);

  const onGoResign = useCallback(() => {
    const state = resignGoGame();
    setGoGameState(state);
  }, []);

  const onGoHint = useCallback(() => {
    const state = requestGoHint();
    setGoGameState(state);
  }, []);

  // --- Go derived state ---
  const isGoPlayerTurn =
    goGameState.mode === 'vs_player'
      ? true
      : goGameState.board.currentTurn === StoneColor.BLACK;

  const goTerritoryMap =
    goGameState.status === 'finished' && goGameState.scoreResult
      ? findTerritory(goGameState.board)
      : null;

  // --- Chess context ---
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

  // --- Game Selector view ---
  if (selectedGame === 'none') {
    return (
      <GameSelector
        onSelectChess={() => setSelectedGame('chess')}
        onSelectGo={() => setSelectedGame('go')}
        t={t}
        onToggleLanguage={onToggleLanguage}
      />
    );
  }

  // --- Go game view ---
  if (selectedGame === 'go') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>⚫ {t('go.title')} ⚫</h1>

        <GoGameControls
          gameStatus={goGameState.status}
          currentTurn={goGameState.board.currentTurn}
          isPlayerTurn={isGoPlayerTurn}
          score={goGameState.score}
          highScore={goGameState.highScore}
          difficulty={goGameState.difficulty}
          mode={goGameState.mode}
          onPass={onGoPass}
          onResign={onGoResign}
          onHint={onGoHint}
          onNewGame={onGoNewGame}
          onBack={() => setSelectedGame('none')}
          t={t}
        />

        <div style={styles.boardArea}>
          <GoBoard
            board={goGameState.board}
            currentTurn={goGameState.board.currentTurn}
            isPlayerTurn={isGoPlayerTurn}
            onIntersectionClick={onGoMove}
            territoryMap={goTerritoryMap}
            hintPosition={goGameState.lastHint?.position ?? null}
            gameStatus={goGameState.status}
          />
        </div>

        <GoGameStatusOverlay
          gameStatus={goGameState.status}
          winner={goGameState.winner}
          scoreResult={goGameState.scoreResult}
          t={t}
        />

        {/* Language toggle */}
        <button
          data-testid="language-toggle-btn"
          style={styles.langBtn}
          onClick={onToggleLanguage}
        >
          🌐 {t('language.toggle')}
        </button>
      </div>
    );
  }

  // --- Chess game view (default) ---
  return (
    <GameContext.Provider value={contextValue}>
      <div style={styles.container}>
        <h1 style={styles.title}>♟️ {t('game.title', undefined)} ♟️</h1>

        <ScoreDisplay />

        <div style={styles.boardArea}>
          <ChessBoard />
        </div>

        <GameStatusOverlay />

        <HintButton />

        <GameControls />

        {/* Back to game selector */}
        <button
          data-testid="back-to-selector-btn"
          style={styles.backBtn}
          onClick={() => setSelectedGame('none')}
        >
          ← {t('gameSelector.title')}
        </button>
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
  langBtn: {
    fontSize: '1.1rem',
    padding: '10px 28px',
    borderRadius: '20px',
    border: 'none',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
    boxShadow: '0 4px 0 #bdbdbd, 0 6px 12px rgba(0, 0, 0, 0.1)',
    color: '#2c3e50',
    cursor: 'pointer',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive, sans-serif',
    fontWeight: 'bold',
    marginTop: '12px',
  },
  backBtn: {
    fontSize: '1rem',
    padding: '8px 20px',
    borderRadius: '20px',
    border: 'none',
    background: 'linear-gradient(135deg, #aab7b8 0%, #7f8c8d 100%)',
    boxShadow: '0 4px 0 #616a6b, 0 6px 12px rgba(127,140,141,0.3)',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive, sans-serif',
    fontWeight: 'bold',
    marginTop: '12px',
  },
};
