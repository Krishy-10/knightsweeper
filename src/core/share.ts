/**
 * Knightsweeper Share Card Generator
 * Formats spoiler-free textual share summaries for social sharing & clipboard.
 */

import { DifficultyPreset } from './types';

export interface DailyShareParams {
  dayNumber: number;
  dateString: string;
  difficulty: DifficultyPreset;
  won: boolean;
  moves: number;
  knights: number; // Survived knights (0..2)
  timeSeconds?: number;
  origin?: string;
}

export interface CustomShareParams {
  seed: number;
  difficulty: DifficultyPreset;
  origin?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Generates formatted text for Daily Challenge completion.
 */
export function generateDailyShareText({
  dayNumber,
  difficulty,
  won,
  moves,
  knights,
  timeSeconds,
  origin = 'https://knightsweeper.vercel.app',
}: DailyShareParams): string {
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const statusLine = won
    ? `🏆 Captured the enemy King in ${moves} moves!`
    : `💀 Both knights fell on the battlefield.`;
  
  const knightShields = won
    ? `🛡️ ${knights}/2 Knights survived`
    : `❌ 0/2 Knights survived`;

  const timePart = timeSeconds !== undefined ? `\n⏱️ Time: ${formatTime(timeSeconds)}` : '';
  const url = `${origin}?daily=true`;

  return [
    `Knightsweeper Daily #${dayNumber} (${diffLabel}) ♞`,
    statusLine,
    knightShields + timePart,
    url,
  ].join('\n');
}

/**
 * Generates URL and challenge text to challenge a friend to a specific battlefield.
 */
export function generateChallengeUrl(
  seed: number,
  difficulty: DifficultyPreset,
  origin = 'https://knightsweeper.vercel.app'
): string {
  return `${origin}?b=${seed}&d=${difficulty}`;
}

export function generateChallengeText({
  seed,
  difficulty,
  origin = 'https://knightsweeper.vercel.app',
}: CustomShareParams): string {
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const url = generateChallengeUrl(seed, difficulty, origin);
  return `Can you cross Battlefield #${seed} (${diffLabel}) and capture the King? ♞⚔️\nPlay here: ${url}`;
}

/**
 * Helper to copy text to clipboard with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
