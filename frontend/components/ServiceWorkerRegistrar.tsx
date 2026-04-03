'use client';

import { useEffect } from 'react';

/**
 * Silently registers the service worker for PWA / offline support.
 * Renders nothing — pure side-effect component placed in the root layout.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Check for updates on every page load
        registration.update().catch(() => null);
      })
      .catch((err) => {
        // Non-critical — app still works without SW
        console.warn('[SW] Registration failed:', err);
      });
  }, []);

  return null;
}
