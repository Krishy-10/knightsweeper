'use client';

import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { SoundEvent } from '../core/types';

export function useSound() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(soundEngine.isEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    const next = soundEngine.toggle();
    setEnabled(next);
  }, []);

  const playSound = useCallback((event: SoundEvent) => {
    soundEngine.play(event);
  }, []);

  const playSounds = useCallback((events: SoundEvent[]) => {
    events.forEach((ev) => soundEngine.play(ev));
  }, []);

  return {
    soundEnabled: enabled,
    toggleSound,
    playSound,
    playSounds,
  };
}
