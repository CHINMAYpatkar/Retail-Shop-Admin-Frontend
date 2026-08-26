'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { RawMaterialFormValues } from '@/lib/validations/raw-material.schema';
import type { PaginatedResponse, RawMaterial } from '@/types/api';

export interface RawMaterialsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  lowStockOnly?: boolean;
  ingredientId?: string;
}

export function useRawMaterials(params: RawMaterialsQueryParams) {
  return useQuery({
    queryKey: queryKeys.rawMaterials(params),
    queryFn: async () =>
      unwrap<PaginatedResponse<RawMaterial>>(await api.get('/admin/raw-materials', { params })),
    placeholderData: (prev) => prev,
  });
}

/**
 * Numeric fields are held as strings in the form and converted once here, so a
 * Decimal never round-trips through a JS float.
 */
function toPayload(values: RawMaterialFormValues) {
  const num = (v?: string) => (v && v.trim() ? Number(v) : undefined);
  const str = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  return {
    name: values.name.trim(),
    code: str(values.code),
    baseUnit: values.baseUnit,
    stockQuantity: num(values.stockQuantity),
    reorderLevel: num(values.reorderLevel),
    avgCostPerUnit: num(values.avgCostPerUnit),
    ingredientId: str(values.ingredientId),
    notes: str(values.notes),
    isActive: values.isActive,
  };
}

export function useCreateRawMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: RawMaterialFormValues) =>
      unwrap<RawMaterial>(await api.post('/admin/raw-materials', toPayload(values))),
    onSuccess: () => {
      toast.success('Raw material created');
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateRawMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RawMaterialFormValues }) =>
      unwrap<RawMaterial>(await api.patch(`/admin/raw-materials/${id}`, toPayload(values))),
    onSuccess: () => {
      toast.success('Raw material updated');
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
    // Includes the base-unit guard: changing the unit while stock exists is
    // refused, because the stored quantity was recorded in the old unit.
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteRawMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/raw-materials/${id}`),
    onSuccess: () => {
      toast.success('Raw material deleted');
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
