'use client';

import React from 'react';
import { GameState } from '../core/types';

interface StatusBarProps {
  state: GameState;
}

export function StatusBar({ state }: StatusBarProps) {
  const minesLeft = Math.max(0, state.mineCount - state.flags.size - state.hit.size);

  return (
    <section className="status-bar" aria-label="Battlefield status">
      {/* Lives / Knights Indicator */}
      <div className="stat-group">
        <span className="stat-label">Knights:</span>
        <div className="lives-container" aria-label={`${state.knights} knights remaining`}>
          {[0, 1].map((idx) => {
            const isFallen = idx >= state.knights;
            return (
              <span
                key={idx}
                className={`knight-life ${isFallen ? 'fallen' : 'active'}`}
                title={isFallen ? 'Fallen Knight' : 'Active Knight'}
              >
                ♞
              </span>
            );
          })}
        </div>
      </div>

      {/* Moves Count */}
      <div className="stat-group">
        <span className="stat-label">Moves:</span>
        <b className="stat-value">{state.moves}</b>
      </div>

      {/* Remaining Mines */}
      <div className="stat-group">
        <span className="stat-label">Mines Left:</span>
        <b className="stat-value">{minesLeft}</b>
      </div>

      {/* Status indicator badge */}
      <div className="stat-group status-tag">
        {state.status === 'playing' && <span className="tag-playing">Advancing</span>}
        {state.status === 'won' && <span className="tag-won">King Captured</span>}
        {state.status === 'lost' && <span className="tag-lost">Battlefield Lost</span>}
      </div>
    </section>
  );
}
