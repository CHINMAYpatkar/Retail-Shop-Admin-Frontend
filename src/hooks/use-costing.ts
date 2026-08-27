'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { CostSheetFormValues } from '@/lib/validations/cost-sheet.schema';
import type { MarginsReport, ProductCostSheet } from '@/types/api';

/** All versions for a product, newest first. */
export function useCostSheets(productId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.costSheets(productId ?? ''),
    queryFn: async () =>
      unwrap<ProductCostSheet[]>(await api.get(`/admin/products/${productId}/cost-sheets`)),
    enabled: Boolean(productId),
  });
}

export function useMargins() {
  return useQuery({
    queryKey: queryKeys.margins,
    queryFn: async () => unwrap<MarginsReport>(await api.get('/admin/costing/margins')),
  });
}

/**
 * Note the payload carries no materialCost, totalBatchCost or costPerUnit: all
 * three are computed server-side, and sending them is rejected outright.
 */
function toPayload(values: CostSheetFormValues) {
  const num = (v?: string) => (v && v.trim() ? Number(v) : undefined);
  const str = (v?: string) => (v && v.trim() ? v.trim() : undefined);

  return {
    batchYieldQuantity: Number(values.batchYieldQuantity),
    labourCost: num(values.labourCost) ?? 0,
    packagingCost: num(values.packagingCost) ?? 0,
    overheadCost: num(values.overheadCost) ?? 0,
    otherCost: num(values.otherCost) ?? 0,
    effectiveFrom: values.effectiveFrom ? new Date(values.effectiveFrom).toISOString() : undefined,
    notes: str(values.notes),
    items: values.items.map((item) => ({
      rawMaterialId: item.rawMaterialId,
      quantity: Number(item.quantity),
      // Omitted when blank, so the API falls back to the material's current
      // average cost and freezes that onto the sheet.
      ratePerUnit: num(item.ratePerUnit),
      notes: str(item.notes),
    })),
  };
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['cost-sheets'] });
  queryClient.invalidateQueries({ queryKey: ['margins'] });
}

/** Creates the next version and deactivates the previous one. */
export function useCreateCostSheet(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: CostSheetFormValues) =>
      unwrap<ProductCostSheet>(
        await api.post(`/admin/products/${productId}/cost-sheets`, toPayload(values)),
      ),
    onSuccess: (sheet) => {
      toast.success(`Cost sheet v${sheet.version} saved and set active`);
      invalidateAll(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Corrects a sheet in place - use a new version to record a genuine cost change. */
export function useUpdateCostSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CostSheetFormValues }) =>
      unwrap<ProductCostSheet>(await api.patch(`/admin/cost-sheets/${id}`, toPayload(values))),
    onSuccess: () => {
      toast.success('Cost sheet updated');
      invalidateAll(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCostSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/cost-sheets/${id}`),
    onSuccess: () => {
      toast.success('Cost sheet deleted');
      invalidateAll(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
