/**
 * Knightsweeper Authentication Service
 * Manages Anonymous (Guest) and Google authentication states.
 */

import {
  GoogleAuthProvider,
  linkWithPopup,
  onIdTokenChanged,
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

export function mapFirebaseUser(user: any): UserProfile {
  const hasGoogle =
    Array.isArray(user?.providerData) &&
    user.providerData.some((p: any) => p?.providerId === 'google.com');

  const isAnon = Boolean(user?.isAnonymous) && !hasGoogle;
  const googleProvider = hasGoogle
    ? user.providerData.find((p: any) => p?.providerId === 'google.com')
    : null;

  const displayName =
    user?.displayName ||
    googleProvider?.displayName ||
    (isAnon ? `Guest #${(user?.uid || '').slice(-4)}` : 'Knight Commander');

  const email = user?.email || googleProvider?.email || null;
  const photoURL = user?.photoURL || googleProvider?.photoURL || null;

  return {
    uid: user.uid,
    isAnonymous: isAnon,
    displayName,
    email,
    photoURL,
  };
}

const listeners = new Set<(profile: UserProfile | null) => void>();

function notifyListeners(profile: UserProfile | null) {
  listeners.forEach((fn) => {
    try {
      fn(profile);
    } catch (e) {
      console.warn('[Knightsweeper] Error in auth listener:', e);
    }
  });
}

/**
 * Subscribes to auth changes using onIdTokenChanged (fires on token updates, sign-ins, and account linking).
 */
export function subscribeToAuth(
  onUserChanged: (profile: UserProfile | null) => void
): () => void {
  listeners.add(onUserChanged);

  if (!isFirebaseConfigured() || !auth) {
    onUserChanged({
      uid: 'local-guest',
      isAnonymous: true,
      displayName: 'Guest Knight',
      email: null,
      photoURL: null,
    });
    return () => {
      listeners.delete(onUserChanged);
    };
  }

  const unsubscribe = onIdTokenChanged(auth, async (user: any) => {
    if (user) {
      const profile = mapFirebaseUser(user);
      notifyListeners(profile);
    } else {
      // Auto-sign in anonymously so user has an identity immediately
      try {
        const cred = await signInAnonymously(auth);
        const profile = mapFirebaseUser(cred.user);
        notifyListeners(profile);
      } catch (err) {
        console.warn('[Knightsweeper] Anonymous sign-in deferred:', err);
        notifyListeners(null);
      }
    }
  });

  return () => {
    listeners.delete(onUserChanged);
    unsubscribe();
  };
}

/**
 * Links an anonymous user to a Google account or signs in with Google.
 * Immediately notifies listeners and returns the updated profile.
 */
export async function signInOrLinkWithGoogle(): Promise<UserProfile | null> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase is not configured yet. Add Firebase keys in .env.local to enable Google sign-in.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const currentUser = auth.currentUser;

  try {
    if (currentUser && currentUser.isAnonymous) {
      // Upgrade anonymous guest to full Google user
      const result = await linkWithPopup(currentUser, provider);
      const profile = mapFirebaseUser(result.user);
      notifyListeners(profile);
      return profile;
    } else {
      // Standard popup sign-in
      const result = await signInWithPopup(auth, provider);
      const profile = mapFirebaseUser(result.user);
      notifyListeners(profile);
      return profile;
    }
  } catch (error: any) {
    // If the Google account already exists on another user, direct sign in to that account
    if (
      error.code === 'auth/credential-already-in-use' ||
      error.code === 'auth/email-already-in-use' ||
      error.code === 'auth/account-exists-with-different-credential'
    ) {
      const result = await signInWithPopup(auth, provider);
      const profile = mapFirebaseUser(result.user);
      notifyListeners(profile);
      return profile;
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
