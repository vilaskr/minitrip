import React from 'react';
import { DollarSign, ArrowRight, UserCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';

interface Member {
  id: string;
  name: string;
  color?: string;
}

interface Expense {
  amount: number;
  paidBy: string;
}

interface SettlementProps {
  members: Member[];
  expenses: Expense[];
}

export default function Settlements({ members, expenses }: SettlementProps) {
  const calculateSettlements = () => {
    if (members.length === 0) return [];

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const perPerson = totalSpent / members.length;

    // Calculate balance for each member
    // balance = Total Paid - Per Person Share
    const balances = members.map(member => {
      const paid = expenses
        .filter(exp => exp.paidBy === member.name)
        .reduce((sum, exp) => sum + exp.amount, 0);
      return {
        name: member.name,
        balance: paid - perPerson
      };
    });

    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

    const settlements: { from: string; to: string; amount: number }[] = [];

    let i = 0;
    let j = 0;

    const d = debtors.map(x => ({ ...x }));
    const c = creditors.map(x => ({ ...x }));

    while (i < d.length && j < c.length) {
      const amount = Math.min(Math.abs(d[i].balance), c[j].balance);
      settlements.push({
        from: d[i].name,
        to: c[j].name,
        amount: Math.round(amount * 100) / 100
      });

      d[i].balance += amount;
      c[j].balance -= amount;

      if (Math.abs(d[i].balance) < 0.01) i++;
      if (Math.abs(c[j].balance) < 0.01) j++;
    }

    return settlements;
  };

  const settlements = calculateSettlements();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-brand-blue border-4 border-black p-2 shadow-[2px_2px_0_#000]">
           <UserCircle2 className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-4xl font-black uppercase tracking-tighter">Settlements</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
           <p className="text-xs font-black uppercase tracking-widest text-black/40">The Final Tab</p>
           {settlements.map((s, i) => (
             <div key={i} className="flex items-center gap-4 bg-white border-4 border-black p-5 shadow-[4px_4px_0_#000] relative group">
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase opacity-40 mb-1">Payer</p>
                    <p className="font-black text-xl uppercase tracking-tighter">{s.from}</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="h-0.5 w-12 bg-black relative">
                        <ArrowRight className="w-4 h-4 absolute -right-2 -top-[7px]" />
                    </div>
                    <span className="text-[10px] font-black mt-2">₹{s.amount}</span>
                </div>
                <div className="flex-1 text-right">
                    <p className="text-[10px] font-black uppercase opacity-40 mb-1">Receiver</p>
                    <p className="font-black text-xl uppercase tracking-tighter">{s.to}</p>
                </div>
             </div>
           ))}
           {settlements.length === 0 && (
             <p className="p-8 text-center border-4 border-black border-dashed font-black uppercase opacity-20">
               Everything is evened out!
             </p>
           )}
        </div>

        <Card variant="white" className="p-6">
           <h4 className="text-2xl font-black uppercase tracking-tighter mb-6 border-b-4 border-black pb-2">Contribution</h4>
           <div className="space-y-4">
              {members.map(m => {
                const paid = expenses
                    .filter(exp => exp.paidBy === m.name)
                    .reduce((sum, exp) => sum + exp.amount, 0);
                return (
                    <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border-2 border-black flex items-center justify-center font-black" style={{ color: m.color }}>
                                {m.name.charAt(0)}
                            </div>
                            <span className="font-black uppercase tracking-tight">{m.name}</span>
                        </div>
                        <span className="font-black tracking-tighter">₹{paid.toLocaleString()}</span>
                    </div>
                );
              })}
           </div>
        </Card>
      </div>
    </div>
  );
}
