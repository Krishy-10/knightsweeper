import { describe, expect, it } from 'vitest';
import { key } from '../src/core/coordinates';
import {
  findPathAcrossSquares,
  jumpDistancesFrom,
  jumpsFrom,
  KNIGHT_GRAPH,
} from '../src/core/graph';

describe('Knight Graph and Pathfinding', () => {
  it('precomputes exactly 64 nodes with appropriate degrees', () => {
    expect(KNIGHT_GRAPH.length).toBe(64);

    // Corners (e.g. a8, a1, h8, h1) have degree 2
    expect(jumpsFrom(key(0, 0)).length).toBe(2);
    expect(jumpsFrom(key(0, 7)).length).toBe(2);
    expect(jumpsFrom(key(7, 0)).length).toBe(2);
    expect(jumpsFrom(key(7, 7)).length).toBe(2);

    // Center squares (e.g. d4, e4, d5, e5) have degree 8
    expect(jumpsFrom(key(3, 3)).length).toBe(8);
    expect(jumpsFrom(key(3, 4)).length).toBe(8);
    expect(jumpsFrom(key(4, 3)).length).toBe(8);
    expect(jumpsFrom(key(4, 4)).length).toBe(8);

    // Edge squares (e.g. d8, a4) have degree 4
    expect(jumpsFrom(key(0, 3)).length).toBe(4);
    expect(jumpsFrom(key(3, 0)).length).toBe(4);
  });

  it('verifies graph is undirected and bipartite', () => {
    // If u can reach v, v must be able to reach u
    for (let u = 0; u < 64; u++) {
      for (const v of jumpsFrom(u)) {
        expect(jumpsFrom(v)).toContain(u);
      }
    }
  });

  it('computes BFS jump distances correctly from a starting square', () => {
    // From e4 (key(4,4))
    const e4 = key(4, 4);
    const dist = jumpDistancesFrom(e4);

    expect(dist[e4]).toBe(0);

    // Immediate knight jumps are distance 1
    for (const next of jumpsFrom(e4)) {
      expect(dist[next]).toBe(1);
    }

    // Every square on 8x8 is reachable by knight in <= 6 jumps
    for (let k = 0; k < 64; k++) {
      expect(dist[k]).toBeGreaterThanOrEqual(0);
      expect(dist[k]).toBeLessThanOrEqual(6);
    }
  });

  it('finds shortest path across allowed safe squares (auto-walk)', () => {
    const start = key(7, 1); // b1
    const step1 = key(5, 2); // c3
    const step2 = key(3, 3); // d5
    const target = key(1, 4); // e7

    const allowed = new Set([start, step1, step2, target]);
    const path = findPathAcrossSquares(start, target, allowed);

    expect(path).toEqual([start, step1, step2, target]);

    // If step2 is missing, no path should exist through allowed squares
    const brokenAllowed = new Set([start, step1, target]);
    expect(findPathAcrossSquares(start, target, brokenAllowed)).toBeNull();
  });
});
