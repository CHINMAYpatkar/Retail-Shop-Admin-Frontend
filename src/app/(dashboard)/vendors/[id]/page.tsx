'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, TriangleAlert } from 'lucide-react';
import { useVendorLedger } from '@/hooks/use-vendor-payments';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { PurchaseBillStatus } from '@/types/api';

const STATUS_VARIANT: Record<PurchaseBillStatus, 'moss' | 'gold' | 'neutral'> = {
  PAID: 'moss',
  PARTIALLY_PAID: 'gold',
  UNPAID: 'neutral',
};

export default function VendorLedgerPage() {
  const params = useParams<{ id: string }>();
  const { data: ledger, isLoading } = useVendorLedger(params?.id);

  if (isLoading) return <PageSpinner />;
  if (!ledger) {
    return (
      <EmptyState icon={Building2} title="Vendor not found" description="It may have been deleted." />
    );
  }

  const { vendor, summary, bills, entries } = ledger;
  const outstanding = Number(summary.outstanding);

  return (
    <div>
      <PageHeader
        title={vendor.name}
        description={
          [vendor.contactPerson, vendor.phone, vendor.city].filter(Boolean).join(' - ') ||
          'Vendor statement'
        }
        actions={
          <Link href="/vendors">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> All vendors
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-500">Total billed</p>
            <p className="mt-1 font-data text-xl text-ink-900">
              {formatCurrency(Number(summary.totalBilled))}
            </p>
            <p className="mt-1 text-xs text-ink-400">{summary.billCount} bill(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-500">Total paid</p>
            <p className="mt-1 font-data text-xl text-ink-900">
              {formatCurrency(Number(summary.totalPaid))}
            </p>
            <p className="mt-1 text-xs text-ink-400">
              {formatCurrency(Number(summary.onAccount))} on account
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-500">
              {outstanding < 0 ? 'Advance held by vendor' : 'Outstanding'}
            </p>
            <p
              className={
                outstanding > 0
                  ? 'mt-1 font-data text-xl text-paprika-600'
                  : 'mt-1 font-data text-xl text-moss-700'
              }
            >
              {formatCurrency(Math.abs(outstanding))}
            </p>
            <p className="mt-1 text-xs text-ink-400">{summary.unpaidBillCount} unpaid bill(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-500">Oldest unpaid</p>
            <p className="mt-1 font-data text-xl text-ink-900">
              {summary.oldestUnpaidBillDate ? summary.oldestUnpaidBillDate.slice(0, 10) : '-'}
            </p>
            <p className="mt-1 text-xs text-ink-400">
              {summary.oldestUnpaidBillDate ? 'chase this one first' : 'nothing outstanding'}
            </p>
          </CardContent>
        </Card>
      </div>

      {outstanding < 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-clove-200 bg-clove-50 p-3 text-xs text-clove-800">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Payments exceed what has been billed, so this vendor is holding an advance. Normal if you
            paid up front - otherwise check for a bill that has not been entered yet.
          </span>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Statement</CardTitle>
          <p className="mt-1 text-xs text-ink-500">
            Bills and payments in date order with the running balance owed. Computed on read - no
            balance is stored, so it cannot drift when a bill or payment is edited.
          </p>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {entries.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-ink-500">No bills or payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={`${entry.kind}-${index}`}>
                    <TableCell className="font-data text-xs text-ink-500">
                      {entry.date.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.kind === 'BILL' ? 'neutral' : 'moss'}>
                        {entry.kind === 'BILL' ? 'Bill' : 'Payment'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.kind === 'BILL' && entry.billId ? (
                        <Link
                          href={`/purchase-bills/${entry.billId}`}
                          className="font-data text-xs hover:text-gold-700"
                        >
                          {entry.reference}
                        </Link>
                      ) : (
                        <span className="font-data text-xs text-ink-600">
                          {entry.reference}
                          {entry.billNumber ? ` to ${entry.billNumber}` : ''}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-data text-sm">
                      {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit)) : ''}
                    </TableCell>
                    <TableCell className="text-right font-data text-sm text-moss-700">
                      {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit)) : ''}
                    </TableCell>
                    <TableCell className="text-right font-data text-sm font-medium">
                      {formatCurrency(Number(entry.balance))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {bills.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-ink-500">No bills recorded for this vendor.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <Link
                        href={`/purchase-bills/${bill.id}`}
                        className="font-data text-sm hover:text-gold-700"
                      >
                        {bill.billNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-data text-xs text-ink-500">
                      {bill.billDate.slice(0, 10)}
                    </TableCell>
                    <TableCell className="font-data text-xs text-ink-500">
                      {bill.dueDate ? bill.dueDate.slice(0, 10) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-data text-sm">
                      {formatCurrency(Number(bill.totalAmount))}
                    </TableCell>
                    <TableCell className="text-right font-data text-sm">
                      {formatCurrency(Number(bill.paidAmount))}
                    </TableCell>
                    <TableCell className="text-right font-data text-sm">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
