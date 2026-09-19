/**
 * Knightsweeper Career Stats Cloud Sync Service
 * Seamlessly syncs local-first career stats to Firestore for authenticated users.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { loadPlayerStats, mergePlayerStats, PlayerStats, savePlayerStats } from '../core/stats';
import { db, isFirebaseConfigured } from '../lib/firebase';

/**
 * Synchronizes career stats with Cloud Firestore for a given user.
 * Merges local and cloud records so no offline or previous progress is lost.
 */
export async function syncCareerStatsWithCloud(uid: string): Promise<PlayerStats> {
  const localStats = loadPlayerStats();
  if (!isFirebaseConfigured() || !db || !uid || uid === 'local-guest') {
    return localStats;
  }

  try {
    const statsDocRef = doc(db, 'users', uid, 'career_stats', 'summary');
    const snap = await getDoc(statsDocRef);

    if (snap.exists()) {
      const cloudStats = snap.data() as PlayerStats;
      const merged = mergePlayerStats(localStats, cloudStats);
      savePlayerStats(merged);
      await setDoc(statsDocRef, merged);
      return merged;
    } else {
      // First time user linked an account: upload their current local stats to the cloud
      await setDoc(statsDocRef, localStats);
      return localStats;
    }
  } catch (error) {
    console.warn('[StatsSync] Cloud stats sync warning:', error);
    return localStats;
  }
}

/**
 * Pushes updated career stats to the cloud.
 */
export async function pushCareerStatsToCloud(uid: string, stats: PlayerStats): Promise<void> {
  if (!isFirebaseConfigured() || !db || !uid || uid === 'local-guest') {
    return;
  }

  try {
    const statsDocRef = doc(db, 'users', uid, 'career_stats', 'summary');
    await setDoc(statsDocRef, stats);
  } catch (error) {
    console.warn('[StatsSync] Failed to push stats to cloud:', error);
  }
}
