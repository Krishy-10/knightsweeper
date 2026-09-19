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
});
