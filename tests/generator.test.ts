import { describe, expect, it } from 'vitest';
import { colOf, rowOf } from '../src/core/coordinates';
import { generateBoard } from '../src/core/generator';
import { jumpDistancesFrom } from '../src/core/graph';
import { solve } from '../src/core/solver';

describe('Procedural Battlefield Generator', () => {
  it('generates reproducible battlefields from identical seed and difficulty', () => {
    const seed = 54321;
    const b1 = generateBoard({ seed, difficulty: 'medium' });
    const b2 = generateBoard({ seed, difficulty: 'medium' });

    expect(b1.start).toBe(b2.start);
    expect(b1.exit).toBe(b2.exit);
    expect(b1.mineCount).toBe(b2.mineCount);
    expect(b1.difficulty).toBe('medium');
    expect(Array.from(b1.mines).sort()).toEqual(Array.from(b2.mines).sort());
    expect(b1.rounds).toBe(b2.rounds);
  });

  it('generates battlefields satisfying all core rules and King constraints', () => {
    const b = generateBoard(12345);

    // 1. Start on bottom two ranks (rows 6..7), files b..g (cols 1..6)
    const startRow = rowOf(b.start);
    const startCol = colOf(b.start);
    expect(startRow).toBeGreaterThanOrEqual(6);
    expect(startRow).toBeLessThanOrEqual(7);
    expect(startCol).toBeGreaterThanOrEqual(1);
    expect(startCol).toBeLessThanOrEqual(6);

    // 2. Enemy King (exit) on top two ranks (rows 0..1)
    const kingRow = rowOf(b.exit);
    expect(kingRow).toBeGreaterThanOrEqual(0);
    expect(kingRow).toBeLessThanOrEqual(1);

    // 3. Distance from start to King is at least 3 jumps
    const dist = jumpDistancesFrom(b.start);
    expect(dist[b.exit]).toBeGreaterThanOrEqual(3);

    // 4. Start and King can never contain mines
    expect(b.mines.has(b.start)).toBe(false);
    expect(b.mines.has(b.exit)).toBe(false);

    // 5. Battlefield passes solver with at least 3 rounds of deduction
    const result = solve(b.start, b.exit, b.mines);
    expect(result).not.toBeNull();
    expect(result!.rounds).toBeGreaterThanOrEqual(3);
  });

  it('supports Easy (8), Medium (16), and Hard (24) difficulty presets with Medium default', () => {
    const bDefault = generateBoard(77777);
    expect(bDefault.difficulty).toBe('medium');
    expect(bDefault.mines.size).toBeLessThanOrEqual(16);

    const bEasy = generateBoard({ seed: 77777, difficulty: 'easy' });
    expect(bEasy.difficulty).toBe('easy');
    expect(bEasy.mines.size).toBeLessThanOrEqual(8);

    const bMedium = generateBoard({ seed: 77777, difficulty: 'medium' });
    expect(bMedium.difficulty).toBe('medium');
    expect(bMedium.mines.size).toBeLessThanOrEqual(16);

    const bHard = generateBoard({ seed: 77777, difficulty: 'hard' });
    expect(bHard.difficulty).toBe('hard');
    expect(bHard.mines.size).toBeLessThanOrEqual(24);
  });
});
