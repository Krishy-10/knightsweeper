import { describe, expect, it } from 'vitest';
import { clueFor, clueNeighborhood } from '../src/core/clues';
import { key } from '../src/core/coordinates';
import { jumpsFrom } from '../src/core/graph';

describe('Clue Calculation and Neighborhoods', () => {
  it('correctly counts mines among knight jumps', () => {
    const d2 = key(6, 3); // d2
    const jumps = jumpsFrom(d2);

    // No mines
    expect(clueFor(new Set(), d2)).toBe(0);

    // Place mines on some jump squares
    const mines = new Set([jumps[0], jumps[1], jumps[2]]);
    expect(clueFor(mines, d2)).toBe(3);

    // Place mines on non-jump squares (should not affect d2's clue)
    mines.add(d2); // mine on d2 itself does not affect d2's clue
    mines.add(key(0, 0)); // distant mine
    expect(clueFor(mines, d2)).toBe(3);
  });

  it('returns exact knight neighborhood as counted squares', () => {
    const e4 = key(4, 4);
    expect(clueNeighborhood(e4)).toEqual(jumpsFrom(e4));
  });
});
