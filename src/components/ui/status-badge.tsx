import { Badge } from './badge';
import type { OrderItemStatus, OrderStatus, ReviewStatus } from '@/types/api';

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; variant: 'neutral' | 'gold' | 'moss' | 'paprika' | 'clove' }> = {
  PLACED: { label: 'Placed', variant: 'clove' },
  CONFIRMED: { label: 'Confirmed', variant: 'clove' },
  PROCESSING: { label: 'Processing', variant: 'gold' },
  AWAITING_STOCK: { label: 'Awaiting stock', variant: 'paprika' },
  PACKED: { label: 'Packed', variant: 'gold' },
  SHIPPED: { label: 'Shipped', variant: 'gold' },
  PARTIALLY_SHIPPED: { label: 'Partly shipped', variant: 'paprika' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', variant: 'gold' },
  DELIVERED: { label: 'Delivered', variant: 'moss' },
  CANCELLED: { label: 'Cancelled', variant: 'paprika' },
  RETURNED: { label: 'Returned', variant: 'paprika' },
  REFUNDED: { label: 'Refunded', variant: 'neutral' },
};

const REVIEW_STATUS_MAP: Record<ReviewStatus, { label: string; variant: 'neutral' | 'gold' | 'moss' | 'paprika' }> = {
  PENDING: { label: 'Pending', variant: 'gold' },
  APPROVED: { label: 'Approved', variant: 'moss' },
  REJECTED: { label: 'Rejected', variant: 'paprika' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = ORDER_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

/**
 * A line's own status.
 *
 * Only rendered when it differs from "nothing special" - a PENDING badge on
 * every row of every ordinary order would be noise that trains people to stop
 * reading the column.
 */
const ITEM_STATUS_MAP: Record<
  OrderItemStatus,
  { label: string; variant: 'neutral' | 'gold' | 'moss' | 'paprika' | 'clove' } | null
> = {
  PENDING: null,
  AWAITING_STOCK: { label: 'Awaiting stock', variant: 'paprika' },
  SHIPPED: { label: 'Shipped', variant: 'gold' },
  DELIVERED: { label: 'Delivered', variant: 'moss' },
};

export function OrderItemStatusBadge({ status }: { status: OrderItemStatus }) {
  const entry = ITEM_STATUS_MAP[status];
  if (!entry) return null;
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { label, variant } = REVIEW_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
