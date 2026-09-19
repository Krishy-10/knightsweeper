'use client';

import React from 'react';
import { Flag, Moon, RotateCcw, Sparkles, Sun, Swords, Volume2, VolumeX } from 'lucide-react';
import { Theme } from '../hooks/useTheme';

interface ControlsProps {
  flagMode: boolean;
  soundEnabled: boolean;
  theme: Theme;
  ambienceEnabled: boolean;
  onToggleFlagMode: () => void;
  onToggleSound: () => void;
  onCycleTheme: () => void;
  onToggleAmbience: () => void;
  onRetryBoard: () => void;
  onNewBoard: () => void;
}

export function Controls({
  flagMode,
  soundEnabled,
  theme,
  ambienceEnabled,
  onToggleFlagMode,
  onToggleSound,
  onCycleTheme,
  onToggleAmbience,
  onRetryBoard,
  onNewBoard,
}: ControlsProps) {
  return (
    <div className="game-controls">
      <button
        type="button"
        className={`ctrl-btn ${flagMode ? 'flag-active' : 'ghost'}`}
        onClick={onToggleFlagMode}
        aria-pressed={flagMode}
        title="Toggle Flag mode (tap squares to place or remove tactical flags)"
      >
        <Flag size={18} className="btn-icon" />
        <span>Flag Mode {flagMode ? 'ON' : 'OFF'}</span>
      </button>

      <button
        type="button"
        className="ctrl-btn ghost"
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
        title="Toggle audio sound effects"
      >
        {soundEnabled ? <Volume2 size={18} className="btn-icon" /> : <VolumeX size={18} className="btn-icon" />}
        <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
      </button>

      <button
        type="button"
        className="ctrl-btn ghost"
        onClick={onCycleTheme}
        title="Toggle Light / Dark battlefield theme"
      >
        {theme === 'dark' ? <Moon size={18} className="btn-icon" /> : <Sun size={18} className="btn-icon" />}
        <span>Theme</span>
      </button>

      <button
        type="button"
        className="ctrl-btn ghost"
        onClick={onToggleAmbience}
        aria-pressed={ambienceEnabled}
        title="Toggle background ambient lighting and particle effects"
      >
        <Sparkles size={18} className="btn-icon" />
        <span>Ambience {ambienceEnabled ? 'ON' : 'OFF'}</span>
      </button>

      <button
        type="button"
        className="ctrl-btn ghost"
        onClick={onRetryBoard}
        title="Replay this exact battlefield layout from the start"
      >
        <RotateCcw size={18} className="btn-icon" />
        <span>Retry Battlefield</span>
      </button>

      <button
        type="button"
        className="ctrl-btn primary"
        onClick={onNewBoard}
        title="Generate a brand new fair battlefield"
      >
        <Swords size={18} className="btn-icon" />
        <span>New Battlefield</span>
      </button>
    </div>
  );
}
