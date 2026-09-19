import { KNIGHT_GRAPH } from './graph';
import { SquareKey } from './types';

/**
 * Calculates the clue number for square `k`:
 * The count of hidden mines residing on squares a knight can jump to from `k`.
 */
export function clueFor(mines: Set<SquareKey>, k: SquareKey): number {
  let count = 0;
  for (const neighbor of KNIGHT_GRAPH[k]) {
    if (mines.has(neighbor)) {
      count++;
    }
  }
  return count;
}

/**
 * Returns all squares that square `k`'s clue counts (i.e. its knight-move neighborhood).
 */
export function clueNeighborhood(k: SquareKey): readonly SquareKey[] {
  return KNIGHT_GRAPH[k];
}
