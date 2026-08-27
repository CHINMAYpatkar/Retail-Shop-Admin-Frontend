'use client';

import { useParams } from 'next/navigation';
import { usePurchaseBill } from '@/hooks/use-purchase-bills';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { FileWarning } from 'lucide-react';
import { PurchaseBillForm } from '@/components/purchase-bills/purchase-bill-form';
import { formatCurrency } from '@/lib/utils';

export default function EditPurchaseBillPage() {
  const params = useParams<{ id: string }>();
  const { data: bill, isLoading } = usePurchaseBill(params?.id);

  if (isLoading) return <PageSpinner />;
  if (!bill) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Purchase bill not found"
        description="It may have been deleted."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`Bill ${bill.billNumber}`}
        description={`${bill.vendor?.name ?? ''} · ${bill.billDate.slice(0, 10)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant={
                bill.status === 'PAID' ? 'moss' : bill.status === 'PARTIALLY_PAID' ? 'gold' : 'neutral'
              }
            >
              {bill.status.replace('_', ' ')}
            </Badge>
            <span className="font-data text-sm text-ink-600">
              {formatCurrency(Number(bill.paidAmount))} of {formatCurrency(Number(bill.totalAmount))} paid
            </span>
          </div>
        }
      />

      <div className="mb-4 rounded-md border border-clove-200 bg-clove-50 p-3 text-xs text-clove-800">
        Editing the line items reverses this bill&apos;s original effect on stock and re-applies the
        new one, in a single step. Average cost is recalculated from the material&apos;s full purchase
        history, so it stays exact.
      </div>

      <PurchaseBillForm bill={bill} />
    </div>
  );
}
