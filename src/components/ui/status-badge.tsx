import { Badge } from './badge';
import type { OrderStatus, ReviewStatus } from '@/types/api';

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; variant: 'neutral' | 'gold' | 'moss' | 'paprika' | 'clove' }> = {
  PLACED: { label: 'Placed', variant: 'clove' },
  CONFIRMED: { label: 'Confirmed', variant: 'clove' },
  PROCESSING: { label: 'Processing', variant: 'gold' },
  PACKED: { label: 'Packed', variant: 'gold' },
  SHIPPED: { label: 'Shipped', variant: 'gold' },
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

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { label, variant } = REVIEW_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
