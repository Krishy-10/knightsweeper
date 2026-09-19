import { describe, expect, it } from 'vitest';
import { calculateUpdatedStats, INITIAL_STATS } from '../src/core/stats';

describe('Player Stats & Streaks Calculation', () => {
  it('updates stats correctly on game won', () => {
    const s1 = calculateUpdatedStats(INITIAL_STATS, {
      won: true,
      moves: 12,
      difficulty: 'medium',
    });

    expect(s1.gamesPlayed).toBe(1);
    expect(s1.gamesWon).toBe(1);
    expect(s1.currentStreak).toBe(1);
    expect(s1.maxStreak).toBe(1);
    expect(s1.bestMoves.medium).toBe(12);
    expect(s1.bestMoves.easy).toBeNull();
    expect(s1.moveDistribution['11-14']).toBe(1);
  });

  it('resets current streak on game lost without erasing max streak', () => {
    let stats = calculateUpdatedStats(INITIAL_STATS, {
      won: true,
      moves: 8,
      difficulty: 'easy',
    });
    stats = calculateUpdatedStats(stats, {
      won: true,
      moves: 10,
      difficulty: 'easy',
    });
    expect(stats.currentStreak).toBe(2);
    expect(stats.maxStreak).toBe(2);

    // Lose game
    stats = calculateUpdatedStats(stats, {
      won: false,
      moves: 5,
      difficulty: 'hard',
    });
    expect(stats.gamesPlayed).toBe(3);
    expect(stats.gamesWon).toBe(2);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(2);
  });

  it('tracks completed daily challenges by date string', () => {
    const s1 = calculateUpdatedStats(INITIAL_STATS, {
      won: true,
      moves: 14,
      difficulty: 'medium',
      dailyDateString: '2026-09-19',
    });

    expect(s1.completedDailies).toContain('2026-09-19');

    // Duplicate daily win should not duplicate entry
    const s2 = calculateUpdatedStats(s1, {
      won: true,
      moves: 12,
      difficulty: 'medium',
      dailyDateString: '2026-09-19',
    });
    expect(s2.completedDailies.length).toBe(1);
  });
});
