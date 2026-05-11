import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { StickyNote, Save, Zap } from 'lucide-react';
import debounce from 'lodash/debounce';
import { handleFirestoreError, OperationType, logActivity } from '../../lib/utils';
import { Card } from '../ui/Card';

export default function Notes({ tripId }: { tripId: string }) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const userName = localStorage.getItem(`trip_user_${tripId}`) || 'SOMEONE';

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'trips', tripId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNotes(data.notes || '');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}`, auth);
    });

    return () => unsub();
  }, [tripId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (value: string) => {
      setIsSaving(true);
      try {
        await updateDoc(doc(db, 'trips', tripId), {
          notes: value
        });
        logActivity(tripId, userName, 'updated shared notes');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `trips/${tripId}`, auth);
      } finally {
        setTimeout(() => setIsSaving(false), 1000);
      }
    }, 1000),
    [tripId]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.toUpperCase();
    setNotes(value);
    debouncedSave(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-4xl font-black uppercase tracking-tighter">Brain Dump</h3>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase px-4 py-2 bg-black text-white border-2 border-black shadow-[4px_4px_0_#ccc]">
           {isSaving ? <Zap className="w-3 h-3 animate-pulse text-brand-yellow" /> : <Save className="w-3 h-3" />}
           {isSaving ? 'Syncing...' : 'Synced'}
        </div>
      </div>

      <Card hasShadow className="p-0 border-4 border-black bg-white overflow-hidden">
        <div className="p-4 border-b-4 border-black bg-brand-blue flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs">
           <StickyNote className="w-4 h-4" /> Collaborative Scratchpad
        </div>
        <textarea
          className="w-full h-[60vh] p-8 bg-transparent text-2xl font-black uppercase tracking-tight focus:outline-none resize-none leading-tight placeholder:text-black/5"
          placeholder="Jot down ideas, locations, or reminders for the crew..."
          value={notes}
          onChange={handleChange}
        />
      </Card>
      
      <div className="flex items-center justify-center gap-4">
          <div className="h-1 flex-1 bg-black/5" />
          <p className="font-black text-black/30 text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
            Autosave enabled
          </p>
          <div className="h-1 flex-1 bg-black/5" />
      </div>
    </div>
  );
}

