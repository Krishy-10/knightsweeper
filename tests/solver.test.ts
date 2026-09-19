import { describe, expect, it } from 'vitest';
import { key } from '../src/core/coordinates';
import { jumpsFrom } from '../src/core/graph';
import { isSolvable, solve } from '../src/core/solver';

describe('Deduction Solver', () => {
  it('solves an empty board by expanding safe frontier across deduction rounds', () => {
    const start = key(7, 1); // b1
    const exit = key(0, 2); // c8 (distance >= 3)
    const mines = new Set<number>();

    const result = solve(start, exit, mines);
    expect(result).not.toBeNull();
    // With 0 mines, each round deduces the next wave of squares are safe until exit is reached
    expect(result?.rounds).toBeGreaterThanOrEqual(1);
  });

  it('rejects a board where exit is unreachable without forced guesses', () => {
    const start = key(7, 1);
    const exit = key(0, 2);
    // Put mines on all jumps entering exit
    const mines = new Set(jumpsFrom(exit));

    const result = solve(start, exit, mines);
    expect(result).toBeNull();
    expect(isSolvable(start, exit, mines)).toBe(false);
  });

  it('correctly reports 0 deduction rounds when exit is immediately adjacent to start', () => {
    const start = key(7, 1);
    const jumps = jumpsFrom(start);
    const exit = jumps[0]; // Exit is an immediate knight jump from start
    const mines = new Set<number>();

    // Since exit is always inherently safe, knight reaches it on walk 0
    const result = solve(start, exit, mines);
    expect(result).not.toBeNull();
    expect(result?.rounds).toBe(0);
  });

  it('rejects an ambiguous board where all start jumps are unknown and non-zero', () => {
    const start = key(7, 1);
    const exit = key(0, 2);
    const jumps = jumpsFrom(start);
    // Exactly 1 mine among 6 jumps: single-clue cannot deduce which one is safe
    const mines = new Set<number>([jumps[0]]);

    const result = solve(start, exit, mines);
    // Cannot make deduction on start square (clue = 1, unknown = 6, known = 0)
    expect(result).toBeNull();
  });
});
