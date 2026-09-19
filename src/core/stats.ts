/**
 * Knightsweeper Player Career Statistics & Persistence
 * Local-first career record keeping with streak tracking.
 */

import { DifficultyPreset } from './types';

export interface MoveDistribution {
  [bucket: string]: number; // e.g. "3-6", "7-10", "11-14", "15-18", "19-22", "23+"
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  bestMoves: Record<DifficultyPreset, number | null>;
  moveDistribution: MoveDistribution;
  completedDailies: string[]; // List of YYYY-MM-DD date strings completed
  lastPlayedDate: string | null;
}

export const STATS_STORAGE_KEY = 'knightsweeper-player-stats';

export const INITIAL_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  bestMoves: {
    easy: null,
    medium: null,
    hard: null,
  },
  moveDistribution: {
    '3-6': 0,
    '7-10': 0,
    '11-14': 0,
    '15-18': 0,
    '19-22': 0,
    '23+': 0,
  },
  completedDailies: [],
  lastPlayedDate: null,
};

function getMoveBucket(moves: number): string {
  if (moves <= 6) return '3-6';
  if (moves <= 10) return '7-10';
  if (moves <= 14) return '11-14';
  if (moves <= 18) return '15-18';
  if (moves <= 22) return '19-22';
  return '23+';
}

/**
 * Loads player statistics safely from localStorage.
 */
export function loadPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') return INITIAL_STATS;
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return INITIAL_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_STATS,
      ...parsed,
      bestMoves: { ...INITIAL_STATS.bestMoves, ...(parsed.bestMoves || {}) },
      moveDistribution: { ...INITIAL_STATS.moveDistribution, ...(parsed.moveDistribution || {}) },
      completedDailies: Array.isArray(parsed.completedDailies) ? parsed.completedDailies : [],
    };
  } catch {
    return INITIAL_STATS;
  }
}

/**
 * Saves player statistics to localStorage.
 */
export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Graceful degrade if storage quota exceeded or restricted
  }
}

export interface RecordGameParams {
  won: boolean;
  moves: number;
  difficulty: DifficultyPreset;
  dailyDateString?: string | null;
}

/**
 * Pure function to calculate updated statistics after a game completes.
 */
export function calculateUpdatedStats(
  prev: PlayerStats,
  { won, moves, difficulty, dailyDateString }: RecordGameParams
): PlayerStats {
  const gamesPlayed = prev.gamesPlayed + 1;
  const gamesWon = prev.gamesWon + (won ? 1 : 0);
  const currentStreak = won ? prev.currentStreak + 1 : 0;
  const maxStreak = Math.max(prev.maxStreak, currentStreak);

  const bestMoves = { ...prev.bestMoves };
  const moveDistribution = { ...prev.moveDistribution };

  if (won) {
    const currentBest = bestMoves[difficulty];
    if (currentBest === null || moves < currentBest) {
      bestMoves[difficulty] = moves;
    }
    const bucket = getMoveBucket(moves);
    moveDistribution[bucket] = (moveDistribution[bucket] || 0) + 1;
  }

  const completedDailies = [...prev.completedDailies];
  if (won && dailyDateString && !completedDailies.includes(dailyDateString)) {
    completedDailies.push(dailyDateString);
  }

  return {
    gamesPlayed,
    gamesWon,
    currentStreak,
    maxStreak,
    bestMoves,
    moveDistribution,
    completedDailies,
    lastPlayedDate: new Date().toISOString(),
  };
}
