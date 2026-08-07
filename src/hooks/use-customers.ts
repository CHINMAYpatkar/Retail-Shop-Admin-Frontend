'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { Customer } from '@/types/api';

export interface CustomersQueryParams {
  page?: number;
  limit?: number;
}

export function useCustomers(params: CustomersQueryParams) {
  return useQuery({
    queryKey: queryKeys.customers(params),
    queryFn: async () => unwrap<Customer[]>(await api.get('/admin/customers', { params })),
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customer(id || ''),
    queryFn: async () => unwrap<Customer>(await api.get(`/admin/customers/${id}`)),
    enabled: !!id,
  });
}

export function useSetCustomerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      unwrap<Customer>(await api.patch(`/admin/customers/${id}/status`, { isActive })),
    onSuccess: () => {
      toast.success('Customer status updated');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
