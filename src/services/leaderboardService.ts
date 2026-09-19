/**
 * Knightsweeper Daily Leaderboard Service
 * Submits verified runs to the server API and fetches daily challenge leaderboard records with caching.
 */

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { DifficultyPreset, SquareKey } from '../core/types';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  moves: number;
  timeSeconds: number;
  knightsRemaining?: number;
  difficulty: DifficultyPreset;
  seed: number;
  submittedAt: string;
}

export interface SubmitScoreParams {
  dateString: string;
  uid: string;
  displayName: string;
  photoURL: string | null;
  moves: number;
  timeSeconds: number;
  knightsRemaining: number;
  difficulty: DifficultyPreset;
  seed: number;
  movesHistory?: SquareKey[];
}

// In-memory 60-second read cache to protect free-tier Firestore quotas
interface CacheItem {
  timestamp: number;
  data: LeaderboardEntry[];
}
const leaderboardCache: Record<string, CacheItem> = {};
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Submits a player's score to the Daily Leaderboard.
 * Posts to /api/daily/submit where the move list is replayed and verified server-side.
 */
export async function submitDailyScore(params: SubmitScoreParams): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    return false;
  }

  try {
    const idToken = await auth?.currentUser?.getIdToken();
    if (!idToken) {
      console.warn('[Leaderboard] No active auth token available for submission');
      return false;
    }

    const response = await fetch('/api/daily/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: params.dateString,
        movesHistory: params.movesHistory || [],
        timeSeconds: params.timeSeconds,
        idToken,
        displayName: params.displayName,
        photoURL: params.photoURL,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn('[Leaderboard] Server rejected score submission:', err);
      return false;
    }

    // Invalidate local in-memory cache for this date so latest leaderboard reflects immediately
    const cacheKey = `${params.dateString}:${params.difficulty}`;
    delete leaderboardCache[cacheKey];

    return true;
  } catch (error) {
    console.warn('[Leaderboard] Network error submitting score:', error);
    return false;
  }
}

/**
 * Fetches top scores for a specific daily challenge date.
 * Caches in-memory for 60 seconds and caps query at 50 records to protect quotas.
 */
export async function fetchDailyLeaderboard(
  dateString: string,
  difficulty: DifficultyPreset = 'medium',
  maxRecords: number = 25
): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured() || !db) {
    return [];
  }

  const safeCap = Math.min(Math.max(1, maxRecords), 50);
  const cacheKey = `${dateString}:${difficulty}`;

  // Check 60-second in-memory cache
  const cached = leaderboardCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const scoresColRef = collection(db, 'daily_leaderboards', dateString, 'scores');
    const q = query(
      scoresColRef,
      where('difficulty', '==', difficulty),
      orderBy('moves', 'asc'),
      orderBy('timeSeconds', 'asc'),
      limit(safeCap)
    );

    const snapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();

      results.push({
        uid: data.uid,
        displayName: data.displayName,
        photoURL: data.photoURL,
        moves: data.moves,
        timeSeconds: data.timeSeconds,
        knightsRemaining: data.knightsRemaining ?? 2,
        difficulty: data.difficulty,
        seed: data.seed,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });

    // Store in cache
    leaderboardCache[cacheKey] = {
      timestamp: Date.now(),
      data: results,
    };

    return results;
  } catch (error) {
    console.warn('[Leaderboard] Failed to fetch leaderboard:', error);
    return [];
  }
}
