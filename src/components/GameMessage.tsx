'use client';

import React from 'react';
import { Crown, ShieldAlert, Swords } from 'lucide-react';
import { GameStatus } from '../core/types';

interface GameMessageProps {
  message: string;
  status: GameStatus;
}

export function GameMessage({ message, status }: GameMessageProps) {
  return (
    <div
      className={`narrative-banner ${status === 'won' ? 'banner-win' : status === 'lost' ? 'banner-lose' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="banner-icon" aria-hidden="true">
        {status === 'won' && <Crown size={20} className="icon-crown" />}
        {status === 'lost' && <ShieldAlert size={20} className="icon-defeat" />}
        {status === 'playing' && <Swords size={20} className="icon-tactical" />}
      </div>
      <p className="banner-text">{message}</p>
    </div>
  );
}
