'use client';

import { RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // If a worker is already waiting to activate
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdate(true);
          }

          // Listen for new worker installs
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setShowUpdate(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[PWA] SW registration failed:', error);
        });

      // Reload once the new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    };

    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        borderRadius: '12px',
        backgroundColor: '#1e2c38',
        border: '1px solid #476274',
        boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 16px rgba(212, 154, 24, 0.25)',
        color: '#f8fafc',
        fontSize: '0.875rem',
        maxWidth: 'calc(100vw - 48px)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
        <span>⚔️</span>
        <span>New battlefield update available!</span>
      </span>
      <button
        onClick={handleUpdate}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: '#d49a18',
          color: '#121d28',
          border: 'none',
          fontWeight: 700,
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <RefreshCw size={13} />
        <span>Refresh Now</span>
      </button>
      <button
        onClick={() => setShowUpdate(false)}
        aria-label="Dismiss update notification"
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
