import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-md border bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400',
          'border-paper-200 shadow-subtle transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-gold-600/40 focus:border-gold-600',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid && 'border-paprika-600 focus:ring-paprika-600/30 focus:border-paprika-600',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
