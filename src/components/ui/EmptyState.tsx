import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-14 text-center border-4 border-black border-dashed bg-zinc-50 relative overflow-hidden group">
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0_#000] relative z-10 rotate-[-3deg]">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 relative z-10">{title}</h3>
      <p className="text-sm font-bold opacity-60 max-w-xs mb-8 uppercase leading-tight relative z-10">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction} size="sm" className="relative z-10">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
