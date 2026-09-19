/**
 * Knightsweeper Authentication Service
 * Manages Anonymous (Guest) and Google authentication states.
 */

import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  displayName: string;
  email: string | null;
  photoURL: string | null;
}

function mapFirebaseUser(user: any): UserProfile {
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    displayName: user.displayName || (user.isAnonymous ? `Guest #${user.uid.slice(-4)}` : 'Knight Commander'),
    email: user.email,
    photoURL: user.photoURL,
  };
}

/**
 * Subscribes to auth state changes. Automatically initiates silent anonymous login if unauthenticated.
 */
export function subscribeToAuth(
  onUserChanged: (profile: UserProfile | null) => void
): () => void {
  if (!isFirebaseConfigured() || !auth) {
    // Graceful offline fallback: local guest profile
    onUserChanged({
      uid: 'local-guest',
      isAnonymous: true,
      displayName: 'Guest Knight',
      email: null,
      photoURL: null,
    });
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: any) => {
    if (user) {
      onUserChanged(mapFirebaseUser(user));
    } else {
      // Auto-sign in anonymously so user has an identity immediately
      try {
        const cred = await signInAnonymously(auth);
        onUserChanged(mapFirebaseUser(cred.user));
      } catch (err) {
        console.warn('[Knightsweeper] Anonymous sign-in failed or disabled:', err);
        onUserChanged(null);
      }
    }
  });
}

/**
 * Links an anonymous user to a Google account or signs in with Google.
 * Preserves the anonymous player's UID and data if possible.
 */
export async function signInOrLinkWithGoogle(): Promise<UserProfile | null> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase is not configured yet. Add Firebase keys in .env.local to enable Google sign-in.');
  }

  const provider = new GoogleAuthProvider();
  const currentUser = auth.currentUser;

  try {
    if (currentUser && currentUser.isAnonymous) {
      // Upgrade anonymous guest to full Google user
      const result = await linkWithPopup(currentUser, provider);
      return mapFirebaseUser(result.user);
    } else {
      // Standard popup sign-in
      const result = await signInWithPopup(auth, provider);
      return mapFirebaseUser(result.user);
    }
  } catch (error: any) {
    // If the Google account already exists on another user, fall back to direct sign in
    if (error.code === 'auth/credential-already-in-use') {
      const result = await signInWithPopup(auth, provider);
      return mapFirebaseUser(result.user);
    }
    throw error;
  }
}

/**
 * Signs out the current user.
 */
export async function signOutAccount(): Promise<void> {
  if (!isFirebaseConfigured() || !auth) return;
  await signOut(auth);
}
