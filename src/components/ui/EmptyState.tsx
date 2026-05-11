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
    <div className="flex flex-col items-center justify-center p-12 text-center border-4 border-black border-dashed bg-black/5">
      <div className="w-16 h-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0_#000]">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{title}</h3>
      <p className="text-sm font-bold opacity-60 max-w-xs mb-8 uppercase leading-tight">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
