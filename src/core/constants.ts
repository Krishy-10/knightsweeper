import { DifficultyConfig, DifficultyPreset } from './types';

export const BOARD_SIZE = 8;
export const TOTAL_SQUARES = BOARD_SIZE * BOARD_SIZE;

export const DEFAULT_MINES = 16;
export const DEFAULT_DIFFICULTY: DifficultyPreset = 'medium';
export const DEFAULT_KNIGHTS = 2;
export const MIN_DEDUCTION_ROUNDS = 3;
export const TRIES_BEFORE_EASING = 500;
export const TRIES_HARD_CAP = 20000;

export const KNIGHT_JUMPS: ReadonlyArray<readonly [number, number]> = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
] as const;

export const FILES = 'abcdefgh';
export const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export const DIFFICULTY_PRESETS: Record<DifficultyPreset, DifficultyConfig> = {
  easy: {
    preset: 'easy',
    label: 'Easy',
    mines: 8,
    description: '8 mines across the battlefield (12.5% density).',
  },
  medium: {
    preset: 'medium',
    label: 'Medium',
    mines: 16,
    description: '16 mines across the battlefield (25% density).',
  },
  hard: {
    preset: 'hard',
    label: 'Hard',
    mines: 24,
    description: '24 mines across the battlefield (37.5% density).',
  },
};
