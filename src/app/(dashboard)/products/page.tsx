'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Boxes, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useProducts, useDeleteProduct, useRestoreProduct } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types/api';

export default function ProductsPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string>('');
  const [deleteTarget, setDeleteTarget] = React.useState<Product | undefined>();
  const [showDeleted, setShowDeleted] = React.useState(false);

  const { data: categories } = useCategories();
  const { data, isLoading } = useProducts({
    page,
    limit: 15,
    search: search || undefined,
    categoryId: categoryId || undefined,
    onlyDeleted: showDeleted || undefined,
  });
  const deleteProduct = useDeleteProduct();
  const restoreProduct = useRestoreProduct();

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your spice catalog"
        actions={
          <Button variant="gold" onClick={() => router.push('/products/new')}>
            <Plus className="h-4 w-4" /> New product
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={categoryId || 'all'}
          onValueChange={(v) => {
            setCategoryId(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex cursor-pointer select-none items-center gap-2 self-center text-sm text-ink-600">
          <Checkbox
            checked={showDeleted}
            onCheckedChange={(value) => {
              setShowDeleted(Boolean(value));
              setPage(1);
            }}
          />
          Deleted only
        </label>
      </div>

      <Card>
        {isLoading || !data ? (
          <PageSpinner />
        ) : data.items.length === 0 ? (
          <EmptyState icon={Boxes} title="No products found" description="Try adjusting your search or add a new product." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.images[0].url} alt="" className="h-9 w-9 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper-100 text-ink-300">
                            <Boxes className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <Link href={`/products/${product.id}`} className="font-medium hover:text-gold-700">
                            {product.name}
                          </Link>
                          {product.deletedAt && (
                            <Badge variant="paprika" className="ml-2">
                              Deleted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-ink-600">{product.category?.name}</TableCell>
                    <TableCell className="text-right font-data">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right font-data">
                      <span className={product.stockQuantity <= 10 ? 'text-paprika-600' : ''}>{product.stockQuantity}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? 'moss' : 'neutral'}>{product.isActive ? 'Active' : 'Hidden'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/products/${product.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {product.deletedAt ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs"
                            loading={restoreProduct.isPending}
                            onClick={() => restoreProduct.mutate(product.id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(product)}>
                            <Trash2 className="h-4 w-4 text-paprika-600" />
                          </Button>
                        )}
                      </div>
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
        title="Delete product?"
        description={`"${deleteTarget?.name}" will be hidden from the storefront and soft-deleted. Order history is preserved.`}
        confirmLabel="Delete"
        destructive
        loading={deleteProduct.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteProduct.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
