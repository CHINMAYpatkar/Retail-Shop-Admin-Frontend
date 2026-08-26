'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { PaginatedResponse, Product } from '@/types/api';
import type { ProductFormValues } from '@/lib/validations/product.schema';

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  /** Include soft-deleted products. Admin-only; the storefront never sees them. */
  includeDeleted?: boolean;
}

export function useProducts(params: ProductsQueryParams) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: async () =>
      unwrap<PaginatedResponse<Product>>(await api.get('/admin/products', { params })),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.product(id || ''),
    queryFn: async () => unwrap<Product>(await api.get(`/admin/products/${id}`)),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ProductFormValues) => unwrap<Product>(await api.post('/admin/products', values)),
    onSuccess: () => {
      toast.success('Product created');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ProductFormValues> }) =>
      unwrap<Product>(await api.patch(`/admin/products/${id}`, values)),
    onSuccess: (_data, variables) => {
      toast.success('Product updated');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.product(variables.id) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stockQuantity }: { id: string; stockQuantity: number }) =>
      unwrap<Product>(await api.patch(`/admin/products/${id}/stock`, { stockQuantity })),
    onSuccess: () => {
      toast.success('Stock updated');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Undoes a soft delete. The backend refuses if the product's category was
 * removed in the meantime, since a product needs a category to be listed -
 * that error is surfaced to the admin as-is rather than being swallowed.
 */
export function useRestoreProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap<Product>(await api.patch(`/admin/products/${id}/restore`)),
    onSuccess: () => {
      toast.success('Product restored');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
