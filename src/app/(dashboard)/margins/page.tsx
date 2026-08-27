'use client';

import Link from 'next/link';
import { TrendingUp, TriangleAlert } from 'lucide-react';
import { useMargins } from '@/hooks/use-costing';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

export default function MarginsPage() {
  const { data, isLoading } = useMargins();

  if (isLoading) return <PageSpinner />;
  if (!data) return <EmptyState icon={TrendingUp} title="Could not load margins" />;

  const { costed, uncosted, summary } = data;

  return (
    <div>
      <PageHeader
        title="Product margins"
        description="Selling price against what each product costs to make, from its active cost sheet."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-500">Products</p>
            <p className="mt-1 font-data text-xl text-ink-900">{summary.productCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-500">Costed</p>
            <p className="mt-1 font-data text-xl text-moss-700">{summary.costedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-500">Not costed</p>
            <p className="mt-1 font-data text-xl text-ink-900">{summary.uncostedCount}</p>
            <p className="mt-1 text-xs text-ink-400">margin unknown</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-ink-500">Selling at a loss</p>
            <p
              className={
                summary.lossMakingCount > 0
                  ? 'mt-1 font-data text-xl text-paprika-600'
                  : 'mt-1 font-data text-xl text-ink-900'
              }
            >
              {summary.lossMakingCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {summary.lossMakingCount > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-paprika-200 bg-paprika-50 p-3 text-xs text-paprika-800">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {summary.lossMakingCount} product(s) cost more to make than they sell for. Either the
            price is too low, or a cost sheet needs revisiting.
          </span>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Costed products</CardTitle>
          <p className="mt-1 text-xs text-ink-500">
            Margin is a share of the selling price (gross margin), not a markup on cost - the two
            differ enough to matter.
          </p>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {costed.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-ink-500">No product has an active cost sheet yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Sheet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costed.map((row) => {
                  const margin = Number(row.marginAmount);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          href={`/products/${row.id}/costing`}
                          className="text-sm font-medium text-ink-900 hover:text-gold-700"
                        >
                          {row.name}
                        </Link>
                        {!row.isActive && (
                          <Badge variant="neutral" className="ml-2">
                            Hidden
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-data text-xs text-ink-500">{row.sku || '-'}</TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {formatCurrency(Number(row.sellingPrice))}
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {formatCurrency(Number(row.costPerUnit))}
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        <span className={margin < 0 ? 'text-paprika-600' : 'text-moss-700'}>
                          {formatCurrency(margin)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {row.marginPercent === null ? '-' : `${Number(row.marginPercent).toFixed(1)}%`}
                      </TableCell>
                      <TableCell className="font-data text-xs text-ink-400">
                        v{row.costSheetVersion}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {uncosted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Not yet costed</CardTitle>
            <p className="mt-1 text-xs text-ink-500">
              Listed rather than hidden - an unknown margin is worth seeing, not omitting.
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-36 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uncosted.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm text-ink-800">{row.name}</TableCell>
                    <TableCell className="font-data text-xs text-ink-500">{row.sku || '-'}</TableCell>
                    <TableCell className="text-right font-data text-sm">
                      {formatCurrency(Number(row.price))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/products/${row.id}/costing`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Build cost sheet
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
