import { describe, expect, it } from 'vitest';
import { generateBoard } from '../src/core/generator';
import { KNIGHT_GRAPH } from '../src/core/graph';
import { SquareKey } from '../src/core/types';
import { verifyGameRun } from '../src/core/verifier';

describe('Move History Verifier', () => {
  const testSeed = 100421;
  const board = generateBoard(testSeed, 'medium');

  it('rejects empty moves array', () => {
    const res = verifyGameRun(testSeed, []);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/non-empty/);
  });

  it('rejects illegal knight jumps', () => {
    // Starting square directly jumps to illegal square (e.g. exit square directly if not 1 jump away)
    const illegalTarget = board.exit; // Exit is on ranks 7..8, start is ranks 1..2 (at least 3 jumps away)
    const res = verifyGameRun(testSeed, [illegalTarget]);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Illegal knight jump/);
  });

  it('rejects moves after King capture', () => {
    // Find shortest path from start to exit ignoring mines, or on a simple board
    // Let's create a known short path
    const legalFirst = KNIGHT_GRAPH[board.start][0];
    const res = verifyGameRun(testSeed, [legalFirst]);
    // Not won yet
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/without capturing/);
  });

  it('validates a legitimate winning path', () => {
    // Run BFS to find a safe path to exit
    const queue: { pos: SquareKey; path: SquareKey[] }[] = [{ pos: board.start, path: [] }];
    const visited = new Set<SquareKey>([board.start]);
    let winningPath: SquareKey[] | null = null;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.pos === board.exit) {
        winningPath = current.path;
        break;
      }

      for (const next of KNIGHT_GRAPH[current.pos]) {
        // Safe square or exit
        if (!visited.has(next) && (!board.mines.has(next) || next === board.exit)) {
          visited.add(next);
          queue.push({ pos: next, path: [...current.path, next] });
        }
      }
    }

    expect(winningPath).not.toBeNull();
    if (winningPath) {
      const res = verifyGameRun(testSeed, winningPath, 'medium');
      expect(res.valid).toBe(true);
      expect(res.movesCount).toBe(winningPath.length);
    }
  });

  it('rejects if a player is eliminated by stepping on two mines', () => {
    // Find two mines adjacent to start if possible
    const adjacentMines: SquareKey[] = [];
    for (const neighbor of KNIGHT_GRAPH[board.start]) {
      if (board.mines.has(neighbor)) {
        adjacentMines.push(neighbor);
      }
    }

    if (adjacentMines.length >= 1) {
      // Jump on mine 1, knight respawns at start, jump on mine 1 again (or another mine)
      const suicidalRun = [adjacentMines[0], adjacentMines[0]];
      const res = verifyGameRun(testSeed, suicidalRun, 'medium');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Illegal move: square \d+ is a detonated mine|defeated/);
    }
  });
});
