import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ListTodo, Plus, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, handleFirestoreError, OperationType, logActivity } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';

export default function Checklist({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const userName = localStorage.getItem(`trip_user_${tripId}`) || 'SOMEONE';

  useEffect(() => {
    const q = query(collection(db, 'trips', tripId, 'checklist'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/checklist`, auth);
    });
    return unsub;
  }, [tripId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'trips', tripId, 'checklist'), {
        task: newItem.toUpperCase(),
        completed: false,
        createdAt: serverTimestamp()
      });
      logActivity(tripId, userName, `added checklist item: ${newItem.toUpperCase()}`);
      setNewItem('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/checklist`, auth);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleComplete = async (itemId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'trips', tripId, 'checklist', itemId), {
        completed: !currentStatus
      });
      if (!currentStatus) {
        logActivity(tripId, userName, 'completed a checklist item');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `trips/${tripId}/checklist/${itemId}`, auth);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'checklist', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}/checklist/${itemId}`, auth);
    }
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Packing & Tasks</h3>
          <div className="w-full h-10 bg-white border-4 border-black shadow-[4px_4px_0_#000] overflow-hidden flex relative">
             <motion.div 
               className="h-full bg-brand-green border-r-4 border-black" 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               transition={{ type: 'spring', stiffness: 100 }}
             />
             <span className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-widest text-black mix-blend-difference invert">
               {completedCount}/{items.length} COMPLETED
             </span>
          </div>
        </div>
        
        <form onSubmit={handleAdd} className="flex gap-4 w-full md:w-auto">
          <Input
            placeholder="E.G. PACK SUNSCREEN"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            className="md:w-64"
          />
          <Button type="submit" size="icon" variant="yellow" isLoading={isAdding}>
            <Plus className="w-6 h-6" />
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {items.map(item => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={item.id}
            >
              <Card 
                className={cn(
                  "p-5 flex items-center justify-between group h-full",
                  item.completed ? "bg-brand-green/20" : "bg-white"
                )}
                isHoverable={!item.completed}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => toggleComplete(item.id, item.completed)}
                    className={cn(
                        "w-10 h-10 border-4 border-black flex items-center justify-center transition-all bg-white shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                        item.completed && "bg-brand-green shadow-none translate-x-[2px] translate-y-[2px]"
                    )}
                  >
                    {item.completed && <Check className="w-6 h-6 stroke-[4px]" />}
                  </button>
                  <span className={cn(
                    "font-black text-xl uppercase tracking-tighter transition-all",
                    item.completed && "line-through opacity-40 italic"
                  )}>
                    {item.task}
                  </span>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-black/20 hover:text-brand-red transition-all"
                >
                  <Trash2 className="w-5 h-5 font-black" />
                </button>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={ListTodo}
              title="List is empty"
              description="Add items to make sure nothing gets left behind. Preparation is key!"
              actionLabel="Add Item"
              onAction={() => document.querySelector('input')?.focus()}
            />
          </div>
        )}
      </div>
    </div>
  );
}

