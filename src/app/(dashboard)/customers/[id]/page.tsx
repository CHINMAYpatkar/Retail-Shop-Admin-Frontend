'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldOff, ShieldCheck } from 'lucide-react';
import { useCustomer, useSetCustomerActive } from '@/hooks/use-customers';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: customer, isLoading } = useCustomer(params.id);
  const setActive = useSetCustomerActive();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (isLoading) return <PageSpinner />;
  if (!customer) return <EmptyState title="Customer not found" />;

  return (
    <div>
      <PageHeader
        title={customer.name || 'Unnamed customer'}
        description={customer.email}
        actions={
          <Button
            variant={customer.isActive ? 'destructive' : 'gold'}
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            {customer.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {customer.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        }
      />

      <div className="mb-6 flex gap-2">
        <Badge variant={customer.isActive ? 'moss' : 'paprika'}>{customer.isActive ? 'Active' : 'Deactivated'}</Badge>
        <Badge variant={customer.emailVerifiedAt ? 'clove' : 'neutral'}>
          {customer.emailVerifiedAt ? 'Email verified' : 'Email unverified'}
        </Badge>
        <span className="text-sm text-ink-500">Joined {formatDate(customer.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
            </CardHeader>
            {!customer.orders || customer.orders.length === 0 ? (
              <EmptyState title="No orders yet" className="py-8" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/orders/${order.id}`} className="font-data text-xs hover:text-gold-700">
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right font-data">{formatCurrency(order.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent reviews</CardTitle>
            </CardHeader>
            {!customer.reviews || customer.reviews.length === 0 ? (
              <EmptyState title="No reviews yet" className="py-8" />
            ) : (
              <CardContent className="space-y-3">
                {customer.reviews.map((review) => (
                  <div key={review.id} className="border-b border-paper-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-ink-900">{review.product.name}</p>
                    <p className="text-sm text-ink-600">{review.comment}</p>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          {!customer.addresses || customer.addresses.length === 0 ? (
            <EmptyState title="No addresses saved" className="py-8" />
          ) : (
            <CardContent className="space-y-3">
              {customer.addresses.map((address) => (
                <div key={address.id} className="rounded-md border border-paper-200 p-3 text-sm">
                  <p className="font-medium text-ink-900">
                    {address.fullName} {address.isDefault && <Badge variant="gold">Default</Badge>}
                  </p>
                  <p className="text-ink-600">{address.phone}</p>
                  <p className="text-ink-600">
                    {address.line1}, {address.city}, {address.state} {address.postalCode}
                  </p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={customer.isActive ? 'Deactivate this customer?' : 'Activate this customer?'}
        description={
          customer.isActive
            ? 'They will be unable to sign in or place orders until reactivated.'
            : 'They will regain full access to their account.'
        }
        confirmLabel={customer.isActive ? 'Deactivate' : 'Activate'}
        destructive={customer.isActive}
        loading={setActive.isPending}
        onConfirm={() =>
          setActive.mutate({ id: customer.id, isActive: !customer.isActive }, { onSuccess: () => setConfirmOpen(false) })
        }
      />
    </div>
  );
}
