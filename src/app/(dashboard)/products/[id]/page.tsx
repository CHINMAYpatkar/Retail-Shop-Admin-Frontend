'use client';

import { useParams } from 'next/navigation';
import { useProduct } from '@/hooks/use-products';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductForm } from '@/components/products/product-form';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(params.id);

  if (isLoading) return <PageSpinner />;
  if (!product) return <EmptyState title="Product not found" />;

  return (
    <div>
      <PageHeader title={product.name} description="Edit product details" />
      <ProductForm product={product} />
    </div>
  );
}
