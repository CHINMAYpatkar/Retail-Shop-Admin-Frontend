'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Undo2, Check, Pencil } from 'lucide-react';
import { useRefunds, useMarkRefundSent } from '@/hooks/use-refunds';
import { RefundDialog } from '@/components/refunds/refund-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { PAYMENT_MODES, type Refund, type RefundStatus } from '@/types/api';

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

const methodLabel = (v: string) => PAYMENT_MODES.find((m) => m.value === v)?.label ?? v;

export default function RefundsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<string>('');
  const [editing, setEditing] = React.useState<Refund | undefined>();

  const { data, isLoading } = useRefunds({
    page,
    limit: 20,
    search: search || undefined,
    status: (status || undefined) as RefundStatus | undefined,
  });
  const markSent = useMarkRefundSent();

  const filtering = Boolean(search || status);

  return (
    <div>
      <PageHeader
        title="Refunds"
        description="Money returned to customers. Recorded here; the transfer itself is made by hand."
      />

      {data && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-ink-500">Refunded (sent)</p>
              <p className="mt-1 font-data text-xl text-ink-900">
                {formatCurrency(Number(data.summary.completedAmount))}
              </p>
              <p className="mt-1 text-xs text-ink-400">deducted from revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-ink-500">Agreed, not yet sent</p>
              <p
                className={
                  Number(data.summary.pendingAmount) > 0
                    ? 'mt-1 font-data text-xl text-gold-700'
                    : 'mt-1 font-data text-xl text-ink-900'
                }
              >
                {formatCurrency(Number(data.summary.pendingAmount))}
              </p>
              <p className="mt-1 text-xs text-ink-400">owed to customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-ink-500">Records</p>
              <p className="mt-1 font-data text-xl text-ink-900">{data.total}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search order, reason or reference..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status || 'all'}
          onValueChange={(v) => {
            setStatus(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Not sent</SelectItem>
            <SelectItem value="COMPLETED">Sent</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading || !data ? (
          <PageSpinner />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Undo2}
            title={filtering ? 'No refunds match those filters' : 'No refunds recorded'}
            description={
              filtering
                ? 'Try a different status or search.'
                : 'Refunds are recorded from an order - open a delivered order and use its Refunds panel.'
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${refund.orderId}`}
                        className="font-data text-xs hover:text-gold-700"
                      >
                        {refund.order?.orderNumber ?? '-'}
                      </Link>
                      <p className="text-xs text-ink-400">{refund.order?.customer?.email}</p>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-ink-700">
                      {refund.reason}
                    </TableCell>
                    <TableCell className="text-sm text-ink-600">{methodLabel(refund.method)}</TableCell>
                    <TableCell className="font-data text-xs text-ink-500">
                      {refund.referenceNo || '-'}
                    </TableCell>
                    <TableCell className="text-right font-data">
                      {formatCurrency(Number(refund.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[refund.status]}>
                        {STATUS_LABEL[refund.status]}
                      </Badge>
                      {refund.refundedOn && (
                        <p className="mt-0.5 font-data text-xs text-ink-400">
                          {refund.refundedOn.slice(0, 10)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {refund.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          loading={markSent.isPending}
                          onClick={() => markSent.mutate({ id: refund.id })}
                        >
                          <Check className="h-3.5 w-3.5" /> Mark sent
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(refund)}
                        aria-label="Edit refund"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      {editing && (
        <RefundDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(undefined)}
          orderId={editing.orderId}
          orderTotal={Number(editing.order?.totalAmount ?? 0)}
          alreadyRefunded={Number(editing.amount)}
          editing={editing}
        />
      )}
    </div>
  );
}
