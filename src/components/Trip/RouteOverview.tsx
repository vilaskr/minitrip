import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { MapPin, Map as MapIcon, Navigation, Grab } from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { Card } from '../ui/Card';
import { handleFirestoreError, OperationType } from '../../lib/utils';

export default function RouteOverview({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'trips', tripId, 'places'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      // If no order, assign one based on creation
      if (data.length > 0 && (data[0] as any).order === undefined) {
         data.forEach((item, i) => {
             updateDoc(doc(db, 'trips', tripId, 'places', item.id), { order: i });
         });
      }
      setItems(data);
    });
    return () => unsub();
  }, [tripId]);

  const handleReorder = async (newOrder: any[]) => {
    setItems(newOrder); // Optimistic update
    try {
        for (let i = 0; i < newOrder.length; i++) {
            const item = newOrder[i];
            await updateDoc(doc(db, 'trips', tripId, 'places', item.id), { order: i });
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `trips/${tripId}/places`, auth);
    }
  };

  // Mock distance calculation (50-80km between stops)
  const totalDistance = items.length > 1 ? (items.length - 1) * 65 : 0;
  const totalTime = items.length > 1 ? (items.length - 1) * 1.5 : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-brand-blue border-4 border-black p-2 shadow-[2px_2px_0_#000]">
                <MapIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-4xl font-black uppercase tracking-tighter">Route Hub</h3>
        </div>
        
        <div className="flex gap-4">
            <div className="bg-white border-4 border-black px-4 py-2 shadow-[4px_4px_0_#000] text-center">
                <p className="text-[10px] font-black uppercase opacity-40">Est. Distance</p>
                <p className="font-black text-xl">~{totalDistance} KM</p>
            </div>
            <div className="bg-white border-4 border-black px-4 py-2 shadow-[4px_4px_0_#000] text-center">
                <p className="text-[10px] font-black uppercase opacity-40">Drive Time</p>
                <p className="font-black text-xl">~{totalTime.toFixed(1)} HRS</p>
            </div>
        </div>
      </div>

      <div className="relative">
        {/* Visual Line */}
        <div className="absolute left-10 top-0 bottom-0 w-1 bg-black/10 md:hidden" />
        
        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-4">
          {items.map((item, index) => (
            <Reorder.Item 
              key={item.id} 
              value={item}
              className="relative cursor-grab active:cursor-grabbing group"
            >
              <div className="flex items-center gap-6">
                 <div className="hidden md:flex flex-col items-center">
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black border-4 border-black shadow-[4px_4px_0_#ccc] z-10">
                        {index + 1}
                    </div>
                    {index < items.length - 1 && <div className="w-1 h-12 bg-black mt-2" />}
                 </div>
                 
                 <Card variant={index === 0 ? "yellow" : "white"} hasShadow className="flex-1 flex items-center justify-between p-4 md:p-6 group-hover:border-brand-red transition-all">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden w-8 h-8 bg-black text-white flex items-center justify-center font-black border-2 border-black">
                             {index + 1}
                        </div>
                        <div>
                            <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight">{item.name}</h4>
                            <p className="text-[10px] font-bold uppercase opacity-40">{item.description || 'NO DESCRIPTION'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <Grab className="w-6 h-6 opacity-20 group-hover:opacity-100 transition-opacity" />
                       <Navigation className="w-6 h-6 text-brand-blue cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                 </Card>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {items.length === 0 && (
            <div className="p-12 text-center border-4 border-black border-dashed bg-white">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-black uppercase opacity-40">Log some spots to see your route sequence</p>
            </div>
        )}
      </div>
    </div>
  );
}
