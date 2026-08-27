'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calculator, Plus, Trash2 } from 'lucide-react';
import { useProduct } from '@/hooks/use-products';
import { useCostSheets, useDeleteCostSheet } from '@/hooks/use-costing';
import { CostSheetBuilder } from '@/components/costing/cost-sheet-builder';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { unitShortLabel, type ProductCostSheet } from '@/types/api';

export default function ProductCostingPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const { data: product, isLoading: loadingProduct } = useProduct(productId);
  const { data: sheets, isLoading: loadingSheets } = useCostSheets(productId);
  const deleteSheet = useDeleteCostSheet();

  const [mode, setMode] = React.useState<'view' | 'new' | 'edit'>('view');
  const [editing, setEditing] = React.useState<ProductCostSheet | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<ProductCostSheet | undefined>();

  if (loadingProduct || loadingSheets) return <PageSpinner />;
  if (!product) return <EmptyState icon={Calculator} title="Product not found" />;

  const active = sheets?.find((s) => s.isActive);
  const price = Number(product.price);
  const activeMargin = active ? price - Number(active.costPerUnit) : null;

  return (
    <div>
      <PageHeader
        title={`Costing - ${product.name}`}
        description={`Selling price ${formatCurrency(price)}. What it costs to make, and the margin that leaves.`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/products/${productId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" /> Product
              </Button>
            </Link>
            {mode === 'view' && (
              <Button
                variant="gold"
                onClick={() => {
                  setEditing(undefined);
                  setMode('new');
                }}
              >
                <Plus className="h-4 w-4" /> New version
              </Button>
            )}
          </div>
        }
      />

      {mode !== 'view' ? (
        <>
          <div className="mb-4 rounded-md border border-clove-200 bg-clove-50 p-3 text-xs text-clove-800">
            {mode === 'edit'
              ? 'Correcting this version in place. To record a genuine cost change, cancel and create a new version instead - that keeps past margins answerable.'
              : 'Saving creates the next version and makes it active. The previous version is kept, so historical margins stay intact.'}
          </div>
          <CostSheetBuilder
            productId={productId!}
            sellingPrice={price}
            sheet={mode === 'edit' ? editing : undefined}
            onDone={() => {
              setMode('view');
              setEditing(undefined);
            }}
          />
        </>
      ) : !sheets?.length ? (
        <EmptyState
          icon={Calculator}
          title="No cost sheet yet"
          description="Add the raw materials and making costs for one batch, and the margin falls out of it."
          action={
            <Button variant="gold" onClick={() => setMode('new')}>
              <Plus className="h-4 w-4" /> Build cost sheet
            </Button>
          }
        />
      ) : (
        <>
          {active && activeMargin !== null && (
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-ink-500">Cost per unit</p>
                  <p className="mt-1 font-data text-xl text-ink-900">
                    {formatCurrency(Number(active.costPerUnit))}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">v{active.version} active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-ink-500">Selling price</p>
                  <p className="mt-1 font-data text-xl text-ink-900">{formatCurrency(price)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-ink-500">Margin</p>
                  <p
                    className={
                      activeMargin < 0
                        ? 'mt-1 font-data text-xl text-paprika-600'
                        : 'mt-1 font-data text-xl text-moss-700'
                    }
                  >
                    {formatCurrency(activeMargin)}
                    {price > 0 && (
                      <span className="ml-1 text-sm">
                        ({((activeMargin / price) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-ink-500">Batch</p>
                  <p className="mt-1 font-data text-xl text-ink-900">
                    {active.batchYieldQuantity} units
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    {formatCurrency(Number(active.totalBatchCost))} per batch
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {active && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Active sheet breakdown (v{active.version})</CardTitle>
                <p className="mt-1 text-xs text-ink-500">
                  Rates were frozen when this version was saved, so they do not move when a
                  material&apos;s average cost changes. A &quot;changed&quot; badge means the
                  material now costs something different - worth a new version.
                </p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate (frozen)</TableHead>
                      <TableHead className="text-right">Current avg</TableHead>
                      <TableHead className="text-right">Line cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {active.items.map((item) => {
                      const unit = item.rawMaterial ? unitShortLabel(item.rawMaterial.baseUnit) : '';
                      const drifted =
                        item.rawMaterial?.avgCostPerUnit != null &&
                        Number(item.rawMaterial.avgCostPerUnit) !== Number(item.ratePerUnit);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm text-ink-800">
                            {item.rawMaterial?.name}
                          </TableCell>
                          <TableCell className="text-right font-data text-sm">
                            {item.quantity} {unit}
                          </TableCell>
                          <TableCell className="text-right font-data text-sm">
                            {item.ratePerUnit}
                          </TableCell>
                          <TableCell className="text-right font-data text-xs">
                            {item.rawMaterial?.avgCostPerUnit ?? '-'}
                            {drifted && (
                              <Badge variant="gold" className="ml-1.5">
                                changed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-data text-sm">
                            {formatCurrency(Number(item.lineCost))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Versions</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Effective from</TableHead>
                    <TableHead className="text-right">Batch cost</TableHead>
                    <TableHead className="text-right">Yield</TableHead>
                    <TableHead className="text-right">Cost / unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheets.map((sheet) => (
                    <TableRow key={sheet.id}>
                      <TableCell className="font-data text-sm">v{sheet.version}</TableCell>
                      <TableCell className="font-data text-xs text-ink-500">
                        {sheet.effectiveFrom.slice(0, 10)}
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {formatCurrency(Number(sheet.totalBatchCost))}
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {sheet.batchYieldQuantity}
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {formatCurrency(Number(sheet.costPerUnit))}
                      </TableCell>
                      <TableCell>
                        {sheet.isActive ? (
                          <Badge variant="moss">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Superseded</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setEditing(sheet);
                            setMode('edit');
                          }}
                        >
                          Correct
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(sheet)}
                          aria-label="Delete version"
                        >
                          <Trash2 className="h-4 w-4 text-paprika-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title={`Delete cost sheet v${deleteTarget?.version}?`}
        description="If this was the active version, the most recent remaining one becomes active again. Orders already placed keep the cost captured at the time, so past margins are unaffected."
        confirmLabel="Delete"
        destructive
        loading={deleteSheet.isPending}
        onConfirm={() => {
          if (deleteTarget)
            deleteSheet.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
