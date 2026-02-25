'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showConnected, setShowConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowConnected(true);
      setTimeout(() => setShowConnected(false), 3000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-1.5 text-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-4">
        <WifiOff className="w-4 h-4" />
        <span className="font-medium">Connection lost  requests may be delayed. Reconnecting...</span>
      </div>
    );
  }

  if (showConnected) {
    return (
      <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-1.5 text-sm flex items-center justify-center gap-2 animate-in fade-in duration-300">
        <CheckCircle2 className="w-4 h-4" />
        <span className="font-medium">Connected</span>
      </div>
    );
  }

  return null;
}