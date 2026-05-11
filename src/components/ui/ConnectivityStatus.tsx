import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(showStatus || !isOnline) && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          className={cn(
            "fixed bottom-24 md:bottom-8 left-1/2 z-[100] px-6 py-3 border-4 border-black font-black uppercase text-xs flex items-center gap-3 shadow-[8px_8px_0_#000] transition-colors",
            isOnline ? "bg-brand-green text-black" : "bg-brand-red text-white"
          )}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Back Online & Synced</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 animate-pulse" />
              <span>Offline Mode Active</span>
            </>
          )}
          <div className="w-2 h-2 rounded-full bg-white animate-ping ml-2" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
