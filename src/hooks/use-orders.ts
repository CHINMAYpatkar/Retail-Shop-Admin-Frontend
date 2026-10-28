'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { Order, OrderStatus, PaginatedResponse } from '@/types/api';

export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
}

export function useOrders(params: OrdersQueryParams) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: async () => unwrap<PaginatedResponse<Order>>(await api.get('/admin/orders', { params })),
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order(id || ''),
    queryFn: async () => unwrap<Order>(await api.get(`/admin/orders/${id}`)),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      unwrap<Order>(await api.patch(`/admin/orders/${id}/status`, { status, note })),
    onSuccess: (data, variables) => {
      // Report where the order LANDED, not what was asked for. A split order
      // asked to ship becomes PARTIALLY_SHIPPED, and a toast saying "marked as
      // shipped" would be the only thing on screen claiming otherwise.
      const landed = (data?.status ?? variables.status).replace(/_/g, ' ').toLowerCase();
      toast.success(`Order marked as ${landed}`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Mark one line of an order out of stock, or available again.
 *
 * Deliberately a separate mutation from the status change: this reschedules an
 * order rather than advancing it, and the two have different failure modes
 * worth reporting separately.
 */
export function useSetItemAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      itemId,
      ...body
    }: {
      orderId: string;
      itemId: string;
      available: boolean;
      expectedAvailabilityDate?: string;
      availabilityNote?: string;
      holdForStock?: boolean;
    }) =>
      unwrap<Order>(
        await api.patch(`/admin/orders/${orderId}/items/${itemId}/availability`, body),
      ),
    onSuccess: (data, variables) => {
      toast.success(
        variables.available
          ? 'Item marked available - the customer has been told'
          : 'Customer notified of the delay',
      );
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(variables.orderId) });
      void data;
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
