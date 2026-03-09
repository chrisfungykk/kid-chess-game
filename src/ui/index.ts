// UI Layer module
// Kid-friendly visual interface components

export { default as App, GameContext, useGameContext } from './App';
export type { GameContextValue } from './App';
export { default as ChessBoard } from './ChessBoard';
export { default as Square } from './Square';
export type { SquareProps } from './Square';
export { default as ChessPiece } from './ChessPiece';
export type { ChessPieceProps } from './ChessPiece';
export { getPieceSymbol } from './ChessPiece';
export { default as ScoreDisplay } from './ScoreDisplay';
export { default as HintButton } from './HintButton';
export { default as GameControls } from './GameControls';
export { default as GameStatusOverlay } from './GameStatusOverlay';
