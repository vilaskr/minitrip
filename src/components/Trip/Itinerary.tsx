import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, limit as firestoreLimit, deleteDoc, doc } from 'firebase/firestore';
import { Calendar, Plus, Clock, MapPin, Trash2, Milestone } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, handleFirestoreError, OperationType, logActivity } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';

export default function Itinerary({ tripId, limit }: { tripId: string, limit?: number }) {
  const [items, setItems] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userName = localStorage.getItem(`trip_user_${tripId}`) || 'SOMEONE';
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    location: '',
    notes: '',
    day: 1
  });

  useEffect(() => {
    let q = query(collection(db, 'trips', tripId, 'itinerary'), orderBy('day', 'asc'), orderBy('time', 'asc'));
    if (limit) q = query(q, firestoreLimit(limit));

    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/itinerary`, auth);
    });

    return unsub;
  }, [tripId, limit]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'trips', tripId, 'itinerary'), {
        ...formData,
        day: parseInt(formData.day.toString()),
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setFormData({ title: '', time: '', location: '', notes: '', day: 1 });
      logActivity(tripId, userName, `added activity: ${formData.title}`);
      toast.success('Activity added!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/itinerary`, auth);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this activity?')) return;
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'itinerary', id));
      toast.success('Activity removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}/itinerary/${id}`, auth);
    }
  };

  // Group by day
  const groupedItems = items.reduce((acc, item) => {
    const day = item.day || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, any[]>);

  const days = Object.keys(groupedItems).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {!limit && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-blue border-4 border-black p-2 shadow-[2px_2px_0_#000]">
                <Milestone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-4xl font-black uppercase tracking-tighter">The Journey</h3>
          </div>
          <Button onClick={() => setShowAddModal(true)} size="sm" variant="green" leftIcon={<Plus className="w-4 h-4" />}>
            Plan Day
          </Button>
        </div>
      )}

      {days.length > 0 ? (
        <div className={cn(
          "space-y-12 relative",
          !limit && "before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-1 before:bg-black/10"
        )}>
          {days.map(day => (
            <div key={day} className="space-y-4 relative">
              {!limit && (
                <div className="sticky top-20 z-10 bg-brand-beige py-2 flex items-center gap-4">
                  <div className="w-10 h-10 bg-black text-white border-4 border-black font-black text-lg flex items-center justify-center relative z-10 shadow-[4px_4px_0_#000]">
                    {day}
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter italic">Day {day}</h4>
                </div>
              )}
              
              <div className={cn("space-y-6", !limit && "pl-12")}>
                {groupedItems[day].map(item => (
                  <Card key={item.id} variant="white" hasShadow className={cn("p-4 group", limit ? "border-l-8 border-l-brand-blue" : "")} isHoverable>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {item.time && (
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-brand-red text-white px-2 py-0.5 border-2 border-black">
                              <Clock className="w-3 h-3" /> {item.time}
                            </div>
                          )}
                          {item.location && (
                             <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-brand-blue text-white px-2 py-0.5 border-2 border-black">
                              <MapPin className="w-3 h-3" /> {item.location}
                            </div>
                          )}
                          {limit && (
                             <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 border-2 border-black">
                              DAY {day}
                            </div>
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className={cn("font-black uppercase tracking-tighter leading-tight group-hover:text-brand-red transition-colors min-w-0 break-words", limit ? "text-xl" : "text-2xl")}>
                            {item.title}
                          </h5>
                          {!limit && (
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="text-black/10 hover:text-brand-red transition-colors p-1 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {item.notes && <p className="text-[10px] font-bold uppercase opacity-60 mt-2 leading-tight border-l-4 border-black/10 pl-3 italic">{item.notes}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No plan yet"
          description="The road is calling. Start adding destinations & activities to build your timeline."
          actionLabel="Plan First Activity"
          onAction={() => setShowAddModal(true)}
        />
      )}

      {/* Add Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Plan Activity"
      >
        <form onSubmit={handleAddItem} className="space-y-6">
            <Input
              label="Activity Name"
              placeholder="E.g. Sunrise Trek"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Day"
                type="number"
                min="1"
                value={formData.day}
                onChange={e => setFormData({...formData, day: parseInt(e.target.value) || 1})}
                required
              />
              <Input
                label="Time (Optional)"
                type="time"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
              />
            </div>

            <Input
              label="Location"
              placeholder="Where is it?"
              icon={<MapPin className="w-4 h-4" />}
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value.toUpperCase()})}
            />

            <Input
              label="Notes"
              placeholder="Quick reminders..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value.toUpperCase()})}
            />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                Add it
              </Button>
            </div>
        </form>
      </Modal>
    </div>
  );
}

