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
    onSuccess: (_data, variables) => {
      toast.success(`Order marked as ${variables.status.replace(/_/g, ' ').toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
