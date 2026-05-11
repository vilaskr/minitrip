import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer } from 'lucide-react';

export default function TripCountdown({ startDate }: { startDate: any }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, mins: number, secs: number } | null>(null);

  useEffect(() => {
    if (!startDate) return;

    const targetDate = startDate.toDate ? startDate.toDate() : new Date(startDate);
    
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        mins: Math.floor((difference / 1000 / 60) % 60),
        secs: Math.floor((difference / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  if (!timeLeft) {
    if (startDate && new Date(startDate.toDate ? startDate.toDate() : startDate) < new Date()) {
        return (
            <div className="bg-brand-red border-4 border-black p-4 flex items-center justify-center gap-4 text-white shadow-[4px_4px_0_#000]">
                <Timer className="w-6 h-6 animate-pulse" />
                <h4 className="text-2xl font-black uppercase tracking-tighter">THE ADVENTURE HAS BEGUN!</h4>
            </div>
        );
    }
    return null;
  }

  return (
    <div className="bg-brand-yellow border-4 border-black p-6 flex flex-col items-center gap-4 shadow-[6px_6px_0_#000] relative overflow-hidden group">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 -mb-2">Roadtrip Starts In</p>
      
      <div className="flex items-center gap-6 relative z-10">
        <TimeUnit value={timeLeft.days} label="Days" />
        <span className="text-4xl font-black">:</span>
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <span className="text-4xl font-black md:inline hidden">:</span>
        <div className="md:flex hidden items-center gap-6">
            <TimeUnit value={timeLeft.mins} label="Mins" />
            <span className="text-4xl font-black">:</span>
            <TimeUnit value={timeLeft.secs} label="Secs" />
        </div>
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="text-4xl md:text-5xl font-black tracking-tighter"
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
      <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{label}</span>
    </div>
  );
}
