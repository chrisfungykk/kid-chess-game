import { createEmptyBoard, placeStone, calculateScore, type GoPosition, StoneColor } from '../go-engine';
import { selectGoMove, GoDifficulty } from '../go-ai';
import { generateGoHint } from '../go-hints';
import { GoGameState, GoGameMode, GoMoveResult } from './types';
import { saveGoHighScore, loadGoHighScore } from '../score/persistence';
import { getLanguage } from '../i18n/i18nModule';

const HINT_PENALTY = 5;

let state: GoGameState = {
  board: createEmptyBoard(),
  status: 'idle',
  difficulty: 'easy',
  mode: 'vs_ai',
  score: 0,
  highScore: 0,
  hintsUsed: 0,
  lastHint: null,
  scoreResult: null,
  winner: null,
};

/**
 * Start a new Go game with the given difficulty and mode.
 * Initializes board, loads high score, resets all game state.
 */
export function startNewGoGame(difficulty: GoDifficulty, mode: GoGameMode): GoGameState {
  const highScore = loadGoHighScore();

  state = {
    board: createEmptyBoard(),
    status: 'playing',
    difficulty,
    mode,
    score: 0,
    highScore,
    hintsUsed: 0,
    lastHint: null,
    scoreResult: null,
    winner: null,
  };

  return { ...state };
}

/**
 * Restart the current game, preserving difficulty, mode, and high score.
 */
export function restartGoGame(): GoGameState {
  const preservedHighScore = state.highScore;
  const preservedDifficulty = state.difficulty;
  const preservedMode = state.mode;

  state = {
    board: createEmptyBoard(),
    status: 'playing',
    difficulty: preservedDifficulty,
    mode: preservedMode,
    score: 0,
    highScore: preservedHighScore,
    hintsUsed: 0,
    lastHint: null,
    scoreResult: null,
    winner: null,
  };

  return { ...state };
}

/**
 * End the game by scoring. Calculates territory scores and determines winner.
 */
function endGameWithScoring(): void {
  const scoreResult = calculateScore(state.board);
  state.status = 'finished';
  state.scoreResult = scoreResult;
  state.winner = scoreResult.winner;
  saveGoHighScore(state.highScore);
}

/**
 * Trigger an AI move after the human player's action.
 * If AI returns null, it passes (increment consecutivePasses, check double-pass).
 */
function triggerAiMove(): void {
  const aiMove = selectGoMove(state.board, state.difficulty as GoDifficulty);

  if (aiMove === null) {
    // AI passes
    state.board = {
      ...state.board,
      consecutivePasses: state.board.consecutivePasses + 1,
      currentTurn: state.board.currentTurn === StoneColor.BLACK ? StoneColor.WHITE : StoneColor.BLACK,
    };

    if (state.board.consecutivePasses >= 2) {
      endGameWithScoring();
    }
  } else {
    const aiResult = placeStone(state.board, aiMove);
    if (aiResult.success) {
      state.board = aiResult.board;
    }
    // If AI move fails (shouldn't happen), silently skip
  }
}

/**
 * Place a stone at the given position.
 * In VS_AI mode, triggers an AI response move after a successful human move.
 */
export function makeGoMove(pos: GoPosition): GoMoveResult {
  if (state.status !== 'playing') {
    return { success: false, gameState: { ...state }, captured: 0, error: 'Game is not in progress' };
  }

  // In VS_AI mode, human plays as BLACK. Block moves when it's WHITE's turn.
  if (state.mode === 'vs_ai' && state.board.currentTurn === StoneColor.WHITE) {
    return { success: false, gameState: { ...state }, captured: 0, error: 'Not your turn' };
  }

  const result = placeStone(state.board, pos);

  if (!result.success) {
    return { success: false, gameState: { ...state }, captured: 0, error: result.error };
  }

  state.board = result.board;
  const capturedCount = result.captured.length;

  // Update score: captured stones * 10 points
  state.score += capturedCount * 10;

  // Update high score if needed
  if (state.score > state.highScore) {
    state.highScore = state.score;
  }
  saveGoHighScore(state.highScore);

  // In VS_AI mode, trigger AI move after human move
  if (state.mode === 'vs_ai' && state.status === 'playing') {
    triggerAiMove();
  }

  return { success: true, gameState: { ...state }, captured: capturedCount };
}

/**
 * Pass the current player's turn.
 * If two consecutive passes occur, the game ends with scoring.
 * In VS_AI mode, triggers AI move after human pass.
 */
export function passGoTurn(): GoMoveResult {
  if (state.status !== 'playing') {
    return { success: false, gameState: { ...state }, captured: 0, error: 'Game is not in progress' };
  }

  // Increment consecutive passes and switch turn
  state.board = {
    ...state.board,
    consecutivePasses: state.board.consecutivePasses + 1,
    currentTurn: state.board.currentTurn === StoneColor.BLACK ? StoneColor.WHITE : StoneColor.BLACK,
  };

  // Check double-pass game end
  if (state.board.consecutivePasses >= 2) {
    endGameWithScoring();
    return { success: true, gameState: { ...state }, captured: 0 };
  }

  // In VS_AI mode, trigger AI move after human pass
  if (state.mode === 'vs_ai' && state.status === 'playing') {
    triggerAiMove();
  }

  return { success: true, gameState: { ...state }, captured: 0 };
}

/**
 * Resign the current game. The opponent of the current turn wins.
 */
export function resignGoGame(): GoGameState {
  state.status = 'finished';
  state.winner = state.board.currentTurn === StoneColor.BLACK ? StoneColor.WHITE : StoneColor.BLACK;
  saveGoHighScore(state.highScore);
  return { ...state };
}

/**
 * Request a hint for the current position.
 * Applies a score penalty of -5 points (minimum 0) and increments hintsUsed.
 */
export function requestGoHint(): GoGameState {
  if (state.status !== 'playing') {
    return { ...state };
  }

  const lang = getLanguage();
  const hint = generateGoHint(state.board, state.board.currentTurn, lang);

  if (hint) {
    state.lastHint = hint;
    state.score = Math.max(0, state.score - HINT_PENALTY);
    state.hintsUsed += 1;
  }

  return { ...state };
}

/**
 * Get an immutable copy of the current game state.
 */
export function getGoGameState(): GoGameState {
  return { ...state };
}
