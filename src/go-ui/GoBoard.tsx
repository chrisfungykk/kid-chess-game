import React, { useState } from 'react';
import GoStone from './GoStone';
import {
  IntersectionState,
  StoneColor,
} from '../go-engine/types';
import type {
  GoBoard as GoBoardType,
  GoPosition,
  TerritoryMap,
  TerritoryOwner,
} from '../go-engine/types';

export interface GoBoardProps {
  board: GoBoardType;
  currentTurn: StoneColor;
  isPlayerTurn: boolean;
  onIntersectionClick: (pos: GoPosition) => void;
  territoryMap?: TerritoryMap | null;
  hintPosition?: GoPosition | null;
  gameStatus: 'idle' | 'playing' | 'finished';
}

const BOARD_SIZE = 9;

export default function GoBoard({
  board,
  currentTurn,
  isPlayerTurn,
  onIntersectionClick,
  territoryMap,
  hintPosition,
  gameStatus,
}: GoBoardProps) {
  const [hoveredPos, setHoveredPos] = useState<GoPosition | null>(null);

  const canInteract = isPlayerTurn && gameStatus === 'playing';

  const isHintCell = (row: number, col: number): boolean =>
    hintPosition != null && hintPosition.row === row && hintPosition.col === col;

  const getTerritoryOwner = (row: number, col: number): TerritoryOwner | null => {
    if (!territoryMap) return null;
    return territoryMap.territories[row]?.[col] ?? null;
  };

  const getTerritoryOverlay = (owner: TerritoryOwner | null): React.CSSProperties | null => {
    if (!owner || owner === 'neutral' || owner === 'black_stone' || owner === 'white_stone')
      return null;
    if (owner === 'black')
      return { backgroundColor: 'rgba(0, 0, 0, 0.2)' };
    if (owner === 'white')
      return { backgroundColor: 'rgba(255, 255, 255, 0.45)' };
    return null;
  };

  const handleClick = (row: number, col: number) => {
    if (!canInteract) return;
    onIntersectionClick({ row, col });
  };

  return (
    <div style={styles.wrapper}>
      <div
        data-testid="go-board"
        style={styles.board}
      >
        {Array.from({ length: BOARD_SIZE }, (_, row) =>
          Array.from({ length: BOARD_SIZE }, (_, col) => {
            const state = board.grid[row]?.[col];
            const occupied =
              state === IntersectionState.BLACK ||
              state === IntersectionState.WHITE;
            const isHovered =
              hoveredPos != null && hoveredPos.row === row && hoveredPos.col === col;
            const showPreview = canInteract && !occupied && isHovered;
            const hint = isHintCell(row, col);
            const territory = getTerritoryOwner(row, col);
            const territoryStyle = getTerritoryOverlay(territory);

            // Grid-line borders: each cell draws its right and bottom line.
            // First row/col also draws top/left.
            const cellBorders: React.CSSProperties = {
              borderRight: col < BOARD_SIZE - 1 ? '1px solid #6b4c2a' : 'none',
              borderBottom: row < BOARD_SIZE - 1 ? '1px solid #6b4c2a' : 'none',
            };

            return (
              <div
                key={`${row}-${col}`}
                data-testid={`intersection-${row}-${col}`}
                style={{
                  ...styles.cell,
                  ...cellBorders,
                  cursor: canInteract && !occupied ? 'pointer' : 'default',
                }}
                onClick={() => handleClick(row, col)}
                onMouseEnter={() => setHoveredPos({ row, col })}
                onMouseLeave={() => setHoveredPos(null)}
                role="button"
                aria-label={`Intersection ${row},${col}${occupied ? ` occupied by ${state?.toLowerCase()}` : ' empty'}`}
                tabIndex={canInteract && !occupied ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(row, col);
                  }
                }}
              >
                {/* Territory overlay */}
                {territoryStyle && (
                  <div
                    data-testid={`territory-${row}-${col}`}
                    style={{ ...styles.territoryOverlay, ...territoryStyle }}
                  />
                )}

                {/* Hint highlight */}
                {hint && (
                  <div
                    data-testid={`hint-${row}-${col}`}
                    style={styles.hintHighlight}
                  />
                )}

                {/* Stone or preview */}
                {occupied ? (
                  <div style={styles.stoneContainer}>
                    <GoStone
                      color={state === IntersectionState.BLACK ? 'black' : 'white'}
                    />
                  </div>
                ) : showPreview ? (
                  <div style={styles.stoneContainer}>
                    <GoStone
                      color={currentTurn === StoneColor.BLACK ? 'black' : 'white'}
                      preview
                    />
                  </div>
                ) : null}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    maxWidth: '480px',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive, sans-serif',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
    gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
    width: '100%',
    height: '100%',
    backgroundColor: '#DEB887',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    border: '3px solid #8e6b3e',
    padding: '8px',
  },
  cell: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: '1',
  },
  stoneContainer: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    height: '90%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  territoryOverlay: {
    position: 'absolute' as const,
    inset: 0,
    zIndex: 1,
    borderRadius: '2px',
    pointerEvents: 'none' as const,
  },
  hintHighlight: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    height: '70%',
    borderRadius: '50%',
    border: '3px solid #f1c40f',
    boxShadow: '0 0 10px 2px rgba(241, 196, 15, 0.6)',
    animation: 'goPulse 1.2s ease-in-out infinite',
    zIndex: 3,
    pointerEvents: 'none' as const,
  },
};
