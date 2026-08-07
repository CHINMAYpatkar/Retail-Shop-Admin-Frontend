import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[88px] w-full rounded-md border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400',
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
Textarea.displayName = 'Textarea';
