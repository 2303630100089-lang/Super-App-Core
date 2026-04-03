'use client';

import { useOffline } from '@/hooks/useOffline';
import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export default function OfflineBanner() {
  const isOffline = useOffline();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show banner with a slight delay so it doesn't flash on first load
  useEffect(() => {
    if (isOffline) {
      setDismissed(false);
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOffline]);

  if (!visible || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-20 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-amber-500/30 bg-slate-900/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl md:bottom-6 animate-slide-up"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
          <WifiOff size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white">You're offline</p>
          <p className="text-[11px] text-slate-400 leading-tight">Showing cached data — some features may be limited.</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
