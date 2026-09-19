import { describe, expect, it } from 'vitest';
import { generateBoard } from '../src/core/generator';
import { gameReducer } from '../src/core/gameReducer';
import { jumpsFrom } from '../src/core/graph';

describe('Game Reducer Battlefield Transitions', () => {
  const board = generateBoard(99999);

  it('initializes game state correctly from board config', () => {
    const { state, soundEvents } = gameReducer(
      {} as any,
      { type: 'INITIALIZE_GAME', board }
    );

    expect(state.seed).toBe(board.seed);
    expect(state.difficulty).toBe(board.difficulty);
    expect(state.pos).toBe(board.start);
    expect(state.knights).toBe(2);
    expect(state.moves).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.opened.has(board.start)).toBe(true);
    expect(state.flags.size).toBe(0);
    expect(state.hit.size).toBe(0);
    expect(state.message).toContain('enemy King');
    expect(soundEvents).toEqual([{ type: 'fresh' }]);
  });

  it('rejects illegal knight jumps', () => {
    let { state } = gameReducer({} as any, { type: 'INITIALIZE_GAME', board });
    // Same square
    const resSame = gameReducer(state, { type: 'JUMP', target: state.pos });
    expect(resSame.state.pos).toBe(state.pos);
    expect(resSame.soundEvents).toEqual([{ type: 'nope' }]);

    // Adjacent non-knight square
    const nonKnightSquare = state.pos + 1;
    if (!jumpsFrom(state.pos).includes(nonKnightSquare)) {
      const resAdj = gameReducer(state, { type: 'JUMP', target: nonKnightSquare });
      expect(resAdj.state.pos).toBe(state.pos);
      expect(resAdj.soundEvents).toEqual([{ type: 'nope' }]);
    }
  });

  it('toggles flags and blocks jumping on flagged squares', () => {
    let { state } = gameReducer({} as any, { type: 'INITIALIZE_GAME', board });
    const target = jumpsFrom(state.pos)[0];

    // Toggle flag on
    const resFlagOn = gameReducer(state, { type: 'TOGGLE_FLAG', target });
    expect(resFlagOn.state.flags.has(target)).toBe(true);
    expect(resFlagOn.soundEvents).toEqual([{ type: 'flag', placed: true }]);

    // Attempt jump to flagged square -> blocked
    const resJumpBlocked = gameReducer(resFlagOn.state, { type: 'JUMP', target });
    expect(resJumpBlocked.state.pos).toBe(state.pos);
    expect(resJumpBlocked.soundEvents).toEqual([{ type: 'nope' }]);

    // Toggle flag off
    const resFlagOff = gameReducer(resFlagOn.state, { type: 'TOGGLE_FLAG', target });
    expect(resFlagOff.state.flags.has(target)).toBe(false);
    expect(resFlagOff.soundEvents).toEqual([{ type: 'flag', placed: false }]);
  });

  it('handles mine hit, life decrement, and respawn at previous safe square', () => {
    let { state } = gameReducer({} as any, { type: 'INITIALIZE_GAME', board });
    // Find a jump that is a mine
    const mineJump = jumpsFrom(state.pos).find((k) => board.mines.has(k));

    if (mineJump !== undefined) {
      const initialPos = state.pos;
      const resMine = gameReducer(state, { type: 'JUMP', target: mineJump });

      expect(resMine.state.knights).toBe(1); // One knight spent
      expect(resMine.state.hit.has(mineJump)).toBe(true);
      expect(resMine.state.pos).toBe(initialPos); // Respawned at initialPos!
      expect(resMine.state.status).toBe('playing');
      expect(resMine.state.message).toContain('takes the field');
      expect(resMine.soundEvents).toEqual([{ type: 'mine' }, { type: 'respawn' }]);

      // Attempting to jump back onto the hit mine should be blocked
      const resRepeatHit = gameReducer(resMine.state, { type: 'JUMP', target: mineJump });
      expect(resRepeatHit.soundEvents).toEqual([{ type: 'nope' }]);
    }
  });

  it('detects game loss when losing both knights, leaving King standing', () => {
    let { state } = gameReducer({} as any, { type: 'INITIALIZE_GAME', board });
    // Artificially place a state with 1 knight left
    const stateWith1Life = { ...state, knights: 1 };
    const mineSquare = Array.from(board.mines)[0];

    // Force knight position adjacent to mineSquare
    const adjacentToMine = jumpsFrom(mineSquare)[0];
    const testState = {
      ...stateWith1Life,
      pos: adjacentToMine,
      opened: new Set([...stateWith1Life.opened, adjacentToMine]),
    };

    const resFatal = gameReducer(testState, { type: 'JUMP', target: mineSquare });
    expect(resFatal.state.knights).toBe(0);
    expect(resFatal.state.status).toBe('lost');
    expect(resFatal.state.message).toContain('The enemy King remains standing');
    expect(resFatal.soundEvents).toEqual([{ type: 'lose' }]);
  });

  it('detects victory on capturing enemy King', () => {
    let { state } = gameReducer({} as any, { type: 'INITIALIZE_GAME', board });
    const adjacentToExit = jumpsFrom(board.exit)[0];
    const testState = {
      ...state,
      pos: adjacentToExit,
      opened: new Set([...state.opened, adjacentToExit]),
    };

    const resWin = gameReducer(testState, { type: 'JUMP', target: board.exit });
    expect(resWin.state.status).toBe('won');
    expect(resWin.state.pos).toBe(board.exit);
    expect(resWin.state.message).toContain('KING CAPTURED');
    expect(resWin.soundEvents).toEqual([{ type: 'win' }]);
  });
});
