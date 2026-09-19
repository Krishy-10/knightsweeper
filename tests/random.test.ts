import { describe, expect, it } from 'vitest';
import { generateRandomSeed, mulberry32, shuffle } from '../src/core/random';

describe('Mulberry32 PRNG and Shuffle', () => {
  it('is completely deterministic for identical seeds', () => {
    const rng1 = mulberry32(42424);
    const rng2 = mulberry32(42424);

    const values1 = Array.from({ length: 10 }, () => rng1());
    const values2 = Array.from({ length: 10 }, () => rng2());

    expect(values1).toEqual(values2);
    values1.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = mulberry32(11111);
    const rng2 = mulberry32(22222);

    const v1 = rng1();
    const v2 = rng2();
    expect(v1).not.toBe(v2);
  });

  it('shuffles arrays deterministically with Mulberry32', () => {
    const seed = 98765;
    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8];
    const arr2 = [1, 2, 3, 4, 5, 6, 7, 8];

    shuffle(arr1, mulberry32(seed));
    shuffle(arr2, mulberry32(seed));

    expect(arr1).toEqual(arr2);
    expect(arr1.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('generates random seeds within [10000..99999]', () => {
    for (let i = 0; i < 20; i++) {
      const s = generateRandomSeed();
      expect(s).toBeGreaterThanOrEqual(10000);
      expect(s).toBeLessThanOrEqual(99999);
    }
  });
});
