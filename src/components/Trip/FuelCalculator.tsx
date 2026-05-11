import React, { useState } from 'react';
import { Fuel, ArrowRight, Save, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { motion } from 'motion/react';

export default function FuelCalculator({ membersCount }: { membersCount: number }) {
  const [distance, setDistance] = useState('');
  const [mileage, setMileage] = useState('');
  const [price, setPrice] = useState('');

  const fuelNeeded = Number(distance) && Number(mileage) ? (Number(distance) / Number(mileage)) : 0;
  const totalCost = fuelNeeded * Number(price);
  const perPerson = membersCount > 0 ? totalCost / membersCount : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-brand-orange border-4 border-black p-2 shadow-[2px_2px_0_#000]">
           <Fuel className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-4xl font-black uppercase tracking-tighter">Fuel Estimator</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card variant="white" className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input 
                label="Distance (KM)"
                placeholder="0"
                type="number"
                value={distance}
                onChange={e => setDistance(e.target.value)}
              />
              <Input 
                label="Mileage (KM/L)"
                placeholder="0"
                type="number"
                value={mileage}
                onChange={e => setMileage(e.target.value)}
              />
              <Input 
                label="Fuel Price (₹/L)"
                placeholder="0"
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
           </div>
           
           <div className="p-4 bg-brand-orange/10 border-2 border-black border-dashed flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">
                Calculations are instant. Adjust numbers to see how much you'll spend on the road.
              </p>
           </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <motion.div
             animate={{ scale: totalCost > 0 ? 1.02 : 1 }}
             transition={{ type: 'spring', stiffness: 300 }}
           >
             <Card variant="orange" className="h-full flex flex-col justify-center text-center p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total Fuel Cost</p>
                <h4 className="text-5xl font-black tracking-tighter mb-1">₹{Math.round(totalCost).toLocaleString()}</h4>
                <p className="text-[10px] font-bold uppercase opacity-60 italic">{fuelNeeded.toFixed(1)} Liters needed</p>
             </Card>
           </motion.div>

           <motion.div
             animate={{ scale: perPerson > 0 ? 1.02 : 1 }}
             transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
           >
             <Card variant="yellow" className="h-full flex flex-col justify-center text-center p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Cost Per Head</p>
                <h4 className="text-4xl font-black tracking-tighter mb-1">₹{Math.round(perPerson).toLocaleString()}</h4>
                <p className="text-[10px] font-bold uppercase opacity-60 italic">Split between {membersCount} crew</p>
             </Card>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
