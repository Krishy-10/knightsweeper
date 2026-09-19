/**
 * Deterministic pseudo-random number generation using Mulberry32.
 * Produces 32-bit state with full period (2^32), passing SmallCrush tests.
 * Bit-for-bit identical to original prototype to preserve seed compatibility.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * In-place Fisher-Yates shuffle using provided PRNG.
 */
export function shuffle<T>(array: T[], rng: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Generates a random 5-digit seed [10000..99999].
 */
export function generateRandomSeed(): number {
  return 10000 + Math.floor(Math.random() * 90000);
}
