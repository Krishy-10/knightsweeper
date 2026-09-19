/**
 * Knightsweeper Daily Challenge Utilities
 * Generates deterministic daily seeds based on UTC dates.
 */

const EPOCH_DATE_MS = Date.UTC(2025, 0, 1); // 2025-01-01T00:00:00Z

/**
 * FNV-1a 32-bit hash implementation to convert a string into a positive seed integer.
 */
export function hashStringToSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Return positive 6-digit seed [100000, 999999]
  return (Math.abs(hash) % 900000) + 100000;
}

/**
 * Formats a Date object as a canonical UTC "YYYY-MM-DD" string.
 */
export function formatUtcDateString(d: Date = new Date()): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DailyChallengeInfo {
  dateString: string;
  dayNumber: number;
  seed: number;
}

/**
 * Returns the daily challenge metadata for a given date (defaults to current UTC date).
 */
export function getDailyChallenge(targetDate?: Date | string): DailyChallengeInfo {
  let d: Date;
  if (!targetDate) {
    d = new Date();
  } else if (typeof targetDate === 'string') {
    const [y, m, day] = targetDate.split('-').map(Number);
    d = new Date(Date.UTC(y, m - 1, day));
  } else {
    d = targetDate;
  }

  const dateString = formatUtcDateString(d);
  const targetMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const dayNumber = Math.max(1, Math.floor((targetMs - EPOCH_DATE_MS) / 86400000) + 1);
  const seed = hashStringToSeed(`${dateString}:knightsweeper-daily`);

  return {
    dateString,
    dayNumber,
    seed,
  };
}
