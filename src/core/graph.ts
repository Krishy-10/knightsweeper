import { KNIGHT_JUMPS, TOTAL_SQUARES } from './constants';
import { colOf, inBounds, key, rowOf } from './coordinates';
import { SquareKey } from './types';

/**
 * Precomputed adjacency list for knight moves on an 8x8 chessboard.
 * KNIGHT_GRAPH[k] contains the list of all valid squares a knight can jump to from square k.
 * Built once at initialization time.
 */
export const KNIGHT_GRAPH: ReadonlyArray<readonly SquareKey[]> = (() => {
  const table: SquareKey[][] = [];
  for (let k = 0; k < TOTAL_SQUARES; k++) {
    const list: SquareKey[] = [];
    const r = rowOf(k);
    const c = colOf(k);
    for (const [dr, dc] of KNIGHT_JUMPS) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc)) {
        list.push(key(nr, nc));
      }
    }
    table.push(list);
  }
  return table;
})();

/**
 * Returns all valid knight jumps from a given square.
 */
export function jumpsFrom(k: SquareKey): readonly SquareKey[] {
  return KNIGHT_GRAPH[k];
}

/**
 * Computes minimum knight jump distances from a start square to all other 63 squares
 * using unweighted Breadth-First Search (BFS).
 */
export function jumpDistancesFrom(start: SquareKey): number[] {
  const dist = new Array<number>(TOTAL_SQUARES).fill(-1);
  dist[start] = 0;
  const queue: SquareKey[] = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = dist[current];
    for (const next of KNIGHT_GRAPH[current]) {
      if (dist[next] < 0) {
        dist[next] = currentDist + 1;
        queue.push(next);
      }
    }
  }

  return dist;
}

/**
 * Finds shortest sequence of knight moves from `from` to `to`, traversing ONLY
 * through `allowedSquares` (e.g. already opened safe squares).
 * Returns array of square keys starting with `from` and ending with `to`, or null if unreachable.
 */
export function findPathAcrossSquares(
  from: SquareKey,
  to: SquareKey,
  allowedSquares: Set<SquareKey>
): SquareKey[] | null {
  if (from === to) return [from];
  if (!allowedSquares.has(to) && to !== from) return null;

  const visited = new Set<SquareKey>([from]);
  const parent = new Map<SquareKey, SquareKey>();
  const queue: SquareKey[] = [from];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === to) {
      // Reconstruct path
      const path: SquareKey[] = [];
      let step: SquareKey | undefined = to;
      while (step !== undefined) {
        path.unshift(step);
        step = parent.get(step);
      }
      return path;
    }

    for (const next of KNIGHT_GRAPH[curr]) {
      if (allowedSquares.has(next) && !visited.has(next)) {
        visited.add(next);
        parent.set(next, curr);
        queue.push(next);
      }
    }
  }

  return null;
}
