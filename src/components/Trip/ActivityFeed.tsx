import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Zap, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

export default function ActivityFeed({ tripId }: { tripId: string }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'trips', tripId, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [tripId]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-black/5 border-4 border-black" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="w-6 h-6 text-brand-yellow" />
        <h3 className="text-4xl font-black uppercase tracking-tighter">Live Status</h3>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={activity.id}
            >
              <Card 
                className="p-3 flex items-start gap-4 border-2 border-black bg-white hover:bg-zinc-50 transition-colors shadow-[2px_2px_0_#000]"
              >
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center border-2 border-black shrink-0 relative">
                  <User className="w-4 h-4" />
                  {index === 0 && (
                      <div className="absolute -top-2 -right-2 w-3 h-3 bg-brand-yellow border-2 border-black rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[11px] uppercase tracking-tight leading-tight">
                    <span className="text-brand-red">{activity.memberName}</span> {activity.action}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] font-bold uppercase opacity-40 mt-1">
                    <Clock className="w-2.5 h-2.5" />
                    {activity.timestamp ? formatDistanceToNow(activity.timestamp.toDate()) + ' ago' : 'JUST NOW'}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {activities.length === 0 && (
          <EmptyState
            icon={Zap}
            title="NO RECENT ACTIVITY"
            description="START PLANNING TO SEE LIVE UPDATES HERE."
          />
        )}
      </div>
    </div>
  );
}
