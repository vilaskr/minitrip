import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generateTripCode, handleFirestoreError, OperationType } from '../lib/utils';
import { MapPin, ArrowRight, Plane } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/ui/Logo';

export default function Home() {
  const [tripCode, setTripCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newTrip, setNewTrip] = useState({ name: '', destination: '', startDate: '' });
  const navigate = useNavigate();

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.name || !newTrip.destination || !newTrip.startDate) return;

    setIsCreating(true);
    const id = generateTripCode();
    
    // Safety timeout to reset UI if Firestore hangs
    const timeoutId = setTimeout(() => {
      setIsCreating(false);
      toast.error('CONNECTION TIMEOUT. PLEASE TRY AGAIN.');
    }, 10000);

    try {
      const tripData = {
        name: newTrip.name.toUpperCase(),
        destination: newTrip.destination.toUpperCase(),
        startDate: new Date(newTrip.startDate),
        createdAt: serverTimestamp(),
        id: id
      };
      
      await setDoc(doc(db, 'trips', id), tripData);
      
      clearTimeout(timeoutId);
      toast.success('TRIP CREATED! REDIRECTING...');
      navigate(`/trip/${id}`);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Create trip error:', error);
      toast.error('DATABASE ERROR. PLEASE TRY AGAIN.');
      setIsCreating(false);
    }
  };

  const handleJoinTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripCode) return;
    setIsJoining(true);
    navigate(`/trip/${tripCode.toUpperCase()}`);
    // Navigation is sync, but we set joining for visual feedback if load is slow
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 min-h-screen flex flex-col justify-center">
      <div className="text-center mb-16">
        <div className="flex flex-col items-center gap-6 mb-8">
          <Logo size="xl" />
          <div className="inline-block bg-brand-red border-4 border-black p-4 rotate-[-2deg] shadow-[8px_8px_0_#000]">
            <h1 className="text-5xl md:text-8xl font-heading font-black tracking-tighter text-white flex items-center gap-4">
              MINITRIP <Plane className="w-10 h-10 md:w-20 md:h-20 fill-white stroke-black stroke-[3px]" />
            </h1>
          </div>
        </div>
        <p className="text-xl md:text-2xl font-black uppercase tracking-tight max-w-2xl mx-auto">
          Collaborative trip planning for the digital wanderer.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Create Card */}
        <Card variant="yellow" className="flex flex-col h-full" isHoverable>
          <div className="mb-8">
            <div className="w-16 h-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 text-3xl shadow-[4px_4px_0_#000]">
              📍
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">New Adventure</h2>
            <p className="font-bold text-sm uppercase opacity-70">Start a fresh plan and invite the crew.</p>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-4 mt-auto">
            <Input
              placeholder="TRIP NAME (E.G. GOA 2024)"
              value={newTrip.name}
              onChange={e => setNewTrip({...newTrip, name: e.target.value.toUpperCase()})}
              required
            />
            <Input
              placeholder="DESTINATION"
              icon={<MapPin className="w-5 h-5" />}
              value={newTrip.destination}
              onChange={e => setNewTrip({...newTrip, destination: e.target.value.toUpperCase()})}
              required
            />
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase opacity-60">Trip start Date</label>
               <Input
                 type="date"
                 value={newTrip.startDate}
                 onChange={e => setNewTrip({...newTrip, startDate: e.target.value})}
                 required
               />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              isLoading={isCreating}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              CREATE TRIP
            </Button>
          </form>
        </Card>

        {/* Join Card */}
        <Card variant="cream" className="flex flex-col h-full" isHoverable>
          <div className="mb-8">
            <div className="w-16 h-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 text-3xl shadow-[4px_4px_0_#000]">
              🤝
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Join Crew</h2>
            <p className="font-bold text-sm uppercase opacity-70">Enter a code to sync live with friends.</p>
          </div>

          <form onSubmit={handleJoinTrip} className="space-y-4 mt-auto">
            <Input
              placeholder="ENTER 6-DIGIT CODE"
              className="text-center tracking-[0.5em]"
              value={tripCode}
              onChange={e => setTripCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
            />
            <Button 
              type="submit" 
              variant="secondary" 
              className="w-full"
              isLoading={isJoining}
            >
              JOIN THE TRIP
            </Button>
          </form>
        </Card>
      </div>

      <div className="mt-20 text-center flex flex-col items-center justify-center gap-3">
        <p className="text-xs font-black text-black/40 uppercase tracking-[0.2em]">
          Built with heavy black outlines & pure adrenaline.
        </p>
        <div className="inline-block bg-white border-2 border-black px-4 py-1.5 rotate-[1deg] shadow-[3px_3px_0_#000] text-xs font-black uppercase tracking-wider text-black">
          Credits: <span className="text-brand-red">Vilas K R</span> • © 2026
        </div>
      </div>
    </div>
  );
}

