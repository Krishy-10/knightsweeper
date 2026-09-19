import { generateBoard } from './generator';
import { createInitialState, gameReducer } from './gameReducer';
import { KNIGHT_GRAPH } from './graph';
import { DifficultyPreset, SquareKey } from './types';

export interface VerificationResult {
  valid: boolean;
  error?: string;
  movesCount?: number;
}

/**
 * Pure domain game replay verifier.
 * Takes a seed and a sequence of jump targets, replays them through the exact
 * graph rules and game state machine, and verifies:
 * 1. Every step is a topologically valid knight jump.
 * 2. Mine detonations are tracked and lives are preserved.
 * 3. The run reaches and captures the enemy King.
 * 4. Move count matches.
 */
export function verifyGameRun(
  seed: number,
  movesHistory: SquareKey[],
  difficulty: DifficultyPreset = 'medium'
): VerificationResult {
  if (!Array.isArray(movesHistory) || movesHistory.length === 0) {
    return { valid: false, error: 'Move history must be a non-empty array' };
  }

  // Generate the exact board for this seed and difficulty
  const board = generateBoard(seed, difficulty);
  let state = createInitialState(board);

  for (let i = 0; i < movesHistory.length; i++) {
    const target = movesHistory[i];

    if (state.status !== 'playing') {
      return { valid: false, error: `Game was not in playing state at move ${i + 1}` };
    }

    // Graph check: must be a valid knight move from current position
    const legalMoves = KNIGHT_GRAPH[state.pos];
    if (!legalMoves.includes(target)) {
      return {
        valid: false,
        error: `Illegal knight jump: ${state.pos} -> ${target} is not a valid L-shaped move (move ${i + 1})`,
      };
    }

    // Target cannot be an already hit/detonated mine
    if (state.hit.has(target)) {
      return {
        valid: false,
        error: `Illegal move: square ${target} is a detonated mine (move ${i + 1})`,
      };
    }

    // Step state forward
    const result = gameReducer(state, { type: 'JUMP', target });
    state = result.state;

    if (state.status === 'lost') {
      return {
        valid: false,
        error: `Player ran out of knights and was defeated at move ${i + 1}`,
      };
    }

    if (state.status === 'won') {
      if (i !== movesHistory.length - 1) {
        return {
          valid: false,
          error: `Run captured King early at move ${i + 1}, but included extraneous moves`,
        };
      }
      return {
        valid: true,
        movesCount: state.moves,
      };
    }
  }

  return {
    valid: false,
    error: 'Sequence completed without capturing the enemy King',
  };
}
