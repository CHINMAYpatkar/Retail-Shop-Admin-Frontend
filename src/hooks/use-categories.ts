'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { Category } from '@/types/api';
import type { CategoryFormValues } from '@/lib/validations/category.schema';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => unwrap<Category[]>(await api.get('/admin/categories')),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: CategoryFormValues) => unwrap<Category>(await api.post('/admin/categories', values)),
    onSuccess: () => {
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<CategoryFormValues> }) =>
      unwrap<Category>(await api.patch(`/admin/categories/${id}`, values)),
    onSuccess: () => {
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
