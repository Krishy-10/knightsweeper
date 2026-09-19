import { BOARD_SIZE, FILES } from './constants';
import { Coordinates, SquareKey } from './types';

/**
 * Checks if row and column coordinates are within board boundaries [0, 7].
 */
export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

/**
 * Encodes row and column into a single integer key [0..63].
 * Row 0 is rank 8 (top), row 7 is rank 1 (bottom).
 * Col 0 is file a (left), col 7 is file h (right).
 */
export function key(r: number, c: number): SquareKey {
  return r * BOARD_SIZE + c;
}

/**
 * Extracts row index [0..7] from square key.
 */
export function rowOf(k: SquareKey): number {
  return Math.floor(k / BOARD_SIZE);
}

/**
 * Extracts column index [0..7] from square key.
 */
export function colOf(k: SquareKey): number {
  return k % BOARD_SIZE;
}

/**
 * Returns coordinate object { row, col } from square key.
 */
export function coordsOf(k: SquareKey): Coordinates {
  return { row: rowOf(k), col: colOf(k) };
}

/**
 * Formats square key as standard algebraic chess notation (e.g. 'e4', 'a1', 'h8').
 */
export function nameOf(k: SquareKey): string {
  const r = rowOf(k);
  const c = colOf(k);
  return `${FILES[c]}${BOARD_SIZE - r}`;
}

/**
 * Parses algebraic notation string (e.g. 'e4') into square key.
 */
export function keyFromName(name: string): SquareKey | null {
  if (name.length !== 2) return null;
  const colChar = name[0].toLowerCase();
  const rankChar = name[1];
  const c = FILES.indexOf(colChar);
  const rank = parseInt(rankChar, 10);
  if (c === -1 || isNaN(rank) || rank < 1 || rank > BOARD_SIZE) return null;
  const r = BOARD_SIZE - rank;
  return key(r, c);
}

/**
 * Determines chessboard square color.
 * Even sum of row and col is light square, odd is dark square.
 */
export function isLightSquare(k: SquareKey): boolean {
  return (rowOf(k) + colOf(k)) % 2 === 0;
}
