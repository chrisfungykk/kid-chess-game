import { Color, Move, Position, PieceType } from '../engine/types';
import { initializeBoard } from '../engine/board';
import { getLegalMoves } from '../engine/moves';
import { executeMove, MoveResult as EngineMoveResult } from '../engine/execute';
import { checkGameStatus } from '../engine/detection';
import { selectMove } from '../ai/aiOpponent';
import { createInitialScoreState, updateScore, resetScore } from '../score/scoreSystem';
import { saveHighScore, loadHighScore } from '../score/persistence';
import { generateHint } from '../hints/hintSystem';
import { getLanguage } from '../i18n/i18nModule';
import { GameState, GameStatus, Difficulty } from './types';
import { ScoreEventType } from '../score/types';
import { HintResult } from '../hints/types';

export interface GameMoveResult {
  success: boolean;
  gameState: GameState;
  capturedPiece: { type: PieceType; color: Color } | null;
  aiMove: Move | null;
  aiCapturedPiece: { type: PieceType; color: Color } | null;
}

let gameState: GameState = {
  board: initializeBoard(),
  status: GameStatus.NOT_STARTED,
  playerColor: Color.WHITE,
  difficulty: Difficulty.EASY,
  score: createInitialScoreState(),
  hintsUsed: 0,
};

/**
 * Start a new game with the given difficulty.
 * Initializes board, loads high score, sets status to IN_PROGRESS.
 */
export function startNewGame(difficulty: Difficulty): GameState {
  const board = initializeBoard();
  const initialScore = createInitialScoreState();
  const highScore = loadHighScore();

  gameState = {
    board,
    status: GameStatus.IN_PROGRESS,
    playerColor: Color.WHITE,
    difficulty,
    score: { ...initialScore, highScore },
    hintsUsed: 0,
  };

  return { ...gameState };
}

/**
 * Restart the game, preserving high score, difficulty, and language.
 * Resets board and score to initial state.
 */
export function restartGame(): GameState {
  const board = initializeBoard();
  const preservedHighScore = gameState.score.highScore;
  const preservedDifficulty = gameState.difficulty;

  const freshScore = resetScore(gameState.score);

  gameState = {
    board,
    status: GameStatus.IN_PROGRESS,
    playerColor: Color.WHITE,
    difficulty: preservedDifficulty,
    score: { ...freshScore, highScore: preservedHighScore },
    hintsUsed: 0,
  };

  return { ...gameState };
}

/**
 * Select a piece at the given position and return its legal moves.
 * Returns an empty array if the position is invalid, empty, or not the player's piece.
 */
export function selectPiece(position: Position): Move[] {
  if (gameState.status !== GameStatus.IN_PROGRESS && gameState.status !== GameStatus.CHECK) {
    return [];
  }

  if (gameState.board.currentTurn !== gameState.playerColor) {
    return [];
  }

  const piece = gameState.board.squares[position.row]?.[position.col];
  if (!piece || piece.color !== gameState.playerColor) {
    return [];
  }

  return getLegalMoves(gameState.board, position);
}

/**
 * Execute a player move from `from` to `to`.
 *
 * Flow:
 * 1. Validate the move is legal
 * 2. Execute the move via executeMove
 * 3. If capture, update score with PIECE_CAPTURED event
 * 4. Check game status for opponent (checkmate/stalemate/check)
 * 5. If checkmate, update score with CHECKMATE_WIN and GAME_COMPLETED events
 * 6. If game still in progress, trigger AI move
 * 7. After AI move, check game status for player
 * 8. Return the result
 */
export function makeMove(from: Position, to: Position): GameMoveResult {
  // Validate game is in a playable state
  if (gameState.status !== GameStatus.IN_PROGRESS && gameState.status !== GameStatus.CHECK) {
    return { success: false, gameState: { ...gameState }, capturedPiece: null, aiMove: null, aiCapturedPiece: null };
  }

  // Validate it's the player's turn
  if (gameState.board.currentTurn !== gameState.playerColor) {
    return { success: false, gameState: { ...gameState }, capturedPiece: null, aiMove: null, aiCapturedPiece: null };
  }

  // Validate the move is legal
  const legalMoves = getLegalMoves(gameState.board, from);
  const matchingMove = legalMoves.find(
    m => m.to.row === to.row && m.to.col === to.col
  );

  if (!matchingMove) {
    return { success: false, gameState: { ...gameState }, capturedPiece: null, aiMove: null, aiCapturedPiece: null };
  }

  // Execute the player's move
  const moveResult: EngineMoveResult = executeMove(gameState.board, matchingMove);
  gameState.board = moveResult.board;

  let capturedPiece = moveResult.capturedPiece;

  // Update score if capture
  if (capturedPiece) {
    gameState.score = updateScore(gameState.score, {
      type: ScoreEventType.PIECE_CAPTURED,
      value: capturedPiece.type as unknown as number,
    });
  }

  // Check game status for opponent (BLACK)
  const opponentColor = gameState.playerColor === Color.WHITE ? Color.BLACK : Color.WHITE;
  const statusAfterPlayerMove = checkGameStatus(gameState.board, opponentColor);

  if (statusAfterPlayerMove === GameStatus.CHECKMATE) {
    gameState.status = GameStatus.CHECKMATE;
    gameState.score = updateScore(gameState.score, { type: ScoreEventType.CHECKMATE_WIN, value: 100 });
    gameState.score = updateScore(gameState.score, { type: ScoreEventType.GAME_COMPLETED, value: 0 });
    saveHighScore(gameState.score.highScore);
    return { success: true, gameState: { ...gameState }, capturedPiece, aiMove: null, aiCapturedPiece: null };
  }

  if (statusAfterPlayerMove === GameStatus.STALEMATE) {
    gameState.status = GameStatus.STALEMATE;
    gameState.score = updateScore(gameState.score, { type: ScoreEventType.GAME_COMPLETED, value: 0 });
    saveHighScore(gameState.score.highScore);
    return { success: true, gameState: { ...gameState }, capturedPiece, aiMove: null, aiCapturedPiece: null };
  }

  // Game still in progress — trigger AI move
  let aiMove: Move | null = null;
  let aiCapturedPiece: { type: PieceType; color: Color } | null = null;

  try {
    aiMove = selectMove(gameState.board, gameState.difficulty);
    const aiMoveResult: EngineMoveResult = executeMove(gameState.board, aiMove);
    gameState.board = aiMoveResult.board;
    aiCapturedPiece = aiMoveResult.capturedPiece;

    // Check game status for player after AI move
    const statusAfterAiMove = checkGameStatus(gameState.board, gameState.playerColor);

    if (statusAfterAiMove === GameStatus.CHECKMATE) {
      gameState.status = GameStatus.CHECKMATE;
      gameState.score = updateScore(gameState.score, { type: ScoreEventType.GAME_COMPLETED, value: 0 });
      saveHighScore(gameState.score.highScore);
    } else if (statusAfterAiMove === GameStatus.STALEMATE) {
      gameState.status = GameStatus.STALEMATE;
      gameState.score = updateScore(gameState.score, { type: ScoreEventType.GAME_COMPLETED, value: 0 });
      saveHighScore(gameState.score.highScore);
    } else if (statusAfterAiMove === GameStatus.CHECK) {
      gameState.status = GameStatus.CHECK;
    } else {
      gameState.status = GameStatus.IN_PROGRESS;
    }
  } catch {
    // AI has no legal moves — should have been caught by game status check
    gameState.status = statusAfterPlayerMove;
  }

  return { success: true, gameState: { ...gameState }, capturedPiece, aiMove, aiCapturedPiece };
}

/**
 * Request a hint for the current player.
 * Updates score with HINT_USED event.
 */
export function requestHint(): HintResult | null {
  if (gameState.status !== GameStatus.IN_PROGRESS && gameState.status !== GameStatus.CHECK) {
    return null;
  }

  const lang = getLanguage();
  const hint = generateHint(gameState.board, gameState.playerColor, lang);

  if (hint) {
    gameState.score = updateScore(gameState.score, {
      type: ScoreEventType.HINT_USED,
      value: 5,
    });
    gameState.hintsUsed += 1;
  }

  return hint;
}

/**
 * Get the current game state (immutable copy).
 */
export function getGameState(): GameState {
  return { ...gameState };
}
