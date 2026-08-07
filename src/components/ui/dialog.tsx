'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

/**
 * Radix only mounts <Dialog.Content> when the parent <Dialog open> is true -
 * we deliberately do NOT use `forceMount` here. forceMount hands mount/unmount
 * control to the consumer (for exit animations), but doing that without also
 * gating the render on `open` means the dialog stays in the DOM (and visible)
 * regardless of state - which was the root cause of dialogs appearing open on
 * page load. Letting Radix own the conditional render is what makes
 * open/close/Escape/overlay-click/the X button all work correctly for free.
 */
export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-lg border border-paper-200 bg-white shadow-popover focus:outline-none',
          'max-h-[85vh] overflow-y-auto scrollbar-thin',
          'data-[state=open]:animate-slide-up',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between border-b border-paper-200 px-5 py-4">
          <div>
            <DialogPrimitive.Title className="font-display text-base font-semibold text-ink-900">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-0.5 text-sm text-ink-600">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className="rounded-sm p-1 text-ink-400 hover:bg-paper-100 hover:text-ink-700 focus:outline-none focus:ring-2 focus:ring-gold-600/40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="px-5 py-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-4 flex justify-end gap-2 border-t border-paper-200 pt-4', className)} {...props} />
);
