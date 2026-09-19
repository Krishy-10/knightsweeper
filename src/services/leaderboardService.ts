/**
 * Knightsweeper Daily Leaderboard Service
 * Submits and retrieves daily challenge leaderboard records from Cloud Firestore.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { DifficultyPreset } from '../core/types';
import { db, isFirebaseConfigured } from '../lib/firebase';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  moves: number;
  timeSeconds: number;
  knightsRemaining: number;
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
}

/**
 * Submits a player's score to the Daily Leaderboard for a given date.
 * If a previous score exists for this user, keeps the better score (fewer moves, or faster time).
 */
export async function submitDailyScore(params: SubmitScoreParams): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) {
    return false;
  }

  try {
    const scoreDocRef = doc(db, 'daily_leaderboards', params.dateString, 'scores', params.uid);
    const existingSnap = await getDoc(scoreDocRef);

    if (existingSnap.exists()) {
      const prev = existingSnap.data() as LeaderboardEntry;
      // Only update if current run is superior (fewer moves, or same moves in faster time)
      const isBetter =
        params.moves < prev.moves ||
        (params.moves === prev.moves && params.timeSeconds < prev.timeSeconds);

      if (!isBetter) {
        return false;
      }
    }

    const payload: LeaderboardEntry = {
      uid: params.uid,
      displayName: params.displayName,
      photoURL: params.photoURL,
      moves: params.moves,
      timeSeconds: params.timeSeconds,
      knightsRemaining: params.knightsRemaining,
      difficulty: params.difficulty,
      seed: params.seed,
      submittedAt: new Date().toISOString(),
    };

    await setDoc(scoreDocRef, payload);
    return true;
  } catch (error) {
    console.warn('[Knightsweeper] Failed to submit score to leaderboard:', error);
    return false;
  }
}

/**
 * Fetches the top scores for a specific daily challenge date.
 */
export async function fetchDailyLeaderboard(
  dateString: string,
  difficulty: DifficultyPreset = 'medium',
  maxRecords: number = 20
): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured() || !db) {
    return [];
  }

  try {
    const scoresColRef = collection(db, 'daily_leaderboards', dateString, 'scores');
    const q = query(
      scoresColRef,
      where('difficulty', '==', difficulty),
      orderBy('moves', 'asc'),
      orderBy('timeSeconds', 'asc'),
      limit(maxRecords)
    );

    const snapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    snapshot.forEach((docSnap: any) => {
      results.push(docSnap.data() as LeaderboardEntry);
    });

    return results;
  } catch (error) {
    console.warn('[Knightsweeper] Failed to fetch leaderboard:', error);
    return [];
  }
}
