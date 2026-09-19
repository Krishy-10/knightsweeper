'use client';

import React from 'react';
import { FILES, RANKS, TOTAL_SQUARES } from '../core/constants';
import { GameState, KingCaptureStage, SquareKey } from '../core/types';
import { AmbienceGlowState } from '../hooks/useAmbience';
import { Square } from './Square';

interface BoardProps {
  state: GameState;
  legalSquares: Set<SquareKey>;
  countedSquares: Set<SquareKey>;
  flagMode: boolean;
  isShaking: boolean;
  kingCaptureStage: KingCaptureStage;
  victoryCelebration: boolean;
  glowState: AmbienceGlowState;
  ambienceEnabled: boolean;
  onSquareClick: (k: SquareKey) => void;
  onToggleFlag: (k: SquareKey) => void;
  onSetHover: (k: SquareKey | null) => void;
}

export function Board({
  state,
  legalSquares,
  countedSquares,
  flagMode,
  isShaking,
  kingCaptureStage,
  victoryCelebration,
  glowState,
  ambienceEnabled,
  onSquareClick,
  onToggleFlag,
  onSetHover,
}: BoardProps) {
  const handleContextMenu = (e: React.MouseEvent, k: SquareKey) => {
    e.preventDefault();
    onToggleFlag(k);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      const target = document.activeElement as HTMLElement;
      if (target && target.dataset.k) {
        onToggleFlag(Number(target.dataset.k));
      }
    }
  };

  return (
    <div
      className={`board-frame ${isShaking ? 'battlefield-shaking' : ''} ${
        ambienceEnabled ? `glow-${glowState}` : 'ambience-off'
      }`}
      onKeyDown={handleKeyDown}
    >
      {/* Vertical Rank Labels (8 to 1) */}
      <div className="board-ranks" aria-hidden="true">
        {RANKS.map((rank) => (
          <span key={rank} className="coordinate-label">
            {rank}
          </span>
        ))}
      </div>

      {/* 8x8 Chess Grid Container */}
      <div
        className={`board-grid ${flagMode ? 'flag-mode-active' : ''}`}
        role="group"
        aria-label="Knightsweeper 8x8 Board"
      >
        {Array.from({ length: TOTAL_SQUARES }, (_, k) => (
          <Square
            key={k}
            k={k}
            state={state}
            isLegal={legalSquares.has(k)}
            isCounted={countedSquares.has(k)}
            kingCaptureStage={kingCaptureStage}
            victoryCelebration={victoryCelebration}
            onClick={onSquareClick}
            onContextMenu={handleContextMenu}
            onMouseEnter={onSetHover}
            onMouseLeave={() => onSetHover(null)}
          />
        ))}
      </div>

      {/* Horizontal File Labels (a to h) */}
      <div className="board-files" aria-hidden="true">
        {FILES.split('').map((file) => (
          <span key={file} className="coordinate-label">
            {file}
          </span>
        ))}
      </div>
    </div>
  );
}
