# Implementation Plan: Kids Chess Game

## Overview

Build a kid-friendly, web-based chess game using TypeScript with React. The implementation follows an incremental approach: core chess engine first, then game management, AI, scoring, hints, i18n, and finally the UI layer wiring everything together. All chess logic, scoring, and hint generation run client-side. Property-based tests use fast-check and unit tests use vitest.

## Tasks

- [x] 1. Set up project structure and core types
  - [x] 1.1 Initialize a Vite + React + TypeScript project with vitest and fast-check
    - Create project with `npm create vite` using react-ts template
    - Install dependencies: vitest, fast-check, @testing-library/react
    - Configure vitest in vite.config.ts
    - Set up directory structure: `src/engine/`, `src/game/`, `src/ai/`, `src/score/`, `src/hints/`, `src/i18n/`, `src/ui/`
    - _Requirements: 12.1, 12.5_

  - [x] 1.2 Define core data model types and interfaces
    - Create `src/engine/types.ts` with: `PieceType`, `Color`, `Piece`, `Position`, `Move`, `MoveRecord`, `Board`, `CastlingRights`
    - Create `src/game/types.ts` with: `GameState`, `GameStatus`, `Difficulty`
    - Create `src/score/types.ts` with: `ScoreState`, `ScoreEvent`, `ScoreEventType`
    - Create `src/hints/types.ts` with: `HintResult`
    - Create `src/i18n/types.ts` with: `Language`, `TranslationMap`
    - Ensure Position row/col are 0-7, Color is WHITE/BLACK, Difficulty is EASY/MEDIUM
    - _Requirements: 1.1, 9.1_

- [x] 2. Implement Chess Engine — board and move generation
  - [x] 2.1 Implement board initialization and utility functions
    - Create `src/engine/board.ts` with `initializeBoard()` returning standard starting position with all 32 pieces
    - Implement `isValidPosition(pos)` returning true iff row and col are in [0,7]
    - Implement `getPiece(board, pos)` and `cloneBoard(board)` for immutable operations
    - _Requirements: 1.2, 10.1_

  - [x] 2.2 Write property test: Board Consistency (Property 6)
    - **Property 6: Board Consistency (King Count Invariant)**
    - After initialization, board must contain exactly 1 WHITE king and 1 BLACK king
    - **Validates: Requirements 9.3**

  - [x] 2.3 Implement move generation for all piece types
    - Create `src/engine/moves.ts` with functions: `generatePawnMoves`, `generateKnightMoves`, `generateSlidingMoves` (bishop/rook/queen), `generateKingMoves`
    - Include pawn double-move from starting rank, en passant captures, castling moves
    - Implement `getLegalMoves(board, position)` that filters pseudo-legal moves by king safety
    - Implement `getAllLegalMoves(board, color)` for all pieces of a color
    - _Requirements: 2.1, 9.1, 9.2, 9.5, 9.6, 9.7_

  - [x] 2.4 Write property test: Move Legality (Property 1)
    - **Property 1: Move Legality**
    - For any valid board state and piece, every move from getLegalMoves must be legal and produce a valid board
    - **Validates: Requirements 2.1, 2.2, 9.1, 9.2**

  - [x] 2.5 Write property test: King Safety (Property 2)
    - **Property 2: King Safety**
    - No legal move may leave the moving player's own king in check
    - **Validates: Requirements 9.2**

  - [x] 2.6 Implement move execution and simulation
    - Create `src/engine/execute.ts` with `executeMove(board, move)` returning `MoveResult` with updated board and capture info
    - Implement `simulateMove(board, move)` that returns a new board without mutating the original
    - Handle special moves: castling (move both king and rook), en passant (remove captured pawn), pawn promotion (default to Queen)
    - _Requirements: 2.2, 2.5, 2.6, 2.7, 9.5, 9.6, 9.7, 10.1_

  - [x] 2.7 Write property test: Immutable Move Simulation (Property 11)
    - **Property 11: Immutable Move Simulation**
    - simulateMove must return a new board without modifying the original board
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x] 2.8 Implement check, checkmate, and stalemate detection
    - Create `src/engine/detection.ts` with `isCheck(board, color)`, `isCheckmate(board, color)`, `isStalemate(board, color)`
    - Implement `checkGameStatus(board, color)` returning GameStatus
    - _Requirements: 6.1, 6.2, 6.3, 9.2_

  - [x] 2.9 Write property test: Game Termination Detection (Property 9)
    - **Property 9: Game Termination Detection**
    - If current player has no legal moves: CHECKMATE if king in check, STALEMATE if not
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 2.10 Implement position evaluation function
    - Create `src/engine/evaluation.ts` with `evaluatePosition(board)` returning a numeric score
    - Use material counting with piece values: Pawn=1, Knight=3, Bishop=3, Rook=5, Queen=9
    - Add simple positional bonuses (center control, piece development)
    - _Requirements: 3.2, 3.3, 5.1_

- [x] 3. Checkpoint — Chess Engine
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Score System
  - [x] 4.1 Implement score tracking and update logic
    - Create `src/score/scoreSystem.ts` with `updateScore(scoreState, event)` returning new ScoreState
    - Implement `calculateCapturePoints(pieceType)`: Pawn=10, Knight=30, Bishop=30, Rook=50, Queen=90
    - Implement checkmate bonus (100 points), hint penalty (5 points), floor at zero
    - Implement `resetScore()` preserving highScore
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Write property test: Score Non-Negativity (Property 4)
    - **Property 4: Score Non-Negativity**
    - For any sequence of score events, currentScore must always be >= 0
    - **Validates: Requirements 4.4**

  - [x] 4.3 Write property test: Capture Score Correctness (Property 5)
    - **Property 5: Capture Score Correctness**
    - Each captured piece type must award exactly the defined point value
    - **Validates: Requirements 4.1**

  - [x] 4.4 Implement high score persistence with localStorage
    - Create `src/score/persistence.ts` with `saveHighScore(score)` and `loadHighScore()`
    - Handle localStorage unavailability gracefully (session-only fallback)
    - Validate data on read from localStorage
    - _Requirements: 4.5, 4.6, 11.1, 11.2, 11.3_

  - [x] 4.5 Write property test: High Score Persistence Round-Trip (Property 12)
    - **Property 12: High Score Persistence Round-Trip**
    - Saving a high score and reading it back must return the same value
    - **Validates: Requirements 11.1, 11.2, 4.5, 4.6**

- [x] 5. Implement AI Opponent
  - [x] 5.1 Implement AI move selection with difficulty levels
    - Create `src/ai/aiOpponent.ts` with `selectMove(board, difficulty)` returning a Move
    - EASY: 70% random legal move, 30% best evaluated move (depth 1)
    - MEDIUM: 30% random legal move, 70% best evaluated move (depth 2)
    - Implement `findBestMove(board, moves, depth)` using minimax with the evaluation function
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 5.2 Write property test: AI Move Legality (Property 7 — AI part)
    - **Property 7: AI and Hint Move Legality (AI)**
    - AI's selected move must always be a member of the legal moves set
    - **Validates: Requirements 3.5**

- [x] 6. Implement Hint System
  - [x] 6.1 Implement hint generation and explanation
    - Create `src/hints/hintSystem.ts` with `generateHint(board, playerColor)` returning HintResult
    - Evaluate all legal moves, pick the highest-scored move
    - Add capture and checkmate bonuses to evaluation
    - Implement `getHintExplanation(move, board, lang)` returning a kid-friendly string in the active language
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 6.2 Write property test: Hint Move Legality (Property 7 — Hint part)
    - **Property 7: AI and Hint Move Legality (Hint)**
    - Hint's suggested move must always be a member of the legal moves set
    - **Validates: Requirements 5.1, 5.4**

- [x] 7. Implement i18n Module
  - [x] 7.1 Implement translation module with EN and ZH-TW support
    - Create `src/i18n/translations.ts` with translation maps for "en" and "zh-TW"
    - Include translations for: UI labels, piece names, hint explanations, score messages, game status text, welcome/restart messages
    - Create `src/i18n/i18nModule.ts` with `setLanguage(lang)`, `getLanguage()`, `translate(key, params?)`
    - Implement fallback: return key itself if translation not found
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 7.2 Write property test: Translation Completeness and Fallback (Property 8)
    - **Property 8: Translation Completeness and Fallback**
    - All UI keys must have non-empty translations in both "en" and "zh-TW"; missing keys return the key itself
    - **Validates: Requirements 8.3, 8.4**

  - [x] 7.3 Write property test: Language Switch Reactivity (Property 13)
    - **Property 13: Language Switch Reactivity**
    - After switching language, all translate calls return strings in the new language
    - **Validates: Requirements 8.2, 8.5**

- [x] 8. Checkpoint — Core Logic Modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Game Manager
  - [x] 9.1 Implement Game Manager coordinating all subsystems
    - Create `src/game/gameManager.ts` with: `startNewGame(difficulty)`, `restartGame()`, `selectPiece(position)`, `makeMove(from, to)`, `requestHint()`, `getGameState()`
    - Wire together Chess Engine, AI Opponent, Score System, Hint System, and i18n Module
    - Manage turn alternation (WHITE → BLACK → WHITE)
    - Handle game-over detection after each move
    - Trigger AI move after player's turn
    - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 3.1, 5.5, 6.1, 6.2, 6.3, 7.1, 9.4_

  - [x] 9.2 Write property test: Turn Alternation (Property 3)
    - **Property 3: Turn Alternation**
    - After every executed move, the current turn must switch between WHITE and BLACK
    - **Validates: Requirements 9.4**

  - [x] 9.3 Write property test: Restart Preservation (Property 10)
    - **Property 10: Restart Preservation**
    - Restarting preserves high score, difficulty, and language while resetting board and score to zero
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x] 9.4 Write property test: Illegal Move Rejection (Property 14)
    - **Property 14: Illegal Move Rejection**
    - Attempting an illegal move must leave the board state completely unchanged
    - **Validates: Requirements 2.3**

- [x] 10. Checkpoint — Game Manager
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Build UI Layer — Board and Pieces
  - [x] 11.1 Create the main App component with game layout
    - Create `src/ui/App.tsx` as the root component
    - Include game board area, score display, control buttons (Play, Restart, Hint, Language toggle)
    - Apply kid-friendly theme: bright colors, rounded corners, large fonts, playful styling
    - Use React context or state management to provide GameManager state to child components
    - _Requirements: 1.3, 12.1_

  - [x] 11.2 Create the ChessBoard and Square components
    - Create `src/ui/ChessBoard.tsx` rendering an 8x8 grid of Square components
    - Create `src/ui/Square.tsx` with click/tap handlers, highlight states (selected, valid move, check)
    - Highlight valid destination squares with green dots when a piece is selected
    - Support both tap-to-move and drag-and-drop interaction
    - _Requirements: 2.1, 2.4, 12.2, 12.3_

  - [x] 11.3 Create the ChessPiece component with animations
    - Create `src/ui/ChessPiece.tsx` rendering large, kid-friendly piece graphics (SVG or emoji-based)
    - Implement smooth move animations using CSS transitions
    - Implement gentle shake animation for invalid move attempts
    - Ensure animations run at 60fps
    - _Requirements: 2.2, 2.3, 3.4, 12.1, 12.3, 12.5_

- [x] 12. Build UI Layer — Controls and Displays
  - [x] 12.1 Create ScoreDisplay component
    - Create `src/ui/ScoreDisplay.tsx` showing current score and high score
    - Add celebratory animations (stars/sparkles) when score increases
    - _Requirements: 4.7, 12.4_

  - [x] 12.2 Create HintButton and hint overlay
    - Create `src/ui/HintButton.tsx` with the "Hint 💡" button
    - Show glow effect on suggested piece and arrow to destination when hint is active
    - Display hint explanation text in the active language
    - _Requirements: 5.2, 5.3_

  - [x] 12.3 Create GameControls component (Play, Restart, Difficulty, Language)
    - Create `src/ui/GameControls.tsx` with Play/Restart buttons, difficulty selector, and language toggle
    - Wire Play button to `startNewGame(difficulty)`
    - Wire Restart button to `restartGame()`
    - Wire language toggle to `setLanguage()` switching between "en" and "zh-TW"
    - _Requirements: 1.1, 1.4, 7.1, 8.1, 8.2_

  - [x] 12.4 Create GameStatusOverlay component
    - Create `src/ui/GameStatusOverlay.tsx` for checkmate, stalemate, and check messages
    - Display kid-friendly messages in the active language
    - Show "Play Again" button on game end
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 13. Wire everything together
  - [x] 13.1 Integrate all components in App and connect to GameManager
    - Connect UI components to GameManager via React state/context
    - Wire piece selection → legal move highlighting → move execution → AI response → score update flow
    - Wire hint request → hint display → score deduction flow
    - Wire language toggle → i18n module → re-render all translated text
    - Wire restart → preserve high score and language → fresh board
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 4.7, 5.1, 5.5, 7.1, 8.2_

  - [x] 13.2 Write integration tests for full game flows
    - Test: start game → make move → AI responds → score updates
    - Test: request hint → hint displays → score deducted
    - Test: restart game → board resets, high score preserved
    - Test: language switch → all UI text updates
    - _Requirements: 1.1, 2.2, 3.1, 4.7, 5.1, 7.1, 7.2, 8.2_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- TypeScript is used throughout with React for the UI layer
- fast-check is used for property-based tests, vitest for the test runner
