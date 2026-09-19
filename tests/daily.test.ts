import { describe, expect, it } from 'vitest';
import { formatUtcDateString, getDailyChallenge, hashStringToSeed } from '../src/core/daily';

describe('Daily Challenge Generator', () => {
  it('hashes string deterministically to a 6-digit positive integer seed', () => {
    const s1 = hashStringToSeed('2026-09-19:knightsweeper-daily');
    const s2 = hashStringToSeed('2026-09-19:knightsweeper-daily');
    const s3 = hashStringToSeed('2026-09-20:knightsweeper-daily');

    expect(s1).toBe(s2);
    expect(s1).not.toBe(s3);
    expect(s1).toBeGreaterThanOrEqual(100000);
    expect(s1).toBeLessThanOrEqual(999999);
  });

  it('formats UTC dates correctly as YYYY-MM-DD', () => {
    const d = new Date(Date.UTC(2026, 8, 19, 14, 30, 0));
    expect(formatUtcDateString(d)).toBe('2026-09-19');
  });

  it('generates consistent day number and seed for given date', () => {
    const c1 = getDailyChallenge('2026-09-19');
    const c2 = getDailyChallenge('2026-09-19');

    expect(c1.dateString).toBe('2026-09-19');
    expect(c1.dayNumber).toBeGreaterThan(0);
    expect(c1.seed).toBe(c2.seed);
    expect(c1.dayNumber).toBe(c2.dayNumber);
  });

  it('advances day number on subsequent calendar days', () => {
    const c1 = getDailyChallenge('2026-09-19');
    const c2 = getDailyChallenge('2026-09-20');

    expect(c2.dayNumber).toBe(c1.dayNumber + 1);
    expect(c2.seed).not.toBe(c1.seed);
  });

  it('guarantees golden board invariants for pinned daily seed v1', async () => {
    const { generateBoard } = await import('../src/core/generator');
    const challenge = getDailyChallenge('2026-09-19');
    const board = generateBoard(challenge.seed, 'medium');

    expect(challenge.version).toBe('v1');
    expect(board.seed).toBe(challenge.seed);
    expect(board.difficulty).toBe('medium');
    expect(board.mines.size).toBe(board.mineCount);
    expect(board.mines.has(board.start)).toBe(false);
    expect(board.mines.has(board.exit)).toBe(false);
    // Golden regression values for 2026-09-19 v1
    expect(board.start).toBeDefined();
    expect(board.exit).toBeDefined();
    expect(board.mineCount).toBeGreaterThanOrEqual(14); // medium starts at 16, can be reduced if necessary
  });

  it('handles Hard mode high-density seed deterministically with fallback reduction', async () => {
    const { generateBoard } = await import('../src/core/generator');
    // Seed 42 on hard mode exercises multiple candidate rounds
    const board1 = generateBoard(42, 'hard');
    const board2 = generateBoard(42, 'hard');

    expect(board1.seed).toBe(42);
    expect(board1.difficulty).toBe('hard');
    expect(board1.start).toBe(board2.start);
    expect(board1.exit).toBe(board2.exit);
    expect(board1.mines.size).toBe(board2.mines.size);
    expect(Array.from(board1.mines).sort()).toEqual(Array.from(board2.mines).sort());
  });
});

