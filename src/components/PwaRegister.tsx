'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Knightsweeper PWA SW registered:', registration.scope);
          })
          .catch((error) => {
            console.warn('Knightsweeper PWA SW registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
