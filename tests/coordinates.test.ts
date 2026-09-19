import { describe, expect, it } from 'vitest';
import {
  colOf,
  coordsOf,
  inBounds,
  isLightSquare,
  key,
  keyFromName,
  nameOf,
  rowOf,
} from '../src/core/coordinates';

describe('Coordinates and Board Mapping', () => {
  it('correctly identifies boundary limits', () => {
    expect(inBounds(0, 0)).toBe(true);
    expect(inBounds(7, 7)).toBe(true);
    expect(inBounds(3, 4)).toBe(true);

    expect(inBounds(-1, 0)).toBe(false);
    expect(inBounds(0, -1)).toBe(false);
    expect(inBounds(8, 0)).toBe(false);
    expect(inBounds(0, 8)).toBe(false);
  });

  it('correctly maps (row, col) to flat key and vice versa', () => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const k = key(r, c);
        expect(k).toBeGreaterThanOrEqual(0);
        expect(k).toBeLessThan(64);
        expect(rowOf(k)).toBe(r);
        expect(colOf(k)).toBe(c);
        expect(coordsOf(k)).toEqual({ row: r, col: c });
      }
    }
  });

  it('correctly produces standard chess algebraic notation', () => {
    // Row 0 is Rank 8; Row 7 is Rank 1.
    // Col 0 is File a; Col 7 is File h.
    expect(nameOf(key(0, 0))).toBe('a8');
    expect(nameOf(key(0, 7))).toBe('h8');
    expect(nameOf(key(7, 0))).toBe('a1');
    expect(nameOf(key(7, 7))).toBe('h1');
    expect(nameOf(key(4, 3))).toBe('d4');
    expect(nameOf(key(4, 4))).toBe('e4');
  });

  it('correctly parses algebraic notation into keys', () => {
    expect(keyFromName('a8')).toBe(key(0, 0));
    expect(keyFromName('h8')).toBe(key(0, 7));
    expect(keyFromName('a1')).toBe(key(7, 0));
    expect(keyFromName('h1')).toBe(key(7, 7));
    expect(keyFromName('e4')).toBe(key(4, 4));

    expect(keyFromName('i4')).toBeNull();
    expect(keyFromName('e9')).toBeNull();
    expect(keyFromName('invalid')).toBeNull();
  });

  it('alternates light and dark squares correctly', () => {
    // a8 (0,0) is light
    expect(isLightSquare(key(0, 0))).toBe(true);
    // b8 (0,1) is dark
    expect(isLightSquare(key(0, 1))).toBe(false);
    // a1 (7,0) is dark (7+0=7 odd)
    expect(isLightSquare(key(7, 0))).toBe(false);
    // h1 (7,7) is light (7+7=14 even)
    expect(isLightSquare(key(7, 7))).toBe(true);
  });
});
