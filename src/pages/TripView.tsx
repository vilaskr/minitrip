import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { 
  doc, onSnapshot, collection, query, orderBy, 
  addDoc, serverTimestamp
} from 'firebase/firestore';
import { 
  Calendar, MapPin, DollarSign, ListTodo, 
  StickyNote, Map as MapIcon, Cloud, Share2,
  ArrowLeft, CheckCircle2, UserCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, getAvatarColor, handleFirestoreError, OperationType } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Sections
import Expenses from '../components/Trip/Expenses';
import Itinerary from '../components/Trip/Itinerary';
import Checklist from '../components/Trip/Checklist';
import Notes from '../components/Trip/Notes';
import Places from '../components/Trip/Places';
import TripHeader from '../components/Trip/TripHeader';
import Members from '../components/Trip/Members';
import ActivityFeed from '../components/Trip/ActivityFeed';
import TripCountdown from '../components/Trip/TripCountdown';
import RouteOverview from '../components/Trip/RouteOverview';

// UI
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import ConnectivityStatus from '../components/ui/ConnectivityStatus';
import { Logo } from '../components/ui/Logo';
import { logActivity } from '../lib/utils';

export default function TripView() {
  const { tripId: rawTripId } = useParams<{ tripId: string }>();
  const tripId = rawTripId?.toUpperCase();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem(`trip_user_${tripId}`) || '');
  const [stats, setStats] = useState({ expenses: 0, members: 0, itinerary: 0, checklist: 0 });

  useEffect(() => {
    if (!tripId) return;

    // Main Trip Listener
    const unsubTrip = onSnapshot(doc(db, 'trips', tripId), (docSnap) => {
      if (docSnap.exists()) {
        setTrip({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error('Trip not found');
        navigate('/');
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}`, auth);
    });

    // Stats Listeners
    const unsubExpenses = onSnapshot(collection(db, 'trips', tripId, 'expenses'), (snap) => {
        const total = snap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
        setStats(prev => ({ ...prev, expenses: total }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/expenses`, auth);
    });

    const unsubMembers = onSnapshot(collection(db, 'trips', tripId, 'members'), (snap) => {
        setStats(prev => ({ ...prev, members: snap.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/members`, auth);
    });

    const unsubItinerary = onSnapshot(collection(db, 'trips', tripId, 'itinerary'), (snap) => {
        setStats(prev => ({ ...prev, itinerary: snap.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/itinerary`, auth);
    });

    const unsubChecklist = onSnapshot(collection(db, 'trips', tripId, 'checklist'), (snap) => {
        const total = snap.size;
        const completed = snap.docs.filter(d => d.data().completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        setStats(prev => ({ ...prev, checklist: progress }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `trips/${tripId}/checklist`, auth);
    });

    return () => {
        unsubTrip();
        unsubExpenses();
        unsubMembers();
        unsubItinerary();
        unsubChecklist();
    };
  }, [tripId, navigate]);

  useEffect(() => {
    if (!loading && trip && !userName) {
      setShowJoinModal(true);
    }
  }, [loading, trip, userName]);

  const handleJoin = async (name: string) => {
    if (!name.trim()) return;
    setIsJoining(true);
    const userId = Math.random().toString(36).substring(7);
    const color = getAvatarColor(name);
    
    try {
      await addDoc(collection(db, 'trips', tripId!, 'members'), {
        userId,
        name: name.toUpperCase(),
        color,
        joinedAt: serverTimestamp()
      });
      localStorage.setItem(`trip_user_${tripId}`, name.toUpperCase());
      localStorage.setItem(`trip_userId_${tripId}`, userId);
      setUserName(name.toUpperCase());
      setShowJoinModal(false);
      logActivity(tripId!, name.toUpperCase(), 'JOINED THE CREW');
      toast.success(`WELCOME, ${name.toUpperCase()}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `trips/${tripId}/members`, auth);
    } finally {
      setIsJoining(false);
    }
  };

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('INVITE LINK COPIED!');
    } catch (err) {
      // Fallback for non-secure contexts or other restrictions
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          toast.success('INVITE LINK COPIED!');
        } else {
          throw new Error('Fallback failed');
        }
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr);
        toast.error('FAILED TO COPY. PLEASE COPY ADDRESS BAR.');
      }
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-brand-beige">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="flex flex-col items-center gap-6"
      >
        <Logo size="xl" />
        <h2 className="text-4xl font-black uppercase tracking-tight">Syncing Adventure...</h2>
      </motion.div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MapIcon, color: 'brand-red' },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, color: 'brand-orange' },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar, color: 'brand-blue' },
    { id: 'checklist', label: 'Checklist', icon: ListTodo, color: 'brand-green' },
    { id: 'places', label: 'Places', icon: MapPin, color: 'brand-yellow' },
    { id: 'notes', label: 'Notes', icon: StickyNote, color: 'emerald-400' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <ConnectivityStatus />
      {/* Top Navbar */}
      <header className="h-24 bg-white border-b-8 border-black flex items-center justify-between px-6 md:px-12 z-50 sticky top-0 shadow-[0_4px_0_rgba(0,0,0,1)]">
        <div className="flex items-center gap-6">
          <Logo size="sm" className="hidden md:flex flex-shrink-0" />
          <button 
            onClick={() => navigate('/')}
            className="hidden md:flex items-center justify-center p-2 bg-brand-beige border-4 border-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-90"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black leading-tight uppercase tracking-tighter truncate max-w-[200px] md:max-w-md">{trip.name}</h1>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 border-2 border-black">ID: {tripId}</span>
                <span className="text-[10px] font-black uppercase opacity-40 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {trip.destination}
                </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={copyLink}
            variant="yellow"
            size="sm"
            className="hidden md:flex"
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            INVITE CREW
          </Button>
          <div className="h-12 w-12 border-4 border-black bg-brand-cream flex items-center justify-center font-black shadow-[4px_4px_0_#000] relative group">
            {userName.charAt(0) || '?'}
            <div className="absolute -bottom-10 right-0 bg-black text-white px-2 py-1 text-[10px] font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black z-50">
                Logged in as {userName}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden xl:flex w-80 border-r-8 border-black bg-white flex-col p-8 space-y-10 overflow-y-auto">
          <nav className="flex flex-col gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "border-4 border-black p-5 font-black text-left flex items-center justify-between transition-all group",
                  activeTab === tab.id 
                    ? `bg-${tab.color} text-white shadow-[6px_6px_0_#000] -translate-x-[2px] -translate-y-[2px]` 
                    : "bg-white hover:bg-brand-beige shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
                )}
              >
                <div className="flex items-center gap-4">
                    <tab.icon className={cn("w-6 h-6", activeTab === tab.id ? "animate-pulse" : "group-hover:rotate-12")} />
                    <span className="uppercase tracking-tighter text-xl">{tab.label}</span>
                </div>
                {activeTab === tab.id && <CheckCircle2 className="w-5 h-5 opacity-50" />}
              </button>
            ))}
          </nav>

          <Members tripId={tripId!} />

          <Card variant="blue" className="mt-auto p-6 space-y-2">
            <div className="flex items-center justify-between">
                <Cloud className="w-8 h-8 text-white" />
                <span className="text-[10px] font-black uppercase opacity-60 text-white">Live Forecast</span>
            </div>
            <div>
              <p className="font-black text-2xl leading-none text-white tracking-tighter uppercase truncate">{trip.destination}</p>
              <p className="font-black text-3xl leading-tight text-white tracking-tighter">24°C / SUNNY</p>
            </div>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-brand-beige relative selection:bg-brand-red selection:text-white">
          <div className="max-w-[1400px] mx-auto space-y-12 pb-24">
            <TripCountdown startDate={trip?.startDate} />
            <TripHeader trip={trip} stats={stats} />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    <div className="xl:col-span-8 space-y-16">
                      <RouteOverview tripId={tripId!} />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                              <div className="w-3 h-10 bg-brand-blue border-2 border-black" />
                              <h3 className="text-3xl font-black uppercase tracking-tighter">Up Next</h3>
                          </div>
                          <div className="min-h-[200px]">
                            <Itinerary tripId={tripId!} limit={2} />
                          </div>
                          <Button 
                              variant="secondary" 
                              size="sm" 
                              className="w-full h-12 text-lg"
                              onClick={() => setActiveTab('itinerary')}
                          >
                              View Full Itinerary
                          </Button>
                        </div>
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                              <div className="w-3 h-10 bg-brand-yellow border-2 border-black" />
                              <h3 className="text-3xl font-black uppercase tracking-tighter">Pinned Spots</h3>
                          </div>
                          <div className="min-h-[200px]">
                            <Places tripId={tripId!} limit={2} />
                          </div>
                          <Button 
                              variant="secondary" 
                              size="sm" 
                              className="w-full h-12 text-lg"
                              onClick={() => setActiveTab('places')}
                          >
                              Explore All Bookmarks
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                          <div className="flex items-center gap-4">
                              <div className="w-3 h-10 bg-brand-orange border-2 border-black" />
                              <h3 className="text-3xl font-black uppercase tracking-tighter">Budget Snapshot</h3>
                          </div>
                          <Card variant="white" className="p-0 overflow-hidden">
                               <Expenses tripId={tripId!} limit={4} compact />
                               <div className="p-6 border-t-4 border-black bg-brand-cream/50 flex justify-center">
                                  <Button 
                                      variant="secondary" 
                                      size="sm" 
                                      className="px-12 h-12 text-lg"
                                      onClick={() => setActiveTab('expenses')}
                                  >
                                      Detailed Breakdown
                                  </Button>
                               </div>
                          </Card>
                      </div>
                    </div>

                    <div className="xl:col-span-4 border-l-4 border-black/5 pl-0 xl:pl-12">
                       <ActivityFeed tripId={tripId!} />
                    </div>
                  </div>
                )}
                {activeTab === 'expenses' && <Expenses tripId={tripId!} />}
                {activeTab === 'itinerary' && <Itinerary tripId={tripId!} />}
                {activeTab === 'checklist' && <Checklist tripId={tripId!} />}
                {activeTab === 'notes' && <Notes tripId={tripId!} />}
                {activeTab === 'places' && <Places tripId={tripId!} />}
              </motion.div>
            </AnimatePresence>

            {/* Copyright & Credits Footer */}
            <div className="pt-12 border-t-4 border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-xs font-black text-black/40 uppercase tracking-[0.2em] text-center md:text-left">
                Built with heavy black outlines & pure adrenaline.
              </span>
              <div className="inline-block bg-white border-2 border-black px-4 py-1.5 rotate-[-1deg] shadow-[3px_3px_0_#000] text-xs font-black uppercase tracking-wider text-black">
                Credits: <span className="text-brand-red">Vilas K R</span> • © 2026
              </div>
            </div>
          </div>
        </main>
      </div>

      <Modal 
        isOpen={showJoinModal} 
        onClose={() => {}} // Force join
        title="Who's Planing?"
      >
        <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-brand-cream border-4 border-black shadow-[4px_4px_0_#000]">
                <UserCircle2 className="w-12 h-12 text-brand-orange" />
                <div>
                    <h4 className="font-black uppercase tracking-tight text-xl leading-none">{trip.name}</h4>
                    <p className="text-xs font-bold uppercase opacity-60">Join your friends on this trip.</p>
                </div>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value;
              handleJoin(name);
            }} className="space-y-6">
              <Input
                name="name"
                label="DISPLAY NAME"
                autoFocus
                placeholder="E.G. VILAS"
                required
                className="text-2xl font-black uppercase"
              />
              <Button type="submit" className="w-full py-6 text-2xl" isLoading={isJoining}>
                JOIN THE TRIP
              </Button>
            </form>
        </div>
      </Modal>

      {/* Mobile Navigation */}
      <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg bg-white border-4 border-black shadow-[8px_8px_0_#000] flex p-2 gap-2 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-shrink-0 px-4 py-3 border-4 border-black flex flex-col items-center justify-center transition-all",
               activeTab === tab.id ? `bg-${tab.color} text-white shadow-none translate-x-[2px] translate-y-[2px]` : "bg-white hover:bg-zinc-50"
            )}
          >
            <tab.icon className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

