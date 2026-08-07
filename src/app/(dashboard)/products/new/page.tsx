'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ProductForm } from '@/components/products/product-form';

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="New product" description="Add a new spice to the catalog" />
      <ProductForm />
    </div>
  );
}
