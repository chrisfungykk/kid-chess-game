# Implementation Plan: Go Game

## Overview

Add a complete Go (圍棋) game as a parallel module alongside the existing Chess game. Implementation follows a bottom-up approach: engine layer first (types, board, rules, scoring, serialization), then AI and hints, then game manager, then UI components, and finally integration with shared infrastructure and routing. Each task builds on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Create Go engine types and board foundations
  - [x] 1.1 Create `src/go-engine/types.ts` with all Go engine type definitions
    - Define `StoneColor`, `IntersectionState`, `GoPosition`, `GoBoard`, `PlaceStoneResult`, `GoScoreResult`, `TerritoryMap`, `TerritoryOwner` as specified in the design data models
    - _Requirements: 2.3, 3.1, 4.2, 7.1_

  - [x] 1.2 Create `src/go-engine/board.ts` with board creation and utility functions
    - Implement `createEmptyBoard()` returning a 9×9 board with all intersections empty, turn set to Black, zero prisoners, null previous board state, zero consecutive passes and move count
    - Implement `getIntersection(board, pos)`, `setIntersection(board, pos, state)` (immutable), and `isValidPosition(pos)`
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 1.3 Write unit tests for board initialization and utilities in `src/go-engine/board.test.ts`
    - Test `createEmptyBoard` produces 9×9 grid of EMPTY, currentTurn is BLACK
    - Test `getIntersection` and `setIntersection` for valid and out-of-bounds positions
    - Test `isValidPosition` for boundary values
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.4 Create `src/go-engine/index.ts` barrel export
    - Export all public functions and types from board, types
    - _Requirements: 2.1_

- [x] 2. Implement Go rules (placement, capture, ko)
  - [x] 2.1 Implement group and liberty functions in `src/go-engine/rules.ts`
    - Implement `getGroup(board, pos)` using flood-fill to find connected same-color stones
    - Implement `getLiberties(board, group)` returning empty adjacent positions
    - Implement `findCaptures(board, pos, color)` returning opponent stones captured by placing at pos
    - _Requirements: 4.1, 4.2_

  - [x] 2.2 Implement move validation and stone placement in `src/go-engine/rules.ts`
    - Implement `isLegalMove(board, pos)` checking occupied, suicide, and ko rules
    - Implement `getAllLegalMoves(board)` returning all legal positions for current player
    - Implement `placeStone(board, pos)` — validates move, places stone, resolves captures (opponent first, then re-evaluate placed stone), updates prisoners, stores previous board for ko, switches turn. Returns `PlaceStoneResult`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_

  - [ ]* 2.3 Write property test: valid stone placement updates board and switches turn in `src/go-engine/board.property.test.ts`
    - **Property 1: Valid stone placement updates board and switches turn**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 2.4 Write property test: occupied intersection rejection in `src/go-engine/board.property.test.ts`
    - **Property 2: Occupied intersection rejection**
    - **Validates: Requirements 3.3**

  - [ ]* 2.5 Write property test: suicide move rejection in `src/go-engine/board.property.test.ts`
    - **Property 3: Suicide move rejection**
    - **Validates: Requirements 3.4**

  - [ ]* 2.6 Write property test: capture correctness in `src/go-engine/board.property.test.ts`
    - **Property 4: Capture correctness**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 2.7 Write property test: ko violation rejection in `src/go-engine/board.property.test.ts`
    - **Property 5: Ko violation rejection**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 2.8 Write unit tests for rules in `src/go-engine/rules.test.ts`
    - Test specific capture scenarios including the edge case where placement causes both placed stone's group and opponent group to have zero liberties (Req 4.4)
    - Test specific ko scenarios with known board positions
    - Test `getGroup`, `getLiberties`, `findCaptures` with known configurations
    - _Requirements: 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_

  - [x] 2.9 Update `src/go-engine/index.ts` to export rules functions
    - _Requirements: 3.1_

- [x] 3. Implement scoring and serialization
  - [x] 3.1 Implement territory calculation and area scoring in `src/go-engine/scoring.ts`
    - Implement `findTerritory(board)` using flood-fill on empty regions, assigning each to black, white, or neutral
    - Implement `calculateScore(board)` computing area scores (stones + territory) for both players, adding 6.5 komi to White, determining winner
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 3.2 Write property test: area scoring correctness in `src/go-engine/scoring.property.test.ts`
    - **Property 8: Area scoring correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 3.3 Write unit tests for scoring in `src/go-engine/scoring.test.ts`
    - Test known board positions with expected scores
    - Test empty board scoring (all territory neutral, komi decides)
    - Test full board scoring
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.4 Implement board serialization in `src/go-engine/serialize.ts`
    - Implement `serializeBoard(board)` converting GoBoard to compact JSON string
    - Implement `deserializeBoard(json)` parsing JSON back to GoBoard, throwing descriptive error on invalid input
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ]* 3.5 Write property test: board serialization round trip in `src/go-engine/board.property.test.ts`
    - **Property 17: Board serialization round trip**
    - **Validates: Requirements 15.1, 15.2, 15.3**

  - [ ]* 3.6 Write property test: invalid JSON deserialization error in `src/go-engine/board.property.test.ts`
    - **Property 18: Invalid JSON deserialization error**
    - **Validates: Requirements 15.4**

  - [ ]* 3.7 Write unit tests for serialization in `src/go-engine/serialize.test.ts`
    - Test specific serialization examples and malformed JSON inputs
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 3.8 Update `src/go-engine/index.ts` to export scoring and serialize functions
    - _Requirements: 7.1, 15.1_

- [x] 4. Checkpoint — Ensure all Go engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Go AI opponent
  - [x] 5.1 Create `src/go-ai/goAiOpponent.ts` with AI move selection
    - Implement `evaluateGoPosition(board, pos, color)` — heuristic score considering territory influence, captures, group safety
    - Implement `selectGoMove(board, difficulty)` — Easy: random legal move biased toward captures and center; Medium: one-ply evaluation using `evaluateGoPosition`
    - Return `null` when no beneficial moves (AI passes)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 5.2 Write property test: AI move legality in `src/go-ai/goAiOpponent.property.test.ts`
    - **Property 9: AI move legality**
    - **Validates: Requirements 8.1, 8.2**

  - [ ]* 5.3 Write unit tests for AI in `src/go-ai/goAiOpponent.test.ts`
    - Test AI passes when no beneficial moves
    - Test AI returns legal moves for both difficulty levels
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 5.4 Create `src/go-ai/index.ts` barrel export
    - _Requirements: 8.1_

- [x] 6. Implement Go hint system
  - [x] 6.1 Create `src/go-hints/types.ts` with hint type definitions
    - Define `GoHintCategory`, `GoHintResult` as specified in the design data models
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 6.2 Create `src/go-hints/goHintSystem.ts` with hint generation
    - Implement `generateGoHint(board, color, lang)` — analyzes board for capture opportunities, group defense, territory extension, and general positioning; returns `GoHintResult` with kid-friendly explanation or `null` if no legal moves
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 6.3 Write property test: hint completeness in `src/go-hints/goHintSystem.property.test.ts`
    - **Property 10: Hint completeness**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 6.4 Write unit tests for hints in `src/go-hints/goHintSystem.test.ts`
    - Test hint for known capture opportunity
    - Test hint for known defense scenario
    - Test returns null when no legal moves
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 6.5 Create `src/go-hints/index.ts` barrel export
    - _Requirements: 9.1_

- [x] 7. Implement Go game manager
  - [x] 7.1 Create `src/go-game/types.ts` with game state type definitions
    - Define `GoGameStatus`, `GoDifficulty`, `GoGameMode`, `GoGameState`, `GoMoveResult` as specified in the design data models
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 7.2 Create `src/go-game/goGameManager.ts` with game orchestration
    - Implement `startNewGoGame(difficulty, mode)` — initializes board, sets mode, loads high score
    - Implement `restartGoGame()` — resets board, preserves high score
    - Implement `makeGoMove(pos)` — places stone via engine, handles captures, triggers AI move in VS_AI mode
    - Implement `passGoTurn()` — records pass, switches turn, checks double-pass game end and triggers scoring
    - Implement `resignGoGame()` — ends game, declares opponent winner
    - Implement `requestGoHint()` — gets hint from hint system, applies score penalty, increments hintsUsed
    - Implement `getGoGameState()` — returns immutable copy of current state
    - _Requirements: 6.1, 6.2, 9.4, 10.1, 10.2, 10.3, 10.4, 11.2, 11.3, 14.1_

  - [ ]* 7.3 Write property test: pass switches turn in `src/go-game/goGameManager.property.test.ts`
    - **Property 6: Pass switches turn**
    - **Validates: Requirements 6.1**

  - [ ]* 7.4 Write property test: double pass ends game in `src/go-game/goGameManager.property.test.ts`
    - **Property 7: Double pass ends game**
    - **Validates: Requirements 6.2**

  - [ ]* 7.5 Write property test: hint score penalty in `src/go-game/goGameManager.property.test.ts`
    - **Property 11: Hint score penalty**
    - **Validates: Requirements 9.4**

  - [ ]* 7.6 Write property test: turn alternation in `src/go-game/goGameManager.property.test.ts`
    - **Property 12: Turn alternation**
    - **Validates: Requirements 10.2, 10.3**

  - [ ]* 7.7 Write property test: game score and high score persistence in `src/go-game/goGameManager.property.test.ts`
    - **Property 14: Game score and high score persistence**
    - **Validates: Requirements 11.2, 11.3**

  - [ ]* 7.8 Write property test: resign ends game with opponent as winner in `src/go-game/goGameManager.property.test.ts`
    - **Property 16: Resign ends game with opponent as winner**
    - **Validates: Requirements 14.1**

  - [ ]* 7.9 Write unit tests for game manager in `src/go-game/goGameManager.test.ts`
    - Test full game lifecycle: start, move, pass, resign
    - Test mode selection (VS_AI, VS_PLAYER)
    - Test AI auto-move in VS_AI mode after human move
    - Test double-pass triggers scoring
    - _Requirements: 6.1, 6.2, 10.1, 10.2, 10.3, 14.1_

  - [x] 7.10 Create `src/go-game/index.ts` barrel export
    - _Requirements: 10.1_

- [x] 8. Checkpoint — Ensure all Go logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Extend shared infrastructure (i18n and score persistence)
  - [x] 9.1 Add Go-specific translation keys to `src/i18n/translations.ts`
    - Add keys under both `en` and `zh-TW` for: `go.title`, `go.black`, `go.white`, `go.pass`, `go.resign`, `go.score`, `go.territory`, `go.captured`, `go.komi`, `go.hint.*`, `go.status.*`, `gameSelector.title`, `gameSelector.chess`, `gameSelector.go`
    - _Requirements: 12.1, 12.2_

  - [ ]* 9.2 Write property test: Go translation keys exist in `src/i18n/i18nModule.property.test.ts`
    - **Property 15: Go translation keys exist**
    - **Validates: Requirements 12.2**

  - [x] 9.3 Add Go high score persistence to `src/score/persistence.ts`
    - Add `GO_STORAGE_KEY = 'kids-go-high-score'`
    - Implement `saveGoHighScore` and `loadGoHighScore` following the same pattern as chess persistence
    - _Requirements: 11.1, 11.3_

  - [ ]* 9.4 Write property test: Go and Chess score isolation in `src/score/persistence.property.test.ts`
    - **Property 13: Go and Chess score isolation**
    - **Validates: Requirements 11.1**

  - [ ]* 9.5 Write unit tests for Go persistence in `src/score/persistence.test.ts`
    - Test save and load Go high score independently from chess
    - Test localStorage unavailable fallback
    - _Requirements: 11.1, 11.3_

- [x] 10. Build Go UI components
  - [x] 10.1 Create `src/go-ui/GoStone.tsx`
    - Render a circular stone element (black or white) with shadow/gradient effects
    - Support semi-transparent preview mode for hover state
    - _Requirements: 13.2, 13.3_

  - [x] 10.2 Create `src/go-ui/GoBoard.tsx`
    - Render 9×9 grid with visible grid lines on warm-toned wooden board background
    - Place `GoStone` components at occupied intersections
    - Show semi-transparent preview stone on hover/tap over empty intersections during current player's turn
    - Support territory highlighting with distinct colors for Black/White territory
    - Animate captured stone removal
    - Highlight hint intersection when hint is active
    - Responsive layout within 480px max-width
    - Use same kid-friendly font family and color palette as Chess UI
    - _Requirements: 6.3, 7.4, 7.5, 9.5, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 10.3 Create `src/go-ui/GoGameControls.tsx`
    - Render Pass button (accessible during current player's turn), Resign button (with confirmation prompt), Hint button, New Game button
    - Render difficulty selector (Easy/Medium) and mode selector (VS_AI/VS_PLAYER)
    - Display whose turn it is with kid-friendly indicator
    - Display current game score and Go high score using existing ScoreDisplay pattern
    - All labels use i18n translation keys
    - _Requirements: 6.3, 8.1, 9.5, 10.1, 10.4, 11.4, 14.2_

  - [x] 10.4 Create `src/go-ui/GoGameStatusOverlay.tsx`
    - Display final scores for both players and winner with kid-friendly message when game ends by scoring
    - Display resignation message when game ends by resign
    - All text uses i18n translation keys
    - _Requirements: 7.4, 14.3_

  - [x] 10.5 Create `src/go-ui/GameSelector.tsx`
    - Display Chess and Go options with kid-friendly icons and labels
    - Navigate to Go game setup or existing Chess game on selection
    - Display game names in currently selected language via i18n
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 10.6 Create `src/go-ui/index.ts` barrel export
    - _Requirements: 1.1_

  - [ ]* 10.7 Write unit tests for GameSelector in `src/go-ui/GameSelector.test.tsx`
    - Test renders both Chess and Go options
    - Test navigation on selection
    - Test i18n display
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 10.8 Write unit tests for GoBoard in `src/go-ui/GoBoard.test.tsx`
    - Test renders 9×9 grid
    - Test stone rendering at occupied intersections
    - Test hover preview on empty intersections
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ]* 10.9 Write unit tests for GoGameControls in `src/go-ui/GoGameControls.test.tsx`
    - Test pass/resign/hint button rendering and interactions
    - Test resign confirmation prompt
    - _Requirements: 6.3, 14.2_

- [x] 11. Integrate routing and wire everything together
  - [x] 11.1 Update `src/ui/App.tsx` (or `src/App.tsx`) to add game selector routing
    - Add state to track selected game (none/chess/go)
    - Render `GameSelector` when no game is selected
    - Render existing Chess UI when chess is selected
    - Render Go game UI when go is selected
    - Wire Go UI components to `goGameManager` functions
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 11.2 Wire Go game UI to game manager state
    - Connect `GoBoard` click handler to `makeGoMove`
    - Connect Pass/Resign/Hint buttons to `passGoTurn`/`resignGoGame`/`requestGoHint`
    - Connect New Game / difficulty / mode selectors to `startNewGoGame`
    - Display `GoGameStatusOverlay` when game status is finished
    - Ensure language toggle updates Go UI text immediately
    - _Requirements: 3.1, 6.1, 9.4, 10.1, 12.3, 14.1_

  - [ ]* 11.3 Write integration tests in `src/go-ui/integration.test.tsx`
    - Test full game flow: start game → place stones → pass → score display
    - Test game selector navigation between Chess and Go
    - _Requirements: 1.1, 3.1, 6.2, 7.4_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code uses TypeScript, vitest for testing, and fast-check for property-based tests
