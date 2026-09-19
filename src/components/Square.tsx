'use client';

import React from 'react';
import { clueFor } from '../core/clues';
import { isLightSquare, nameOf } from '../core/coordinates';
import { GameState, KingCaptureStage, SquareKey } from '../core/types';

interface SquareProps {
  k: SquareKey;
  state: GameState;
  isLegal: boolean;
  isCounted: boolean;
  kingCaptureStage: KingCaptureStage;
  victoryCelebration: boolean;
  onClick: (k: SquareKey) => void;
  onContextMenu: (e: React.MouseEvent, k: SquareKey) => void;
  onMouseEnter: (k: SquareKey) => void;
  onMouseLeave: () => void;
}

export function Square({
  k,
  state,
  isLegal,
  isCounted,
  kingCaptureStage,
  victoryCelebration,
  onClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
}: SquareProps) {
  const isKnight = k === state.pos && state.status !== 'lost';
  const isOpen = state.opened.has(k);
  const isHitMine = state.hit.has(k);
  const showMine = isHitMine || (state.status === 'lost' && state.mines.has(k));
  const isKing = k === state.exit;
  const isFlag = state.flags.has(k) && !showMine;
  const isFatal = k === state.lastHit;
  const isLight = isLightSquare(k);

  const isKingHitStop = isKing && kingCaptureStage === 'hit-stop';
  const isKingToppling = isKing && kingCaptureStage === 'toppling';
  const isKingCaptured = (state.status === 'won' || kingCaptureStage === 'settled') && isKing;
  const isKingStanding = state.status === 'lost' && isKing;

  const clue = isOpen ? clueFor(state.mines, k) : null;

  // Build screen reader description
  const squareName = nameOf(k);
  let label = `${squareName}, `;
  if (isKnight && isKingCaptured) label += 'your victorious knight capturing the enemy King';
  else if (isKnight) label += 'your knight';
  else if (showMine) label += isHitMine ? 'detonated landmine' : 'hidden landmine';
  else if (isKing) label += isKingStanding ? 'enemy King standing victorious' : 'the enemy King';
  else if (isFlag) label += 'flagged mine';
  else if (isOpen) label += `clue shows ${clue}`;
  else label += 'unexplored square';
  if (isLegal) label += ', legal knight jump';

  const classNames = [
    'sq',
    isLight ? 'tone-light' : 'tone-dark',
    isOpen ? 'tile-open' : 'tile-unopened',
    showMine ? 'tile-mine' : '',
    isKing ? 'tile-king' : '',
    isLegal ? 'is-legal' : '',
    isCounted ? 'is-counted' : '',
    isFatal ? 'is-fatal' : '',
    isKnight ? 'has-knight' : '',
    isKingCaptured ? 'king-captured-square' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classNames}
      onClick={() => onClick(k)}
      onContextMenu={(e) => onContextMenu(e, k)}
      onMouseEnter={() => onMouseEnter(k)}
      onMouseLeave={onMouseLeave}
      tabIndex={isLegal ? 0 : -1}
      aria-label={label}
      data-k={k}
    >
      {/* Enemy King Piece (Active, Hit-Stop, Toppling, or Standing in Defeat) */}
      {isKing && (!isKnight || isKingHitStop || isKingToppling) && (
        <span
          className={`king-piece ${isKingStanding ? 'king-victorious' : ''} ${
            isKingHitStop ? 'king-hit-stop' : ''
          } ${isKingToppling ? 'king-toppling' : ''}`}
          aria-hidden="true"
          title="Enemy King"
        >
          {/* Detailed Chess King SVG Silhouette with Cross */}
          <svg viewBox="0 0 45 45" className="king-svg">
            <g
              fill="none"
              fillRule="evenodd"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Crown cross */}
              <path d="M22.5 6v7M20 9h5" stroke="#ffffff" strokeWidth="1.8" />
              {/* Crown base */}
              <path
                d="M22.5 13c-4.5 0-8 3.5-8 8 0 3 2.5 5.5 5 7l-2 8.5h10l-2-8.5c2.5-1.5 5-4 5-7 0-4.5-3.5-8-8-8z"
                fill="var(--king-gold)"
                stroke="#1a1a1a"
                strokeWidth="1.5"
              />
              {/* King head base band */}
              <path d="M12.5 36.5h20" stroke="var(--king-gold)" strokeWidth="2.5" />
              <path d="M11 39.5h23" stroke="#1a1a1a" strokeWidth="2" />
            </g>
          </svg>
        </span>
      )}

      {/* Captured King Fallen Reaction (Visible under Victorious Knight) */}
      {isKingCaptured && (
        <span className="captured-king-fallen" aria-hidden="true">
          <svg viewBox="0 0 45 45" className="king-fallen-svg">
            <path
              d="M22.5 13c-4.5 0-8 3.5-8 8 0 3 2.5 5.5 5 7l-2 8.5h10l-2-8.5c2.5-1.5 5-4 5-7 0-4.5-3.5-8-8-8z"
              fill="var(--king-gold)"
              opacity="0.45"
            />
          </svg>
        </span>
      )}

      {/* Victory Celebration Particles Emitted from Captured King Square */}
      {isKing && isKingCaptured && victoryCelebration && (
        <span className="victory-burst" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="victory-particle"
              style={
                {
                  '--particle-deg': `${(i * 360) / 16}deg`,
                  '--particle-dist': `${26 + (i % 3) * 14}px`,
                  '--particle-delay': `${(i % 4) * 0.05}s`,
                  '--particle-color': i % 2 === 0 ? 'var(--king-gold)' : '#ffffff',
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}

      {/* Landmine Visual */}
      {showMine && (
        <span className={`landmine-marker ${isHitMine ? 'detonated' : 'dormant'}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" className="mine-svg">
            {/* Outer mine casing */}
            <circle cx="12" cy="12" r="9" fill="var(--mine-dark)" stroke="#000000" strokeWidth="1.5" />
            {/* Inner pressure plate */}
            <circle cx="12" cy="12" r="5" fill="var(--mine-color)" stroke="#1a0000" strokeWidth="1" />
            {/* Central sensor / detonator */}
            <circle cx="12" cy="12" r="2" fill="#ffffff" opacity="0.85" />
            {/* Tactical hazard grooves */}
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {isHitMine && <span className="fallen-knight-marker">♞</span>}
        </span>
      )}

      {/* Tactical Hazard Flag */}
      {isFlag && (
        <span className="tactical-flag" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="flag-svg">
            <path d="M5 21V3" stroke="var(--flag-pole)" strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M6 4l13 5-13 5z"
              fill="var(--flag-banner)"
              stroke="#8a2010"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      {/* Clue Number (on opened safe squares without knight) */}
      {isOpen && !isKnight && clue !== null && (
        <span className={`clue-number clue-${clue}`}>{clue}</span>
      )}

      {/* Active Knight Piece & Badge */}
      {isKnight && (
        <span className={`knight-token ${isKingCaptured ? 'victorious-knight' : ''}`} aria-hidden="true">
          <span className="knight-glyph">♞</span>
          {isOpen && clue !== null && (
            <span className={`knight-clue-chip clue-${clue}`}>{clue}</span>
          )}
        </span>
      )}

      {/* Legal Knight Jump Indicator */}
      {isLegal && !isKnight && <span className="jump-target-dot" aria-hidden="true" />}

      {/* Neighborhood Inspection Reticle */}
      {isCounted && <span className="reticle-indicator" aria-hidden="true" />}
    </button>
  );
}
