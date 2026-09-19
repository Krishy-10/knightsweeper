'use client';

import React, { useState } from 'react';
import {
  Check,
  Flag,
  Moon,
  RotateCcw,
  Share2,
  Sparkles,
  Sun,
  Swords,
  Volume2,
  VolumeX,
} from 'lucide-react';
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
  onShareChallenge?: () => Promise<boolean>;
  onShareResult?: () => Promise<boolean>;
  gameStatus?: 'playing' | 'won' | 'lost';
  isDaily?: boolean;
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
  onShareChallenge,
  onShareResult,
  gameStatus = 'playing',
  isDaily = false,
}: ControlsProps) {
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  const handleShareChallenge = async () => {
    if (!onShareChallenge) return;
    const ok = await onShareChallenge();
    if (ok) {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2200);
    }
  };

  const handleShareResult = async () => {
    if (!onShareResult) return;
    const ok = await onShareResult();
    if (ok) {
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2200);
    }
  };

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

      {/* Share Result Button (Appears when match ends) */}
      {gameStatus !== 'playing' && onShareResult && (
        <button
          type="button"
          className="ctrl-btn highlight-share"
          onClick={handleShareResult}
          title="Copy match score card to clipboard"
        >
          {copiedResult ? <Check size={18} className="text-emerald" /> : <Share2 size={18} />}
          <span>{copiedResult ? 'Copied Card!' : 'Share Result'}</span>
        </button>
      )}

      {/* Challenge a Friend Button */}
      {onShareChallenge && gameStatus === 'playing' && (
        <button
          type="button"
          className="ctrl-btn ghost"
          onClick={handleShareChallenge}
          title="Copy link to challenge a friend on this exact battlefield"
        >
          {copiedChallenge ? <Check size={18} className="text-emerald" /> : <Share2 size={18} />}
          <span>{copiedChallenge ? 'Link Copied!' : 'Challenge Friend'}</span>
        </button>
      )}

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
