import { clueFor } from './clues';
import { KNIGHT_GRAPH } from './graph';
import { SolverResult, SquareKey } from './types';

/**
 * Deduction solver that models a cautious human player using single-clue logic.
 *
 * It traverses only across squares already proven safe, reads clues on reachable squares,
 * and when stuck, executes one round of constraint propagation:
 *  1. If clue === knownMines, all remaining unknown neighbor squares are safe.
 *  2. If clue - knownMines === unknownNeighbors.length, all remaining unknown neighbor squares are mines.
 *
 * Returns `{ rounds }` if the exit is provably reachable without guessing.
 * Returns `null` if the board requires a guess (or is impossible).
 */
export function solve(
  start: SquareKey,
  exit: SquareKey,
  mines: Set<SquareKey>
): SolverResult | null {
  const opened = new Set<SquareKey>();
  const safe = new Set<SquareKey>([exit]); // Star exit is guaranteed safe
  const knownMines = new Set<SquareKey>(); // Squares proven to contain mines

  const openSquare = (k: SquareKey) => {
    opened.add(k);
    safe.add(k);
  };

  openSquare(start);
  let rounds = 0;

  for (;;) {
    // 1. Walk: stand on every square the knight can reach through safe squares
    let reach: Set<SquareKey>;
    let grew = true;

    while (grew) {
      grew = false;
      reach = new Set<SquareKey>([start]);
      const queue: SquareKey[] = [start];

      while (queue.length > 0) {
        const q = queue.shift()!;
        for (const n of KNIGHT_GRAPH[q]) {
          if (safe.has(n) && !reach.has(n)) {
            reach.add(n);
            queue.push(n);
          }
        }
      }

      // If exit is in reachable safe squares, board is solved!
      if (reach.has(exit)) {
        return { rounds };
      }

      // Open newly reached squares
      for (const q of reach) {
        if (!opened.has(q)) {
          openSquare(q);
          grew = true;
        }
      }
    }

    // 2. Stuck: perform one round of single-clue deduction
    let newDeductions = 0;

    for (const q of opened) {
      const clue = clueFor(mines, q);
      let countKnown = 0;
      const unknown: SquareKey[] = [];

      for (const n of KNIGHT_GRAPH[q]) {
        if (knownMines.has(n)) {
          countKnown++;
        } else if (!safe.has(n)) {
          unknown.push(n);
        }
      }

      if (unknown.length === 0) continue;

      if (clue === countKnown) {
        // All remaining unknown neighbors are safe
        for (const n of unknown) {
          safe.add(n);
        }
        newDeductions += unknown.length;
      } else if (clue - countKnown === unknown.length) {
        // All remaining unknown neighbors are mines
        for (const n of unknown) {
          knownMines.add(n);
        }
        newDeductions += unknown.length;
      }
    }

    // If no new deductions could be made, board cannot be solved without guessing
    if (newDeductions === 0) {
      return null;
    }

    rounds++;
  }
}

/**
 * Convenience helper to test if a layout is solvable without guessing.
 */
export function isSolvable(
  start: SquareKey,
  exit: SquareKey,
  mines: Set<SquareKey>
): boolean {
  return solve(start, exit, mines) !== null;
}
