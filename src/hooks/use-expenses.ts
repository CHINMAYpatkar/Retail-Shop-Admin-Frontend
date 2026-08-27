'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { ExpenseFormValues } from '@/lib/validations/expense.schema';
import type { Expense, ExpenseCategory, ExpensesResponse, PaymentMode } from '@/types/api';

export interface ExpensesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: ExpenseCategory;
  method?: PaymentMode;
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
}

export function useExpenses(params: ExpensesQueryParams) {
  return useQuery({
    queryKey: queryKeys.expenses(params),
    queryFn: async () => unwrap<ExpensesResponse>(await api.get('/admin/expenses', { params })),
    placeholderData: (prev) => prev,
  });
}

function toPayload(values: ExpenseFormValues) {
  const str = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  return {
    category: values.category,
    title: values.title.trim(),
    amount: Number(values.amount),
    spentOn: new Date(values.spentOn).toISOString(),
    method: values.method,
    vendorId: str(values.vendorId),
    attachmentMediaId: str(values.attachmentMediaId),
    notes: str(values.notes),
  };
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['expenses'] });
  // Expenses feed the P&L, so any report view is now stale.
  queryClient.invalidateQueries({ queryKey: ['reports'] });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ExpenseFormValues) =>
      unwrap<Expense>(await api.post('/admin/expenses', toPayload(values))),
    onSuccess: () => {
      toast.success('Expense recorded');
      invalidate(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ExpenseFormValues }) =>
      unwrap<Expense>(await api.patch(`/admin/expenses/${id}`, toPayload(values))),
    onSuccess: () => {
      toast.success('Expense updated');
      invalidate(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense deleted');
      invalidate(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
