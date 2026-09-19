import { NextRequest, NextResponse } from 'next/server';
import { formatUtcDateString, getDailyChallenge } from '@/core/daily';
import { verifyGameRun } from '@/core/verifier';
import { getAdminDb, verifyFirebaseIdToken } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date,
      movesHistory,
      timeSeconds,
      idToken,
      displayName,
      photoURL,
    } = body;

    // 1. Basic field presence checks
    if (!date || !movesHistory || !idToken) {
      return NextResponse.json(
        { error: 'Missing required parameters (date, movesHistory, idToken)' },
        { status: 400 }
      );
    }

    // 2. Validate date: must match today's UTC calendar date
    const todayUtc = formatUtcDateString(new Date());
    if (date !== todayUtc) {
      return NextResponse.json(
        { error: `Submissions are only accepted for current UTC daily challenge (${todayUtc})` },
        { status: 400 }
      );
    }

    // 3. Cryptographically verify Firebase Auth ID token
    const verifiedUser = await verifyFirebaseIdToken(idToken);
    if (!verifiedUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    // 4. Pure domain move history replay verification
    const dailyChallenge = getDailyChallenge(date);
    const verification = verifyGameRun(dailyChallenge.seed, movesHistory, 'medium');

    if (!verification.valid) {
      return NextResponse.json(
        {
          error: 'Verification failed: Move sequence is illegitimate or does not capture King',
          details: verification.error,
        },
        { status: 400 }
      );
    }

    // Self-reported time clamped to sensible positive bounds
    const safeTimeSeconds = Math.max(1, Math.min(86400, Math.round(Number(timeSeconds) || 1)));
    const finalMoves = verification.movesCount!;

    // 5. Cloud Firestore persistence (one write-once doc per player per day)
    const adminDb = getAdminDb();
    if (adminDb) {
      const scoreRef = adminDb
        .collection('daily_leaderboards')
        .doc(date)
        .collection('scores')
        .doc(verifiedUser.uid);

      const existingDoc = await scoreRef.get();
      if (existingDoc.exists) {
        // Enforce write-once per player per day
        return NextResponse.json({
          success: true,
          message: 'Daily score was already recorded for today',
          alreadyRecorded: true,
          moves: existingDoc.data()?.moves ?? finalMoves,
        });
      }

      await scoreRef.set({
        uid: verifiedUser.uid,
        displayName: displayName || verifiedUser.displayName || 'Knight Commander',
        photoURL: photoURL || verifiedUser.photoURL || null,
        moves: finalMoves,
        timeSeconds: safeTimeSeconds,
        difficulty: 'medium',
        seed: dailyChallenge.seed,
        submittedAt: FieldValue.serverTimestamp(),
      });
    }


    return NextResponse.json({
      success: true,
      moves: finalMoves,
      timeSeconds: safeTimeSeconds,
      uid: verifiedUser.uid,
    });
  } catch (error: any) {
    console.error('[API /api/daily/submit] Error processing submission:', error);
    return NextResponse.json(
      { error: 'Internal server error processing score submission' },
      { status: 500 }
    );
  }
}
