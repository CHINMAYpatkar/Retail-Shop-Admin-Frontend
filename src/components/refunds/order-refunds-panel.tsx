'use client';

import * as React from 'react';
import { Check, Plus, Undo2 } from 'lucide-react';
import { useOrderRefunds, useMarkRefundSent } from '@/hooks/use-refunds';
import { RefundDialog } from './refund-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { OrderStatus, Refund, RefundStatus } from '@/types/api';

const STATUS_VARIANT: Record<RefundStatus, 'moss' | 'gold' | 'paprika'> = {
  COMPLETED: 'moss',
  PENDING: 'gold',
  FAILED: 'paprika',
};

const STATUS_LABEL: Record<RefundStatus, string> = {
  COMPLETED: 'Sent',
  PENDING: 'Not sent',
  FAILED: 'Failed',
};

/**
 * Mirrors the API's rule. Payment is collected on delivery, so there is nothing
 * to return before then - explaining that up front beats a rejected submit.
 */
const REFUNDABLE: OrderStatus[] = ['DELIVERED', 'RETURNED', 'REFUNDED', 'CANCELLED'];

export function OrderRefundsPanel({
  orderId,
  orderStatus,
  orderTotal,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  orderTotal: number;
}) {
  const { data: refunds } = useOrderRefunds(orderId);
  const markSent = useMarkRefundSent();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Refund | undefined>();

  const canRefund = REFUNDABLE.includes(orderStatus);

  // Only completed refunds have actually left the account; pending is a
  // liability, so the two are shown separately rather than lumped together.
  const completed = (refunds ?? [])
    .filter((r) => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const pending = (refunds ?? [])
    .filter((r) => r.status === 'PENDING')
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const counted = (refunds ?? [])
    .filter((r) => r.status !== 'FAILED')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Undo2 className="h-4 w-4" /> Refunds
          </CardTitle>
          {!canRefund && (
            <p className="mt-1 text-xs text-ink-500">
              Nothing to refund yet — payment is collected on delivery.
            </p>
          )}
        </div>
        {canRefund && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Record
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {refunds && refunds.length > 0 && (
          <div className="space-y-1 rounded-md bg-paper-100 p-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-500">Sent</span>
              <span className="font-data">{formatCurrency(completed)}</span>
            </div>
            {pending > 0 && (
              <div className="flex justify-between">
                <span className="text-gold-700">Agreed, not yet sent</span>
                <span className="font-data text-gold-700">{formatCurrency(pending)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-paper-200 pt-1">
              <span className="text-ink-600">Still refundable</span>
              <span className="font-data">{formatCurrency(Math.max(orderTotal - counted, 0))}</span>
            </div>
          </div>
        )}

        {!refunds?.length ? (
          <p className="text-sm text-ink-500">No refunds on this order.</p>
        ) : (
          <ul className="space-y-2">
            {refunds.map((refund) => (
              <li key={refund.id} className="rounded-md border border-paper-200 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-data text-sm text-ink-900">
                      {formatCurrency(Number(refund.amount))}
                    </p>
                    <p className="truncate text-xs text-ink-600">{refund.reason}</p>
                    {refund.referenceNo && (
                      <p className="font-data text-xs text-ink-400">{refund.referenceNo}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={STATUS_VARIANT[refund.status]}>
                      {STATUS_LABEL[refund.status]}
                    </Badge>
                    {refund.status === 'PENDING' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-1.5 text-xs"
                        loading={markSent.isPending}
                        onClick={() => markSent.mutate({ id: refund.id })}
                      >
                        <Check className="h-3 w-3" /> Mark sent
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-xs"
                        onClick={() => {
                          setEditing(refund);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <RefundDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(undefined);
        }}
        orderId={orderId}
        orderTotal={orderTotal}
        alreadyRefunded={counted}
        editing={editing}
      />
    </Card>
  );
}
