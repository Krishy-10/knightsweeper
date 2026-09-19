import { clueFor } from './clues';
import { DEFAULT_KNIGHTS } from './constants';
import { nameOf } from './coordinates';
import { KNIGHT_GRAPH } from './graph';
import { BoardConfig, GameAction, GameState, SoundEvent, SquareKey } from './types';

export interface GameReducerResult {
  state: GameState;
  soundEvents: SoundEvent[];
}

export function createInitialState(board: BoardConfig): GameState {
  const opened = new Set<SquareKey>([board.start]);
  const startClue = clueFor(board.mines, board.start);

  const message =
    `Your knight starts on ${nameOf(board.start)} and detects ${startClue} mines. ` +
    (startClue === 0
      ? '0 mines are one knight-move away. Every dotted move from here is safe.'
      : `${startClue === 1 ? '1 mine is' : startClue + ' mines are'} hidden among the squares this knight can jump to.`) +
    ` The enemy King stands on ${nameOf(board.exit)}.`;

  return {
    seed: board.seed,
    difficulty: board.difficulty,
    start: board.start,
    exit: board.exit,
    mines: board.mines,
    mineCount: board.mineCount,
    opened,
    flags: new Set<SquareKey>(),
    hit: new Set<SquareKey>(),
    pos: board.start,
    knights: DEFAULT_KNIGHTS,
    moves: 0,
    status: 'playing',
    lastHit: null,
    message,
  };
}

/**
 * Pure reducer function for Knightsweeper game state transitions.
 * Returns the updated immutable GameState alongside any sound events to trigger.
 */
export function gameReducer(
  state: GameState,
  action: GameAction
): GameReducerResult {
  switch (action.type) {
    case 'INITIALIZE_GAME': {
      return {
        state: createInitialState(action.board),
        soundEvents: [{ type: 'fresh' }],
      };
    }

    case 'SET_MESSAGE': {
      return {
        state: { ...state, message: action.message },
        soundEvents: [],
      };
    }

    case 'TOGGLE_FLAG': {
      const { target } = action;
      if (state.status !== 'playing') return { state, soundEvents: [] };
      if (state.opened.has(target) || state.hit.has(target) || target === state.exit) {
        return { state, soundEvents: [] };
      }

      const nextFlags = new Set(state.flags);
      const isFlagged = nextFlags.has(target);

      if (isFlagged) {
        nextFlags.delete(target);
      } else {
        nextFlags.add(target);
      }

      return {
        state: { ...state, flags: nextFlags },
        soundEvents: [{ type: 'flag', placed: !isFlagged }],
      };
    }

    case 'JUMP': {
      const { target } = action;
      if (state.status !== 'playing') {
        return { state, soundEvents: [] };
      }

      // Check knight movement validity
      const legalMoves = KNIGHT_GRAPH[state.pos];
      if (!legalMoves.includes(target)) {
        return { state, soundEvents: [{ type: 'nope' }] };
      }

      // Check if target is blocked by hit mine or flag
      if (state.hit.has(target)) {
        return { state, soundEvents: [{ type: 'nope' }] };
      }

      if (state.flags.has(target)) {
        return {
          state: {
            ...state,
            message: 'That square is flagged. Remove the flag to jump there.',
          },
          soundEvents: [{ type: 'nope' }],
        };
      }

      const fromSquare = state.pos;
      const nextMoves = state.moves + 1;

      // 1. Victory condition: Captured enemy King
      if (target === state.exit) {
        const knightWord = state.knights === 1 ? 'knight' : 'knights';
        return {
          state: {
            ...state,
            pos: target,
            moves: nextMoves,
            status: 'won',
            message: `KING CAPTURED: You crossed Battlefield #${state.seed} in ${nextMoves} moves with ${state.knights} ${knightWord} remaining.`,
          },
          soundEvents: [{ type: 'win' }],
        };
      }

      // 2. Hazard condition: Landed on a mine
      if (state.mines.has(target)) {
        const nextHit = new Set(state.hit).add(target);
        const nextKnights = state.knights - 1;

        if (nextKnights === 0) {
          // Both knights lost: Game Over
          return {
            state: {
              ...state,
              hit: nextHit,
              lastHit: target,
              knights: 0,
              moves: nextMoves,
              status: 'lost',
              message: `Mine detonated on ${nameOf(target)}. Both knights have fallen. Battlefield #${state.seed} lost. The enemy King remains standing.`,
            },
            soundEvents: [{ type: 'lose' }],
          };
        } else {
          // First knight lost: Second knight steps in on `fromSquare`
          return {
            state: {
              ...state,
              hit: nextHit,
              lastHit: target,
              knights: nextKnights,
              moves: nextMoves,
              // pos remains fromSquare!
              message: `Mine detonated on ${nameOf(target)}. Your second knight takes the field on ${nameOf(fromSquare)}.`,
            },
            soundEvents: [{ type: 'mine' }, { type: 'respawn' }],
          };
        }
      }

      // 3. Safe square: Landed successfully
      const nextOpened = new Set(state.opened).add(target);
      const clue = clueFor(state.mines, target);
      const message =
        clue === 0
          ? `0 mines are one knight-move away from ${nameOf(target)}. Every dotted move from here is safe.`
          : `${nameOf(target)}: ${clue === 1 ? '1 mine is' : clue + ' mines are'} hidden among the squares this knight can jump to.`;

      return {
        state: {
          ...state,
          opened: nextOpened,
          pos: target,
          moves: nextMoves,
          message,
        },
        soundEvents: [{ type: 'land', clue }],
      };
    }

    default:
      return { state, soundEvents: [] };
  }
}
