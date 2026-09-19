'use client';

import React from 'react';
import { Calendar, CheckCircle2, Crown, Hash, Shield, Trophy, User as UserIcon } from 'lucide-react';
import { DIFFICULTY_PRESETS } from '../core/constants';
import { DifficultyPreset } from '../core/types';
import { UserProfile } from '../services/authService';

interface HeaderProps {
  difficulty: DifficultyPreset;
  onSelectDifficulty: (preset: DifficultyPreset) => void;
  onOpenHowToPlay: () => void;
  onOpenSeedModal: () => void;
  seed: number;
  isDailyActive?: boolean;
  onToggleDaily?: () => void;
  dailyDayNumber?: number;
  isDailyCompleted?: boolean;
  onOpenStatsModal?: () => void;
  userProfile?: UserProfile | null;
}

export function Header({
  difficulty,
  onSelectDifficulty,
  onOpenHowToPlay,
  onOpenSeedModal,
  seed,
  isDailyActive = false,
  onToggleDaily,
  dailyDayNumber,
  isDailyCompleted = false,
  onOpenStatsModal,
  userProfile,
}: HeaderProps) {
  return (
    <header className="game-header">
      <div className="header-brand">
        <div className="brand-badge">
          <Crown className="brand-icon" size={20} />
          <span>OBJECTIVE: CAPTURE ENEMY KING</span>
        </div>
        <h1 className="game-title">KNIGHTSWEEPER</h1>
        <p className="game-subtitle">
          Chess movement meets Minesweeper deduction. Navigate your knight across a mined battlefield to capture the enemy King.
        </p>
      </div>

      <div className="header-actions">
        {/* Simple 3-Button Segmented Difficulty Control */}
        <div className="difficulty-picker" role="radiogroup" aria-label="Game difficulty">
          {(['easy', 'medium', 'hard'] as DifficultyPreset[]).map((preset) => {
            const isSelected = difficulty === preset;
            const config = DIFFICULTY_PRESETS[preset];
            return (
              <button
                key={preset}
                type="button"
                className={`diff-btn ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectDifficulty(preset)}
                role="radio"
                aria-checked={isSelected}
                title={config.description}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Battlefield Identity, Daily Challenge, Stats and How to Play */}
        <div className="header-meta">
          {onToggleDaily && (
            <button
              type="button"
              className={`daily-toggle-btn ${isDailyActive ? 'active' : ''}`}
              onClick={onToggleDaily}
              title="Play today's official Daily Challenge"
            >
              <Calendar size={14} />
              <span>Daily #{dailyDayNumber || 1}</span>
              {isDailyCompleted && <CheckCircle2 size={13} className="text-emerald" />}
            </button>
          )}

          {onOpenStatsModal && (
            <button
              type="button"
              className="stats-btn"
              onClick={onOpenStatsModal}
              title="View career stats, streaks, and Daily Leaderboard"
            >
              <Trophy size={14} />
              <span>Stats</span>
            </button>
          )}

          <button
            type="button"
            className="seed-btn"
            onClick={onOpenSeedModal}
            title="Inspect or replay Battlefield Code"
          >
            <Hash size={14} />
            <span>
              <b>{DIFFICULTY_PRESETS[difficulty].label} · #{seed}</b>
            </span>
          </button>

          <button
            type="button"
            className="help-btn"
            onClick={onOpenHowToPlay}
            title="How to play instructions and rules"
          >
            <Shield size={14} />
            <span>Rules</span>
          </button>
        </div>
      </div>
    </header>
  );
}
