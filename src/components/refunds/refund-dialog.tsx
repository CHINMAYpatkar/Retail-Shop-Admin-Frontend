'use client';

import * as React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { refundSchema, type RefundFormValues } from '@/lib/validations/refund.schema';
import { useCreateRefund, useUpdateRefund } from '@/hooks/use-refunds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { PAYMENT_MODES, REFUND_STATUSES, type Refund } from '@/types/api';

const EMPTY: RefundFormValues = {
  amount: '',
  reason: '',
  method: 'UPI',
  status: 'PENDING',
  referenceNo: '',
  refundedOn: '',
  notes: '',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  /** Order total and what is already refunded, so the ceiling can be shown. */
  orderTotal: number;
  alreadyRefunded: number;
  editing?: Refund;
}

export function RefundDialog({
  open,
  onOpenChange,
  orderId,
  orderTotal,
  alreadyRefunded,
  editing,
}: Props) {
  const create = useCreateRefund(orderId);
  const update = useUpdateRefund();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RefundFormValues>({ resolver: zodResolver(refundSchema), defaultValues: EMPTY });

  const status = useWatch({ control, name: 'status' });

  // What is left to refund. When editing, this refund's own amount is added
  // back, because it no longer counts against itself.
  const remaining = orderTotal - alreadyRefunded + (editing ? Number(editing.amount) : 0);

  React.useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            amount: editing.amount,
            reason: editing.reason,
            method: editing.method,
            status: editing.status,
            referenceNo: editing.referenceNo ?? '',
            refundedOn: editing.refundedOn ? editing.refundedOn.slice(0, 10) : '',
            notes: editing.notes ?? '',
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  const onSubmit = (values: RefundFormValues) => {
    const done = () => {
      reset(EMPTY);
      onOpenChange(false);
    };
    if (editing) update.mutate({ id: editing.id, values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={editing ? 'Edit refund' : 'Record a refund'}
        description="A record of money returned to the customer - the transfer itself is made by hand."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-md bg-paper-100 p-3 text-xs text-ink-600">
            Order total {formatCurrency(orderTotal)} · already refunded{' '}
            {formatCurrency(alreadyRefunded)} ·{' '}
            <span className="font-medium text-ink-800">
              {formatCurrency(Math.max(remaining, 0))} still refundable
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Amount" htmlFor="amount" error={errors.amount?.message} required>
              <Input id="amount" inputMode="decimal" invalid={!!errors.amount} {...register('amount')} />
            </FormField>

            <FormField label="Method" required>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="Reason"
              htmlFor="reason"
              error={errors.reason?.message}
              required
              className="sm:col-span-2"
              hint="Why money was returned - this is the record"
            >
              <Input
                id="reason"
                placeholder="e.g. one jar arrived cracked"
                invalid={!!errors.reason}
                {...register('reason')}
              />
            </FormField>

            <FormField
              label="Status"
              required
              hint={
                status === 'COMPLETED'
                  ? 'The money has actually been sent'
                  : 'Agreed, but not yet sent - shows as a liability'
              }
            >
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REFUND_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="Reference"
              htmlFor="referenceNo"
              hint="UPI txn id or bank reference"
            >
              <Input id="referenceNo" {...register('referenceNo')} />
            </FormField>

            {status === 'COMPLETED' && (
              <FormField
                label="Sent on"
                htmlFor="refundedOn"
                hint="Defaults to today"
                className="sm:col-span-2"
              >
                <Input id="refundedOn" type="date" {...register('refundedOn')} />
              </FormField>
            )}
          </div>

          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register('notes')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Record refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
