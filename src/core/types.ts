/**
 * Knightsweeper Core Domain Types
 */

/** An integer from 0 to 63 representing a square on the 8x8 chessboard */
export type SquareKey = number;

export interface Coordinates {
  row: number; // 0 to 7 (row 0 is rank 8, row 7 is rank 1)
  col: number; // 0 to 7 (col 0 is file a, col 7 is file h)
}

export type GameStatus = 'playing' | 'won' | 'lost';

export type KingCaptureStage = 'idle' | 'hit-stop' | 'toppling' | 'settled';

export type DifficultyPreset = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  preset: DifficultyPreset;
  label: string;
  mines: number;
  description: string;
}

export interface BoardConfig {
  seed: number;
  difficulty: DifficultyPreset;
  start: SquareKey;
  exit: SquareKey; // Represents the enemy King square
  mines: Set<SquareKey>;
  mineCount: number;
  tries: number;
  rounds: number;
}

export interface SolverResult {
  rounds: number;
}

export interface GameState {
  // Board truth
  seed: number;
  difficulty: DifficultyPreset;
  start: SquareKey;
  exit: SquareKey; // Enemy King's position
  mines: Set<SquareKey>;
  mineCount: number;

  // Player knowledge & runtime
  opened: Set<SquareKey>;
  flags: Set<SquareKey>;
  hit: Set<SquareKey>;
  pos: SquareKey;
  knights: number;
  moves: number;
  status: GameStatus;
  lastHit: SquareKey | null;
  message: string;
}

export interface UIState {
  flagMode: boolean;
  hover: SquareKey | null;
  pin: SquareKey | null; // tapped/pinned clue square to inspect neighborhood
}

export type SoundEvent =
  | { type: 'move' }
  | { type: 'land'; clue?: number }
  | { type: 'mine' }
  | { type: 'respawn' }
  | { type: 'kingImpact' }
  | { type: 'kingFall' }
  | { type: 'win' }
  | { type: 'lose' }
  | { type: 'flag'; placed: boolean }
  | { type: 'nope' }
  | { type: 'fresh' };

export type GameAction =
  | { type: 'INITIALIZE_GAME'; board: BoardConfig }
  | { type: 'JUMP'; target: SquareKey }
  | { type: 'TOGGLE_FLAG'; target: SquareKey }
  | { type: 'RETRY_BOARD' }
  | { type: 'SET_MESSAGE'; message: string };
