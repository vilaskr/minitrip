import React from 'react';
import { Calendar, MapPin, Users, DollarSign, ListTodo } from 'lucide-react';
import { Card } from '../ui/Card';

interface TripHeaderProps {
  trip: any;
  stats: {
    expenses: number;
    members: number;
    itinerary: number;
    checklist: number;
  };
}

export default function TripHeader({ trip, stats }: TripHeaderProps) {
  return (
    <Card variant="white" hasShadow className="p-0 overflow-hidden relative">
      <div className="h-64 bg-brand-cream relative flex items-center justify-center border-b-8 border-black overflow-hidden group">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 3px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        {/* Artistic Background Accents */}
        <div className="absolute top-8 left-8 w-32 h-32 bg-brand-yellow -rotate-12 border-4 border-black shadow-[8px_8px_0_#000] opacity-30 group-hover:rotate-0 transition-transform duration-500"></div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-red rotate-12 border-4 border-black shadow-[12px_12px_0_#000] opacity-30 group-hover:rotate-0 transition-transform duration-1000"></div>

        <div className="relative z-10 text-center px-6 max-w-3xl">
            <div className="inline-block bg-white border-8 border-black p-6 md:p-8 rotate-[-2deg] shadow-[12px_12px_0_#000] mb-6 transition-all group-hover:rotate-0">
              <h1 className="text-4xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8]">{trip.name}</h1>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <div className="bg-black text-white px-5 py-2 flex items-center gap-2 border-2 border-black font-black uppercase text-xs md:text-sm shadow-[6px_6px_0_#FFD93D]">
                <MapPin className="w-4 h-4 text-brand-yellow" /> {trip.destination}
              </div>
              <div className="bg-white border-4 border-black px-5 py-2 flex items-center gap-2 font-black uppercase text-xs md:text-sm shadow-[6px_6px_0_#000]">
                <Calendar className="w-4 h-4 text-brand-blue" /> READY FOR ADVENTURE
              </div>
            </div>
        </div>
      </div>
      
      <div className="p-8 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 bg-white">
        <StatCard label="Total Spent" value={`$${stats.expenses.toLocaleString()}`} icon={DollarSign} color="bg-brand-orange" />
        <StatCard label="The Crew" value={`${stats.members} Joined`} icon={Users} color="bg-brand-blue" />
        <StatCard label="Itinerary" value={`${stats.itinerary} Spots`} icon={Calendar} color="bg-brand-green" />
        <StatCard label="Checklist" value={`${stats.checklist}% Done`} icon={ListTodo} color="bg-brand-yellow" />
      </div>
    </Card>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="flex items-center gap-5 group">
      <div className={`${color} border-4 border-black w-14 h-14 flex items-center justify-center shadow-[4px_4px_0_#000] transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0_#000]`}>
        <Icon className="w-7 h-7 text-white stroke-[3px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase text-black/40 leading-none mb-1 tracking-widest">{label}</p>
        <p className="text-2xl font-black uppercase leading-none tracking-tighter truncate">{value}</p>
      </div>
    </div>
  );
}

