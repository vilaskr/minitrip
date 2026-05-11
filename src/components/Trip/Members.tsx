import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Crown } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/utils';
import { cn } from '../../lib/utils';

export default function Members({ tripId }: { tripId: string }) {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'trips', tripId, 'members'), orderBy('joinedAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/members`, auth);
    });
    return unsub;
  }, [tripId]);

  return (
    <div className="border-4 border-black p-6 bg-brand-green shadow-[6px_6px_0_#000] space-y-6">
      <div className="flex items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-widest text-black">
            The Crew
          </h3>
          <span className="bg-black text-white px-3 py-1 font-black text-xs border-2 border-black">
            {members.length} SYNCED
          </span>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {members.map((member, i) => (
          <div 
            key={member.id}
            title={member.name}
            className="w-12 h-12 border-4 border-black flex items-center justify-center font-black text-xl shadow-[4px_4px_0_#000] relative group bg-white transition-transform hover:-translate-y-1"
            style={{ color: member.color }}
          >
            {member.name.charAt(0).toUpperCase()}
            {i === 0 && (
                <div className="absolute -top-3 -right-3 rotate-12 z-10 bg-brand-yellow border-2 border-black p-1 shadow-[2px_2px_0_#000]">
                    <Crown className="w-4 h-4 text-black fill-white stroke-[3px]" />
                </div>
            )}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border-2 border-black font-black uppercase">
                {member.name}
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="h-12 w-12 border-4 border-black border-dashed opacity-20 flex items-center justify-center font-black animate-pulse">
            ?
          </div>
        )}
      </div>
      <p className="text-[10px] font-black uppercase leading-tight italic opacity-60">
        {members.length === 1 ? "Invite friends to start splitting costs!" : "Live updates enabled for all crew members."}
      </p>
    </div>
  );
}

