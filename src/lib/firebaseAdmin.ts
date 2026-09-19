/**
 * Server-Side Firebase Admin & Token Verification Module
 * Safely initializes Firebase Admin SDK on Vercel or local Node.js environments.
 */

import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

let isInitialized = false;

function initAdmin(): App | null {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  // 1. Full JSON Service Account string in env
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      isInitialized = true;
      return initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } catch (e) {
      console.warn('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
    }
  }

  // 2. Separate Client Email & Private Key in env
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    try {
      isInitialized = true;
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } catch (e) {
      console.warn('[FirebaseAdmin] Failed to initialize with separate credentials:', e);
    }
  }

  // 3. Project ID only (e.g., standard GCP environment)
  if (projectId) {
    try {
      isInitialized = true;
      return initializeApp({
        projectId,
      });
    } catch (e) {
      console.warn('[FirebaseAdmin] Default initialization warning:', e);
    }
  }

  return null;
}

export function getAdminAuth(): Auth | null {
  const app = initAdmin();
  return app ? getAuth(app) : null;
}

export function getAdminDb(): Firestore | null {
  const app = initAdmin();
  return app ? getFirestore(app) : null;
}

export interface VerifiedUser {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string | null;
}

/**
 * Verifies a Firebase Auth ID Token on the server.
 * Uses Firebase Admin SDK if service credentials are present,
 * or verifies cryptographically via Google Identity Toolkit REST API.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedUser | null> {
  if (!idToken || typeof idToken !== 'string') {
    return null;
  }

  // Attempt verification with Admin SDK
  try {
    const adminAuth = getAdminAuth();
    if (adminAuth && isInitialized) {
      const decoded = await adminAuth.verifyIdToken(idToken);
      return {
        uid: decoded.uid,
        displayName: decoded.name || 'Knight Commander',
        photoURL: decoded.picture || null,
        email: decoded.email || null,
      };
    }
  } catch (adminError) {
    console.warn('[FirebaseAdmin] verifyIdToken failed, trying identitytoolkit fallback:', adminError);
  }

  // Fallback: Verify directly with Google Identity Toolkit REST API
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const user = data?.users?.[0];
    if (!user || !user.localId) {
      return null;
    }

    return {
      uid: user.localId,
      displayName: user.displayName || 'Knight Commander',
      photoURL: user.photoUrl || null,
      email: user.email || null,
    };
  } catch (fetchError) {
    console.warn('[FirebaseAdmin] Identity Toolkit verification error:', fetchError);
    return null;
  }
}
