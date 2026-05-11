import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, limit as firestoreLimit, deleteDoc, doc } from 'firebase/firestore';
import { DollarSign, Plus, Info, Trash2, ReceiptText } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, handleFirestoreError, OperationType, logActivity } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import Settlements from './Settlements';
import FuelCalculator from './FuelCalculator';

const CATEGORIES = [
  { id: 'Fuel', color: 'bg-brand-orange' },
  { id: 'Food', color: 'bg-brand-red text-white' },
  { id: 'Stay', color: 'bg-brand-blue text-white' },
  { id: 'Tickets', color: 'bg-brand-yellow' },
  { id: 'Shopping', color: 'bg-emerald-400' },
  { id: 'Misc', color: 'bg-zinc-400' }
];

export default function Expenses({ tripId, limit, compact = false }: { tripId: string, limit?: number, compact?: boolean }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    paidBy: '',
    notes: ''
  });

  useEffect(() => {
    let q = query(collection(db, 'trips', tripId, 'expenses'), orderBy('createdAt', 'desc'));
    if (limit) q = query(q, firestoreLimit(limit));

    const unsubExpenses = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/expenses`, auth);
    });

    const unsubMembers = onSnapshot(collection(db, 'trips', tripId, 'members'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setMembers(data);
      if (data.length > 0 && !formData.paidBy) {
        setFormData(prev => ({ ...prev, paidBy: data[0].name }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/members`, auth);
    });

    return () => {
      unsubExpenses();
      unsubMembers();
    };
  }, [tripId, limit]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter valid details');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'trips', tripId, 'expenses'), {
        ...formData,
        amount: parseFloat(formData.amount),
        createdAt: serverTimestamp()
      });
      logActivity(tripId, formData.paidBy, `added expense: ₹${formData.amount} for ${formData.title}`);
      setShowAddModal(false);
      setFormData({ title: '', amount: '', category: 'Food', paidBy: members[0]?.name || '', notes: '' });
      toast.success('Expense added!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/expenses`, auth);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Discard this spend?')) return;
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'expenses', id));
      toast.success('Expense removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}/expenses/${id}`, auth);
    }
  };

  const total = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const perPerson = members.length > 0 ? total / members.length : 0;

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-black/5 border-4 border-black" />)}
    </div>
  );

  if (compact) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-1 gap-6">
        {expenses.map(expense => (
          <div key={expense.id} className="flex items-center justify-between p-5 bg-white border-4 border-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
             <div className="flex items-center gap-4">
               <div className={cn("w-12 h-12 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]", CATEGORIES.find(c => c.id === expense.category)?.color)}>
                 <ReceiptText className="w-6 h-6" />
               </div>
               <div>
                  <p className="font-black text-base uppercase leading-tight tracking-tighter">{expense.title}</p>
                  <p className="text-[10px] font-black uppercase opacity-60">By {expense.paidBy}</p>
               </div>
             </div>
             <p className="font-black text-2xl tracking-tighter">₹{expense.amount.toLocaleString()}</p>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="text-center py-8 bg-zinc-50 border-4 border-black border-dashed">
            <p className="text-xs font-black uppercase opacity-40 italic">Nothing logged yet</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Settlements Section */}
      <Settlements members={members} expenses={expenses} />

      {/* Fuel Section */}
      <FuelCalculator membersCount={members.length} />

      <div className="space-y-8">
        {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="red" hasShadow>
          <ReceiptText className="w-8 h-8 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Trip Expense</p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter">₹{total.toLocaleString()}</h2>
        </Card>
        <Card variant="orange" hasShadow>
          <DollarSign className="w-8 h-8 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Split Per Head</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">₹{perPerson.toFixed(0).toLocaleString()}</h2>
          <p className="text-[10px] font-bold mt-2 uppercase opacity-80 italic">Between {members.length} members</p>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <h3 className="text-4xl font-black uppercase tracking-tighter">expense Logs</h3>
        <Button onClick={() => setShowAddModal(true)} size="sm" variant="blue" leftIcon={<Plus className="w-4 h-4" />}>
          Add Spend
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expenses.map(expense => (
          <Card key={expense.id} variant="cream" hasShadow className="p-0 overflow-hidden" isHoverable>
            <div className={cn("p-2 border-b-4 border-black text-center text-[10px] font-black uppercase tracking-widest", CATEGORIES.find(c => c.id === expense.category)?.color)}>
               {expense.category}
            </div>
            <div className="p-5">
               <div className="flex items-start justify-between mb-2">
                 <h4 className="text-2xl font-black leading-none uppercase tracking-tighter group-hover:text-brand-red transition-colors">{expense.title}</h4>
                 <button 
                   onClick={() => handleDelete(expense.id)}
                   className="text-black/20 hover:text-brand-red transition-colors p-1"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
               <p className="text-3xl font-black tracking-tighter mb-6">₹{expense.amount.toLocaleString()}</p>
               
               <div className="flex items-center justify-between pt-4 border-t-2 border-black/10">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 border-2 border-black flex items-center justify-center text-xs font-black bg-white"
                      style={{ color: members.find(m => m.name === expense.paidBy)?.color }}
                    >
                      {expense.paidBy.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black uppercase opacity-60 leading-tight">
                        PAID BY<br/>{expense.paidBy}
                    </span>
                  </div>
                  {expense.notes && (
                    <div title={expense.notes} className="bg-black text-white p-1.5 cursor-help">
                        <Info className="w-3 h-3" />
                    </div>
                  )}
               </div>
            </div>
          </Card>
        ))}

        {expenses.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={ReceiptText}
              title="No spends logged"
              description="Keep the finances in check and split things fairly with the gang."
              actionLabel="Log First Spend"
              onAction={() => setShowAddModal(true)}
            />
          </div>
        )}
      </div>

      </div>
      {/* Add Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="New Spend"
      >
        <form onSubmit={handleAddExpense} className="space-y-6">
          <Input
            label="What for?"
            placeholder="E.g. Dinner @ Beach"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              required
            />
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-black">
                Category
              </label>
              <select 
                className="w-full bg-white border-4 border-black p-4 font-bold text-black uppercase focus:outline-none focus:ring-4 focus:ring-brand-blue/20"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-black">
              Who Paid?
            </label>
            <select 
              className="w-full bg-white border-4 border-black p-4 font-bold text-black uppercase focus:outline-none focus:ring-4 focus:ring-brand-blue/20"
              value={formData.paidBy}
              onChange={e => setFormData({...formData, paidBy: e.target.value})}
            >
              {members.map(m => m.name).map((name, i) => (
                <option key={i} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="Add details..."
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value.toUpperCase()})}
          />

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              Log It
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

