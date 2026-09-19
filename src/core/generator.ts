import {
  BOARD_SIZE,
  DEFAULT_DIFFICULTY,
  DIFFICULTY_PRESETS,
  MIN_DEDUCTION_ROUNDS,
  TOTAL_SQUARES,
  TRIES_BEFORE_EASING,
  TRIES_HARD_CAP,
} from './constants';
import { key } from './coordinates';
import { jumpDistancesFrom } from './graph';
import { mulberry32, shuffle } from './random';
import { solve } from './solver';
import { BoardConfig, DifficultyPreset, SquareKey } from './types';

export interface GenerateOptions {
  seed: number;
  difficulty?: DifficultyPreset;
  targetMines?: number;
  minRounds?: number;
  triesBeforeEasing?: number;
  hardCap?: number;
}

/**
 * Generates a provably solvable Knightsweeper battlefield from a numeric seed and difficulty.
 * The same seed and difficulty always produce the exact same layout.
 */
export function generateBoard(optionsOrSeed: number | GenerateOptions): BoardConfig {
  const options: GenerateOptions =
    typeof optionsOrSeed === 'number'
      ? { seed: optionsOrSeed }
      : optionsOrSeed;

  const {
    seed,
    difficulty = DEFAULT_DIFFICULTY,
    targetMines = DIFFICULTY_PRESETS[difficulty || DEFAULT_DIFFICULTY].mines,
    minRounds = MIN_DEDUCTION_ROUNDS,
    triesBeforeEasing = TRIES_BEFORE_EASING,
    hardCap = TRIES_HARD_CAP,
  } = options;

  const rng = mulberry32(seed);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rng() * list.length)];

  // 1. Pick start: bottom two ranks (rows 6..7), files b..g (cols 1..6) - never a corner
  const starts: SquareKey[] = [];
  for (let r = BOARD_SIZE - 2; r < BOARD_SIZE; r++) {
    for (let c = 1; c < BOARD_SIZE - 1; c++) {
      starts.push(key(r, c));
    }
  }
  const start = pick(starts);

  // 2. Pick enemy King position (exit): top two ranks (rows 0..1), at least 3 knight jumps from start
  const dist = jumpDistancesFrom(start);
  const exits: SquareKey[] = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const k = key(r, c);
      if (dist[k] >= 3) {
        exits.push(k);
      }
    }
  }
  const exit = pick(exits);

  // 3. Pool of candidate squares for mines (all except start and King)
  const base: SquareKey[] = [];
  for (let k = 0; k < TOTAL_SQUARES; k++) {
    if (k !== start && k !== exit) {
      base.push(k);
    }
  }

  // 4. Rejection sampling loop with solver verification
  let mineCount = targetMines;
  let tries = 0;
  let rounds = 0;
  let mines = new Set<SquareKey>();

  for (;;) {
    tries++;
    const pool = base.slice();
    shuffle(pool, rng);

    mines = new Set<SquareKey>(pool.slice(0, mineCount));
    const result = solve(start, exit, mines);

    if (result && result.rounds >= minRounds) {
      rounds = result.rounds;
      break;
    }

    // Easing: reduce mine count if repeatedly failing to find a solvable layout
    if (tries % triesBeforeEasing === 0 && mineCount > 1) {
      mineCount--;
    }

    if (tries >= hardCap) {
      break;
    }
  }

  return {
    seed,
    difficulty,
    start,
    exit,
    mines,
    mineCount,
    tries,
    rounds,
  };
}
