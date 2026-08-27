'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Receipt, Pencil, Trash2, Paperclip } from 'lucide-react';
import { usePurchaseBills, useDeletePurchaseBill } from '@/hooks/use-purchase-bills';
import { useVendors } from '@/hooks/use-vendors';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { PurchaseBill, PurchaseBillStatus } from '@/types/api';

const STATUS_VARIANT: Record<PurchaseBillStatus, 'moss' | 'gold' | 'neutral'> = {
  PAID: 'moss',
  PARTIALLY_PAID: 'gold',
  UNPAID: 'neutral',
};

export default function PurchaseBillsPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [vendorId, setVendorId] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<PurchaseBill | undefined>();

  const { data: vendors } = useVendors({ limit: 100 });
  const { data, isLoading } = usePurchaseBills({
    page,
    limit: 20,
    search: search || undefined,
    vendorId: vendorId || undefined,
  });
  const deleteBill = useDeletePurchaseBill();

  const filtering = Boolean(search || vendorId);

  return (
    <div>
      <PageHeader
        title="Purchase bills"
        description="Bills received from vendors. Recording one adds its quantities to raw-material stock."
        actions={
          <Button variant="gold" onClick={() => router.push('/purchase-bills/new')}>
            <Plus className="h-4 w-4" /> Record bill
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search bill number or vendor..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={vendorId || 'all'}
          onValueChange={(v) => {
            setVendorId(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vendors</SelectItem>
            {vendors?.items.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading || !data ? (
          <PageSpinner />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={filtering ? 'No bills match those filters' : 'No purchase bills yet'}
            description={
              filtering
                ? 'Try a different vendor or bill number.'
                : 'Record what you buy from vendors - quantities are added to raw-material stock automatically.'
            }
            action={
              filtering ? undefined : (
                <Button variant="gold" onClick={() => router.push('/purchase-bills/new')}>
                  <Plus className="h-4 w-4" /> Record bill
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <Link
                        href={`/purchase-bills/${bill.id}`}
                        className="font-data font-medium hover:text-gold-700"
                      >
                        {bill.billNumber}
                      </Link>
                      {bill.attachmentMediaId && (
                        <Paperclip className="ml-1.5 inline h-3 w-3 text-ink-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-ink-700">{bill.vendor?.name}</TableCell>
                    <TableCell className="font-data text-xs text-ink-500">
                      {bill.billDate.slice(0, 10)}
                    </TableCell>
                    <TableCell className="text-right font-data text-xs text-ink-500">
                      {bill.items.length}
                    </TableCell>
                    <TableCell className="text-right font-data">
                      {formatCurrency(Number(bill.totalAmount))}
                    </TableCell>
                    <TableCell className="text-right font-data">
                      {Number(bill.outstandingAmount) > 0 ? (
                        <span className="text-paprika-600">
                          {formatCurrency(Number(bill.outstandingAmount))}
                        </span>
                      ) : (
                        <span className="text-ink-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[bill.status]}>
                        {bill.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/purchase-bills/${bill.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(bill)}>
                        <Trash2 className="h-4 w-4 text-paprika-600" />
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete purchase bill?"
        description={`Bill "${deleteTarget?.billNumber}" will be removed and its quantities subtracted back out of raw-material stock. Average costs are recalculated. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteBill.isPending}
        onConfirm={() => {
          if (deleteTarget)
            deleteBill.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
