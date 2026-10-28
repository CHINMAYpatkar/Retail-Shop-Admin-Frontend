'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import {
  itemAvailabilitySchema,
  inDays,
  localToday,
  toApiDate,
  type ItemAvailabilityFormValues,
} from '@/lib/validations/item-availability.schema';
import { useSetItemAvailability } from '@/hooks/use-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import type { OrderItemRecord } from '@/types/api';

/** The delays the shop actually quotes. Typing a date is still available. */
const PRESETS = [
  { label: '2 days', days: 2 },
  { label: '4 days', days: 4 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  item: OrderItemRecord;
  /** True when this is the only line, so the hold/split choice is meaningless. */
  isOnlyItem: boolean;
}

/**
 * Tell a customer one line of their order is delayed.
 *
 * The two things this screen must get across, in this order: the order is not
 * cancelled, and here is when the item is expected. Everything else is detail.
 *
 * The hold-or-split choice lives here rather than in a separate step because
 * it is part of the same decision - and because an order marked unavailable
 * with nobody having decided what happens next is exactly the state that
 * produces a vague email or no email at all.
 */
export function ItemAvailabilityDialog({ open, onOpenChange, orderId, item, isOnlyItem }: Props) {
  const setAvailability = useSetItemAvailability();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ItemAvailabilityFormValues>({
    resolver: zodResolver(itemAvailabilitySchema),
    defaultValues: {
      expectedAvailabilityDate: inDays(4),
      availabilityNote: '',
      // Hold by default when there is nothing to split off, split by default
      // otherwise: sending the customer what the shop CAN send is the kinder
      // default when it is a real choice.
      holdForStock: isOnlyItem,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        expectedAvailabilityDate: inDays(4),
        availabilityNote: '',
        holdForStock: isOnlyItem,
      });
    }
  }, [open, isOnlyItem, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await setAvailability.mutateAsync({
      orderId,
      itemId: item.id,
      available: false,
      expectedAvailabilityDate: toApiDate(values.expectedAvailabilityDate),
      ...(values.availabilityNote ? { availabilityNote: values.availabilityNote } : {}),
      holdForStock: values.holdForStock,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`"${item.productName}" is out of stock`}
        description="The customer will be emailed. The order is not cancelled and nothing is refunded."
      >
        <form onSubmit={onSubmit} className="space-y-5 p-6 pt-0">
          <FormField
            label="Expected to be ready by"
            htmlFor="expectedAvailabilityDate"
            error={errors.expectedAvailabilityDate?.message}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.days}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setValue('expectedAvailabilityDate', inDays(preset.days), {
                        shouldValidate: true,
                      })
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Input
                id="expectedAvailabilityDate"
                type="date"
                min={localToday()}
                {...register('expectedAvailabilityDate')}
              />
            </div>
          </FormField>

          <FormField
            label="What should the customer be told? (optional)"
            htmlFor="availabilityNote"
            error={errors.availabilityNote?.message}
          >
            <Textarea
              id="availabilityNote"
              rows={2}
              placeholder="The new batch is still curing."
              {...register('availabilityNote')}
            />
          </FormField>

          {isOnlyItem ? (
            <p className="rounded-md bg-paper-100 px-3.5 py-3 text-sm text-ink-600">
              This is the only item on the order, so it will be held until the stock arrives.
            </p>
          ) : (
            <Controller
              control={control}
              name="holdForStock"
              render={({ field }) => (
                <fieldset className="space-y-2">
                  <legend className="mb-1.5 text-sm font-medium text-ink-800">
                    What happens to the rest of the order?
                  </legend>
                  <Choice
                    checked={!field.value}
                    onSelect={() => field.onChange(false)}
                    title="Ship what is ready now"
                    detail="The rest goes out as planned. This item follows in a second delivery, and the customer pays for each parcel when it arrives."
                  />
                  <Choice
                    checked={field.value}
                    onSelect={() => field.onChange(true)}
                    title="Hold the whole order"
                    detail="Nothing ships until this item is back. One delivery, one payment."
                  />
                </fieldset>
              )}
            />
          )}

          <div className="flex items-start gap-2.5 rounded-md bg-gold-100 px-3.5 py-3 text-sm text-ink-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
            <p>
              The stock stays allocated to this order. Nothing is returned to inventory, so the
              item cannot be sold to anybody else.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={setAvailability.isPending}>
              {setAvailability.isPending ? 'Notifying…' : 'Notify the customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A radio dressed as a card.
 *
 * A real `<input type="radio">` inside the label, so arrow keys move between
 * the options and a screen reader announces them as a group - which a pair of
 * clickable divs would not.
 */
function Choice({
  checked,
  onSelect,
  title,
  detail,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-md border p-3.5 transition-colors ${
        checked ? 'border-gold-400 bg-gold-100' : 'border-paper-200 hover:bg-paper-50'
      }`}
    >
      <input
        type="radio"
        name="holdForStock"
        checked={checked}
        onChange={onSelect}
        className="mt-1 h-4 w-4 shrink-0 accent-gold-600"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">{detail}</span>
      </span>
    </label>
  );
}
