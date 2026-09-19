'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('knightsweeper-theme') as Theme | null;
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setTheme(stored);
        applyTheme(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', t);
    }
  };

  const changeTheme = useCallback((nextTheme: Theme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    try {
      localStorage.setItem('knightsweeper-theme', nextTheme);
    } catch {
      // ignore
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      applyTheme(next);
      try {
        localStorage.setItem('knightsweeper-theme', next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return {
    theme,
    changeTheme,
    cycleTheme,
  };
}
