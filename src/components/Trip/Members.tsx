import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Crown, Trash2, Plus, Users } from 'lucide-react';
import { handleFirestoreError, OperationType, getAvatarColor, logActivity } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export default function Members({ tripId }: { tripId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);

  const localUser = localStorage.getItem(`trip_user_${tripId}`);

  useEffect(() => {
    const q = query(collection(db, 'trips', tripId, 'members'), orderBy('joinedAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/members`, auth);
    });
    return unsub;
  }, [tripId]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setIsAdding(true);

    const nameUpper = newMemberName.trim().toUpperCase();
    const userId = Math.random().toString(36).substring(7);
    const color = getAvatarColor(nameUpper);

    try {
      // Check if member already exists
      if (members.some(m => m.name === nameUpper)) {
        toast.error('NAME ALREADY TAKEN ON THIS TRIP!');
        setIsAdding(false);
        return;
      }

      await addDoc(collection(db, 'trips', tripId, 'members'), {
        userId,
        name: nameUpper,
        color,
        joinedAt: serverTimestamp()
      });
      await logActivity(tripId, nameUpper, 'JOINED THE CREW (MANUALLY ADDED)');
      setNewMemberName('');
      toast.success(`${nameUpper} ADDED TO THE CREW!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/members`, auth);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (member: any) => {
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'members', member.id));
      await logActivity(tripId, member.name, 'LEFT THE CREW (REMOVED)');
      toast.success(`${member.name} REMOVED FROM THE CREW`);

      if (localUser === member.name) {
        localStorage.removeItem(`trip_user_${tripId}`);
        localStorage.removeItem(`trip_userId_${tripId}`);
        toast.success("YOU LEFT THE TRIP. RELOADING...");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/members/${member.id}`, auth);
    }
  };

  return (
    <div className="border-4 border-black p-6 bg-brand-green shadow-[6px_6px_0_#000] space-y-6">
      <div className="flex items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-widest text-black flex items-center gap-2">
            <Users className="w-4 h-4" /> The Crew
          </h3>
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-black text-white px-2.5 py-1 font-black text-xs border-2 border-black hover:bg-brand-red transition-all cursor-pointer shadow-[2px_2px_0_#999]"
          >
            MANAGE
          </button>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {members.map((member, i) => (
          <div 
            key={member.id}
            title={member.name}
            className="w-12 h-12 border-4 border-black flex items-center justify-center font-black text-xl shadow-[4px_4px_0_#000] relative group bg-white transition-transform hover:-translate-y-1 cursor-pointer"
            style={{ color: member.color }}
            onClick={() => setIsOpen(true)}
          >
            {member.name.charAt(0).toUpperCase()}
            {i === 0 && (
                <div className="absolute -top-3 -right-3 rotate-12 z-10 bg-brand-yellow border-2 border-black p-1 shadow-[2px_2px_0_#000]">
                    <Crown className="w-4 h-4 text-black fill-white stroke-[3px]" />
                </div>
            )}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border-2 border-black font-black uppercase">
                {member.name} {localUser === member.name ? '(YOU)' : ''}
            </div>
          </div>
        ))}

        <button 
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 border-4 border-black border-dashed flex items-center justify-center font-black text-2xl shadow-[4px_4px_0_#000] relative bg-white transition-all hover:bg-brand-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:scale-95"
          title="Add Crew Member"
        >
          +
        </button>
      </div>

      <p className="text-[10px] font-black uppercase leading-tight italic opacity-60">
        {members.length === 1 ? "Invite friends to start splitting costs!" : "Live updates enabled for all crew members."}
      </p>

      {/* Manage Crew Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setConfirmingRemoveId(null);
        }}
        title="MANAGE CREW"
      >
        <div className="space-y-8">
          {/* Add Member Form */}
          <form onSubmit={handleCreateMember} className="space-y-4 bg-brand-beige border-4 border-black p-4 shadow-[4px_4px_0_#000]">
            <h4 className="font-black text-sm uppercase tracking-tight text-black">
              ADD NEW EXPLORER
            </h4>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="NAME (E.G. ALICE)"
                  required
                  maxLength={15}
                  className="p-3 text-lg font-black border-4"
                />
              </div>
              <Button type="submit" variant="yellow" isLoading={isAdding} className="h-14 font-black text-lg border-4 flex items-center gap-2">
                <Plus className="w-5 h-5 shrink-0" strokeWidth={3} /> ADD
              </Button>
            </div>
          </form>

          {/* Current Crew Members List */}
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-tight text-black">
              CURRENT CREW ({members.length})
            </h4>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {members.map((member, i) => {
                const isSelf = localUser === member.name;
                const isCrown = i === 0;
                return (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-3 border-4 border-black bg-white shadow-[4px_4px_0_#000]"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-base shadow-[2px_2px_0_#000] relative shrink-0"
                        style={{ color: member.color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                        {isCrown && (
                          <div className="absolute -top-2 -right-2 rotate-12 bg-brand-yellow border-2 border-black p-0.5">
                            <Crown className="w-3 h-3 text-black fill-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase tracking-tighter flex items-center gap-2">
                          {member.name}
                          {isSelf && (
                            <span className="inline-block bg-brand-yellow text-black border border-black text-[8px] px-1 font-black leading-none uppercase">
                              YOU
                            </span>
                          )}
                        </span>
                        <span className="text-[9px] font-black uppercase opacity-40">
                          {isCrown ? 'Owner / Lead Planner' : 'Explorer'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {confirmingRemoveId === member.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="bg-brand-red text-white border-2 border-black px-2.5 py-1.5 font-black text-xs hover:bg-red-700 transition-all uppercase leading-none shadow-[2px_2px_0_#000]"
                          >
                            YES, DEPART
                          </button>
                          <button
                            onClick={() => setConfirmingRemoveId(null)}
                            className="bg-zinc-200 text-black border-2 border-black px-2.5 py-1.5 font-black text-xs hover:bg-zinc-300 transition-all uppercase leading-none shadow-[2px_2px_0_#000]"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingRemoveId(member.id)}
                          className="bg-brand-beige text-brand-red border-2 border-black p-2 font-black text-xs hover:bg-brand-red hover:text-white transition-all uppercase leading-none shadow-[2px_2px_0_#000]"
                          title="Remove Traveler"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {members.length === 0 && (
                <p className="text-center py-6 text-xs font-black uppercase opacity-40 italic border-4 border-dashed border-black bg-zinc-50">
                  NO ADVENTURERS JOINED YET
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}


