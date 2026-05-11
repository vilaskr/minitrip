import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className, size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1',
    md: 'w-12 h-12 p-2',
    lg: 'w-20 h-20 p-4 border-4',
    xl: 'w-24 h-24 p-5 border-[6px]',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  return (
    <div className={cn(
      "bg-brand-yellow border-[3px] border-black flex items-center justify-center transform rotate-[-3deg] shadow-[4px_4px_0_#000]",
      sizeClasses[size],
      className
    )}>
      <MapPin className={cn("text-black fill-white", iconSizes[size])} strokeWidth={3} />
    </div>
  );
};
