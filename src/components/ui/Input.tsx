import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-xs font-black uppercase tracking-widest text-black">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white border-4 border-black p-4 font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-4 focus:ring-brand-blue/20 transition-all uppercase',
              icon && 'pl-12',
              error && 'border-brand-red',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] font-black text-brand-red uppercase">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
