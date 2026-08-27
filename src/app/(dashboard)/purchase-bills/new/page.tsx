'use client';

import { PageHeader } from '@/components/ui/page-header';
import { PurchaseBillForm } from '@/components/purchase-bills/purchase-bill-form';

export default function NewPurchaseBillPage() {
  return (
    <div>
      <PageHeader
        title="Record a purchase bill"
        description="Adds the quantities to raw-material stock and updates each material's average cost."
      />
      <PurchaseBillForm />
    </div>
  );
}
