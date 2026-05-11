import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'cream' | 'yellow' | 'blue' | 'green' | 'orange' | 'red';
  hasShadow?: boolean;
  isHoverable?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Card = ({ 
  className, 
  variant = 'white', 
  hasShadow = true, 
  isHoverable = false,
  children, 
  ...props 
}: CardProps) => {
  const variants = {
    white: 'bg-white',
    cream: 'bg-brand-cream',
    yellow: 'bg-brand-yellow',
    blue: 'bg-brand-blue text-white',
    green: 'bg-brand-green',
    orange: 'bg-brand-orange',
    red: 'bg-brand-red text-white',
  };

  return (
    <div
      className={cn(
        'border-4 border-black p-6 transition-all',
        variants[variant],
        hasShadow && 'shadow-[8px_8px_0_#000]',
        isHoverable && 'hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0_#000]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
