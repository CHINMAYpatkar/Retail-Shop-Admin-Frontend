'use client';

import * as React from 'react';
import { TriangleAlert, BarChart3 } from 'lucide-react';
import {
  useProfitLoss,
  useVendorPayables,
  useStockValuation,
  usePurchaseSummary,
} from '@/hooks/use-reports';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { EXPENSE_CATEGORIES, unitShortLabel } from '@/types/api';

const categoryLabel = (v: string) => EXPENSE_CATEGORIES.find((c) => c.value === v)?.label ?? v;

/** A P&L line. `emphasis` marks the three figures worth reading first. */
function Line({
  label,
  value,
  hint,
  emphasis,
  negative,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? 'flex items-baseline justify-between border-t border-paper-200 pt-2'
          : 'flex items-baseline justify-between'
      }
    >
      <span className={emphasis ? 'text-sm font-medium text-ink-800' : 'text-sm text-ink-500'}>
        {label}
        {hint && <span className="ml-2 text-xs text-ink-400">{hint}</span>}
      </span>
      <span
        className={
          emphasis
            ? negative
              ? 'font-data text-lg font-semibold text-paprika-600'
              : 'font-data text-lg font-semibold text-ink-900'
            : 'font-data text-sm text-ink-700'
        }
      >
        {value}
      </span>
    </div>
  );
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const range = { fromDate: fromDate || undefined, toDate: toDate || undefined };

  const { data: pl, isLoading: loadingPl } = useProfitLoss(range);
  const { data: payables } = useVendorPayables();
  const { data: stock } = useStockValuation();
  const { data: purchases } = usePurchaseSummary(range);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Where the money went. Everything here is computed from what the other sections record."
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-3 pt-5">
          <FormField label="From" htmlFor="fromDate" className="w-44">
            <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </FormField>
          <FormField label="To" htmlFor="toDate" className="w-44">
            <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </FormField>
          {(fromDate || toDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
            >
              All time
            </Button>
          )}
          <p className="ml-auto text-xs text-ink-400">
            Applies to profit &amp; loss and purchases. Payables and stock are always as of now.
          </p>
        </CardContent>
      </Card>

      {loadingPl || !pl ? (
        <PageSpinner />
      ) : (
        <>
          {!pl.cost.coverage.complete && pl.cost.coverage.itemsTotal > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-gold-300 bg-gold-50 p-3 text-xs text-gold-900">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Cost data covers only {pl.cost.coverage.itemsWithCost} of{' '}
                {pl.cost.coverage.itemsTotal} sold items ({pl.cost.coverage.percent}%), so COGS is
                understated and <strong>profit below is optimistic</strong>. Build cost sheets for the
                remaining products to make these figures reliable.
              </span>
            </div>
          )}

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Profit &amp; loss
                </CardTitle>
                <p className="mt-1 text-xs text-ink-500">
                  Revenue counts delivered orders only - payment is collected on delivery.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <Line
                  label="Gross revenue"
                  hint={`${pl.revenue.orderCount} delivered`}
                  value={formatCurrency(Number(pl.revenue.grossRevenue))}
                />
                <Line
                  label="Less refunds sent"
                  value={`-${formatCurrency(Number(pl.revenue.refunds))}`}
                />
                <Line
                  label="Net revenue"
                  value={formatCurrency(Number(pl.revenue.netRevenue))}
                  emphasis
                />

                <div className="pt-2">
                  <Line
                    label="Less cost of goods sold"
                    hint={
                      pl.cost.coverage.percent !== null
                        ? `${pl.cost.coverage.percent}% costed`
                        : 'no cost data'
                    }
                    value={`-${formatCurrency(Number(pl.cost.cogs))}`}
                  />
                  <Line
                    label="Gross profit"
                    hint={
                      pl.profit.grossMarginPercent !== null
                        ? `${pl.profit.grossMarginPercent}%`
                        : undefined
                    }
                    value={formatCurrency(Number(pl.profit.grossProfit))}
                    emphasis
                    negative={Number(pl.profit.grossProfit) < 0}
                  />
                </div>

                <div className="pt-2">
                  <Line
                    label="Less expenses"
                    value={`-${formatCurrency(Number(pl.expenses.total))}`}
                  />
                  <Line
                    label="Net profit"
                    hint={
                      pl.profit.netMarginPercent !== null
                        ? `${pl.profit.netMarginPercent}%`
                        : undefined
                    }
                    value={formatCurrency(Number(pl.profit.netProfit))}
                    emphasis
                    negative={Number(pl.profit.netProfit) < 0}
                  />
                </div>

                {Number(pl.liabilities.pendingRefunds) > 0 && (
                  <p className="pt-2 text-xs text-gold-800">
                    {formatCurrency(Number(pl.liabilities.pendingRefunds))} of refunds are agreed but
                    not yet sent. Not deducted above - it is a liability, not money already gone.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expenses by category</CardTitle>
              </CardHeader>
              <CardContent>
                {pl.expenses.byCategory.length === 0 ? (
                  <p className="text-sm text-ink-500">No expenses in this period.</p>
                ) : (
                  <div className="space-y-2">
                    {pl.expenses.byCategory.map((row) => {
                      const share =
                        Number(pl.expenses.total) > 0
                          ? (Number(row.amount) / Number(pl.expenses.total)) * 100
                          : 0;
                      return (
                        <div key={row.category}>
                          <div className="flex justify-between text-sm">
                            <span className="text-ink-700">{categoryLabel(row.category)}</span>
                            <span className="font-data">{formatCurrency(Number(row.amount))}</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-paper-200">
                            <div className="h-full bg-gold-500" style={{ width: `${share}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {payables && payables.vendors.filter((v) => Number(v.outstanding) !== 0).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vendor payables</CardTitle>
            <p className="mt-1 text-xs text-ink-500">
              {formatCurrency(Number(payables.summary.totalOutstanding))} outstanding across{' '}
              {payables.summary.vendorsOwedCount} vendor(s).
              {Number(payables.summary.overdueOver60) > 0 && (
                <span className="text-paprika-700">
                  {' '}
                  {formatCurrency(Number(payables.summary.overdueOver60))} is more than 60 days
                  overdue.
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Not due</TableHead>
                  <TableHead className="text-right">1-30d</TableHead>
                  <TableHead className="text-right">31-60d</TableHead>
                  <TableHead className="text-right">60d+</TableHead>
                  <TableHead>Oldest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.vendors
                  .filter((v) => Number(v.outstanding) !== 0)
                  .map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="text-sm text-ink-800">{vendor.name}</TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {formatCurrency(Number(vendor.billed))}
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {formatCurrency(Number(vendor.paid))}
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        <span
                          className={
                            Number(vendor.outstanding) < 0 ? 'text-moss-700' : 'text-paprika-600'
                          }
                        >
                          {formatCurrency(Number(vendor.outstanding))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-data text-xs text-ink-500">
                        {Number(vendor.aging.current) > 0
                          ? formatCurrency(Number(vendor.aging.current))
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-data text-xs text-ink-500">
                        {Number(vendor.aging.upTo30) > 0
                          ? formatCurrency(Number(vendor.aging.upTo30))
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-data text-xs text-ink-500">
                        {Number(vendor.aging.upTo60) > 0
                          ? formatCurrency(Number(vendor.aging.upTo60))
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-data text-xs">
                        {Number(vendor.aging.over60) > 0 ? (
                          <span className="font-semibold text-paprika-600">
                            {formatCurrency(Number(vendor.aging.over60))}
                          </span>
                        ) : (
                          <span className="text-ink-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-data text-xs text-ink-500">
                        {vendor.oldestUnpaidDays !== null ? `${vendor.oldestUnpaidDays}d` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {stock && stock.materials.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Stock valuation</CardTitle>
            <p className="mt-1 text-xs text-ink-500">
              {formatCurrency(Number(stock.summary.totalValue))} across{' '}
              {stock.summary.materialCount} active material(s), at average cost.
              {stock.summary.unvaluedCount > 0 && (
                <span className="text-gold-800">
                  {' '}
                  {stock.summary.unvaluedCount} have no recorded cost and are excluded from the total
                  rather than counted as zero.
                </span>
              )}
              {stock.summary.lowStockCount > 0 && (
                <span className="text-paprika-700">
                  {' '}
                  {stock.summary.lowStockCount} low on stock.
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">In stock</TableHead>
                  <TableHead className="text-right">Cost / unit</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="text-sm text-ink-800">
                      {material.name}
                      {material.code && (
                        <span className="ml-2 font-data text-xs text-ink-400">{material.code}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-data text-sm">
                      {material.stockQuantity} {unitShortLabel(material.baseUnit)}
                    </TableCell>
                    <TableCell className="text-right font-data text-xs text-ink-600">
                      {material.avgCostPerUnit ?? '-'}
                    </TableCell>
                    <TableCell className="text-right font-data text-sm">
                      {material.stockValue === null ? (
                        <span className="text-ink-300">not valued</span>
                      ) : (
                        formatCurrency(Number(material.stockValue))
                      )}
                    </TableCell>
                    <TableCell>
                      {material.isLowStock && <Badge variant="paprika">Low</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {purchases && purchases.summary.billCount > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Purchase spend by vendor</CardTitle>
              <p className="mt-1 text-xs text-ink-500">
                {formatCurrency(Number(purchases.summary.totalSpend))} across{' '}
                {purchases.summary.billCount} bill(s).
              </p>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Bills</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.byVendor.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm text-ink-800">{row.name}</TableCell>
                      <TableCell className="text-right font-data text-xs text-ink-500">
                        {row.billCount}
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {formatCurrency(Number(row.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase spend by material</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.byMaterial.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm text-ink-800">{row.name}</TableCell>
                      <TableCell className="text-right font-data text-xs text-ink-500">
                        {row.quantity}
                      </TableCell>
                      <TableCell className="text-right font-data text-sm">
                        {formatCurrency(Number(row.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
