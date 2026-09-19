'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameState, KingCaptureStage } from '../core/types';

export type AmbienceGlowState = 'idle' | 'one-knight' | 'mine-hit' | 'victory' | 'defeat';

interface UseAmbienceParams {
  gameState: GameState | null;
  isShaking: boolean;
  kingCaptureStage: KingCaptureStage;
}

const STORAGE_KEY = 'knightsweeper-ambience';

export function useAmbience({ gameState, isShaking, kingCaptureStage }: UseAmbienceParams) {
  // Default to true on desktop, but safely check localStorage & screen width post-mount
  const [ambienceEnabled, setAmbienceEnabled] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setAmbienceEnabled(stored === 'true');
      } else {
        // Default to false on small mobile screens (< 640px), true on desktop/laptop
        const isMobile = window.innerWidth < 640;
        setAmbienceEnabled(!isMobile);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleAmbience = useCallback(() => {
    setAmbienceEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Drive board glow and spotlight tint from ONE single derived state
  const glowState: AmbienceGlowState = useMemo(() => {
    if (!gameState) return 'idle';

    // 1. Mine detonation pulse (matches board shake duration)
    if (isShaking) return 'mine-hit';

    // 2. Victory state (enemy King captured or actively toppling)
    if (gameState.status === 'won' || kingCaptureStage !== 'idle') {
      return 'victory';
    }

    // 3. Defeat state (both knights fallen)
    if (gameState.status === 'lost') {
      return 'defeat';
    }

    // 4. One knight remaining
    if (gameState.knights === 1) {
      return 'one-knight';
    }

    // 5. Default idle state (2 knights, advancing)
    return 'idle';
  }, [gameState, isShaking, kingCaptureStage]);

  return {
    ambienceEnabled,
    toggleAmbience,
    glowState,
  };
}
