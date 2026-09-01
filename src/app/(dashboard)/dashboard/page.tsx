'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import {
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  Star,
  LifeBuoy,
  TrendingUp,
} from 'lucide-react';
import { useDashboardSummary } from '@/hooks/use-dashboard';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSpinner } from '@/components/ui/spinner';
import { OrderStatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate } from '@/lib/utils';

const ORDER_STATUS_ORDER = ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  /** Small line under the value - the caveat or the definition. */
  hint?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gold-100 text-gold-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-500">{label}</p>
            <p className="font-data text-lg font-semibold text-ink-900">{value}</p>
            {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) return <PageSpinner />;

  const chartData = ORDER_STATUS_ORDER.map((status) => ({
    status: status.replace(/_/g, ' '),
    count: data.ordersByStatus[status] || 0,
  }));

  return (
    <div>
      <PageHeader title="Dashboard" description="Last 30 days at a glance" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Delivered value less completed refunds - matches the reports P&L.
            This card previously showed every non-cancelled order as "revenue",
            which on COD overstated money actually received. */}
        <StatCard
          icon={IndianRupee}
          label="Revenue (30d)"
          value={formatCurrency(Number(data.revenueLast30Days))}
          hint={
            Number(data.refundsLast30Days) > 0
              ? `after ${formatCurrency(Number(data.refundsLast30Days))} refunded`
              : 'delivered orders'
          }
          delay={0}
        />
        <StatCard
          icon={TrendingUp}
          label="Booked (30d)"
          value={formatCurrency(Number(data.bookedLast30Days))}
          hint="incl. not yet delivered"
          delay={0.02}
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders (30d)"
          value={String(data.ordersLast30Days)}
          hint={`${data.deliveredOrdersLast30Days} delivered`}
          delay={0.04}
        />
        <StatCard icon={Package} label="Active products" value={String(data.totalProducts)} delay={0.08} />
        <StatCard icon={Users} label="Customers" value={String(data.totalCustomers)} delay={0.12} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8791C" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#B8791C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#8B857A' }} interval={0} angle={-20} textAnchor="end" height={50} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: '#E8E3DA', fontSize: 12 }}
                  labelStyle={{ color: '#1C1A17', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="count" stroke="#B8791C" strokeWidth={2} fill="url(#goldFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/reviews?status=PENDING"
              className="flex items-center justify-between rounded-md border border-paper-200 px-3 py-2 text-sm hover:bg-paper-50"
            >
              <span className="flex items-center gap-2 text-ink-700">
                <Star className="h-4 w-4 text-gold-600" /> Pending reviews
              </span>
              <span className="font-data font-semibold text-ink-900">{data.pendingReviewCount}</span>
            </Link>
            <div className="flex items-center justify-between rounded-md border border-paper-200 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-ink-700">
                <LifeBuoy className="h-4 w-4 text-clove-600" /> Open tickets
              </span>
              <span className="font-data font-semibold text-ink-900">{data.openTicketCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-paper-200 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-ink-700">
                <AlertTriangle className="h-4 w-4 text-paprika-600" /> Low stock items
              </span>
              <span className="font-data font-semibold text-ink-900">{data.lowStockProducts.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest orders</CardTitle>
            <Link href="/orders" className="text-xs text-gold-700 hover:underline">
              View all
            </Link>
          </CardHeader>
          {data.latestOrders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.latestOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/orders/${order.id}`} className="font-data text-xs hover:text-gold-700">
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-ink-500">{order.customer?.name || order.customer?.email}</p>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-data">{formatCurrency(order.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <Link href="/products" className="text-xs text-gold-700 hover:underline">
              Manage products
            </Link>
          </CardHeader>
          {data.lowStockProducts.length === 0 ? (
            <EmptyState title="Everything is well stocked" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lowStockProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right font-data text-paprika-600">{p.stockQuantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
