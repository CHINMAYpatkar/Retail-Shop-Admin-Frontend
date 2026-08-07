'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Check, MapPin, Package } from 'lucide-react';
import { useOrder, useUpdateOrderStatus } from '@/hooks/use-orders';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OrderStatus } from '@/types/api';

// Mirrors the backend's ALLOWED_TRANSITIONS map (orders.service.ts) so the UI
// only ever offers moves the API will actually accept.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: ['REFUNDED'],
  REFUNDED: [],
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(params.id);
  const updateStatus = useUpdateOrderStatus();
  const [note, setNote] = React.useState('');

  if (isLoading) return <PageSpinner />;
  if (!order) return <EmptyState title="Order not found" />;

  const nextStatuses = ALLOWED_TRANSITIONS[order.status];

  return (
    <div>
      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDate(order.createdAt, true)}`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right font-data">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-data">{item.quantity}</TableCell>
                    <TableCell className="text-right font-data">{formatCurrency(item.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <CardContent className="space-y-1 border-t border-paper-200">
              <div className="flex justify-between text-sm text-ink-600">
                <span>Subtotal</span>
                <span className="font-data">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-600">
                <span>Shipping</span>
                <span className="font-data">{formatCurrency(order.shippingAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-600">
                <span>Tax</span>
                <span className="font-data">{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-semibold text-ink-900">
                <span>Total</span>
                <span className="font-data">{formatCurrency(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {order.statusHistory.map((entry, i) => (
                  <li key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {i < order.statusHistory.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-paper-200" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-ink-900">{entry.status.replace(/_/g, ' ')}</p>
                      {entry.note && <p className="text-sm text-ink-500">{entry.note}</p>}
                      <p className="text-xs text-ink-400">{formatDate(entry.createdAt, true)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium text-ink-900">{order.customer.name || 'Guest'}</p>
              <p className="text-ink-500">{order.customer.email}</p>
            </CardContent>
          </Card>

          {order.address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Delivery address
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-ink-700">
                <p className="font-medium">{order.address.fullName}</p>
                <p>{order.address.phone}</p>
                <p>
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ''}
                </p>
                <p>
                  {order.address.city}, {order.address.state} {order.address.postalCode}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Update status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextStatuses.length === 0 ? (
                <p className="text-sm text-ink-500">This order is in a final state — no further transitions.</p>
              ) : (
                <>
                  <Textarea
                    placeholder="Optional note (visible in the order timeline)"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses.map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant={next === 'CANCELLED' ? 'destructive' : 'gold'}
                        loading={updateStatus.isPending}
                        onClick={() =>
                          updateStatus.mutate(
                            { id: order.id, status: next, note: note || undefined },
                            { onSuccess: () => setNote('') },
                          )
                        }
                      >
                        Mark as {next.replace(/_/g, ' ').toLowerCase()}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
