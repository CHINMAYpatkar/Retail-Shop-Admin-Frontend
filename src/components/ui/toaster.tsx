'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'rounded-md border border-paper-200 bg-white shadow-popover font-sans text-sm text-ink-900',
          title: 'font-medium',
          description: 'text-ink-500',
          actionButton: 'bg-ink-900 text-white',
          cancelButton: 'bg-paper-100 text-ink-700',
          error: '!border-paprika-200 [&_[data-icon]]:!text-paprika-600',
          success: '!border-moss-200 [&_[data-icon]]:!text-moss-600',
        },
      }}
    />
  );
}
