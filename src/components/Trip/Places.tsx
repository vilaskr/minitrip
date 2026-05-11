import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, limit as firestoreLimit, deleteDoc, doc } from 'firebase/firestore';
import { MapIcon, Plus, ExternalLink, MapPin, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, handleFirestoreError, OperationType, logActivity } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';

export default function Places({ tripId, limit }: { tripId: string, limit?: number }) {
  const [places, setPlaces] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userName = localStorage.getItem(`trip_user_${tripId}`) || 'SOMEONE';
  const [formData, setFormData] = useState({ name: '', description: '', mapUrl: '' });

  useEffect(() => {
    let q = query(collection(db, 'trips', tripId, 'places'), orderBy('createdAt', 'desc'));
    if (limit) q = query(q, firestoreLimit(limit));

    const unsub = onSnapshot(q, (snapshot) => {
      setPlaces(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/places`, auth);
    });
    return unsub;
  }, [tripId, limit]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'trips', tripId, 'places'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setFormData({ name: '', description: '', mapUrl: '' });
      logActivity(tripId, userName, `pinned a spot: ${formData.name}`);
      toast.success('Place added!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/places`, auth);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Unpin this spot?')) return;
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'places', id));
      toast.success('Spot unpinned');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}/places/${id}`, auth);
    }
  };

  return (
    <div className="space-y-8">
      {!limit && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-red border-4 border-black p-2 shadow-[2px_2px_0_#000]">
                <MapPin className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-4xl font-black uppercase tracking-tighter">Bookmarks & Pins</h3>
          </div>
          <Button onClick={() => setShowAddModal(true)} size="sm" variant="yellow" leftIcon={<Plus className="w-4 h-4" />}>
            Pin Spot
          </Button>
        </div>
      )}

      {places.length > 0 ? (
        <div className={cn(
          "grid gap-6",
          limit ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {places.map(place => (
            <Card key={place.id} variant="white" hasShadow className={cn("p-0 overflow-hidden group", limit ? "flex" : "block")} isHoverable>
              <div className={cn(
                "bg-zinc-100 flex items-center justify-center border-black relative overflow-hidden shrink-0",
                limit ? "w-24 border-r-4 h-auto" : "h-40 border-b-4 w-full"
              )}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 0)', backgroundSize: '12px 12px' }}></div>
                <MapPin className={cn("text-black group-hover:scale-110 transition-transform relative z-10", limit ? "w-8 h-8" : "w-16 h-16")} />
                {!limit && (
                   <button 
                    onClick={() => handleDelete(place.id)}
                    className="absolute top-4 right-4 bg-white border-2 border-black p-1.5 opacity-0 group-hover:opacity-100 hover:bg-brand-red hover:text-white transition-all z-20"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                )}
              </div>
              <div className={cn("p-6 flex-1 flex flex-col justify-between", limit ? "py-4" : "p-6")}>
                <div>
                  <h4 className={cn("font-black uppercase tracking-tighter truncate mb-1", limit ? "text-xl" : "text-2xl")}>{place.name}</h4>
                  <p className={cn("font-bold uppercase opacity-60 line-clamp-2 leading-snug", limit ? "text-[10px]" : "text-xs mb-4 min-h-[48px]")}>
                    {place.description || "NO DESCRIPTION PROVIDED."}
                  </p>
                </div>
                {place.mapUrl && (
                  <Button 
                    variant="blue" 
                    size="xs" 
                    className={cn("mt-4", limit ? "w-fit" : "w-full")}
                    onClick={() => window.open(place.mapUrl, '_blank')}
                    rightIcon={<ExternalLink className="w-3 h-3" />}
                  >
                    NAVIGATE
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
            icon={MapPin}
            title="No spots pinned"
            description="Keep track of lakes, viewpoints, and cafes you don't want to miss on this adventure."
            actionLabel="Pin First Spot"
            onAction={() => setShowAddModal(true)}
        />
      )}

      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Pin a Spot"
      >
        <form onSubmit={handleAdd} className="space-y-6">
            <Input
              label="Place Name"
              placeholder="E.g. HIREKOLALE LAKE"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
              required
            />
            <Input
              label="Short Description"
              placeholder="Why go here?"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})}
            />
            <Input
              label="Google Maps URL"
              type="url"
              placeholder="HTTPS://GOO.GL/MAPS/..."
              icon={<MapIcon className="w-4 h-4" />}
              value={formData.mapUrl}
              onChange={e => setFormData({...formData, mapUrl: e.target.value})}
            />
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                Pin It
              </Button>
            </div>
        </form>
      </Modal>
    </div>
  );
}

