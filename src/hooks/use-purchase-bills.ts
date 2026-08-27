'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { PurchaseBillFormValues } from '@/lib/validations/purchase-bill.schema';
import type { PaginatedResponse, PurchaseBill } from '@/types/api';

export interface PurchaseBillsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
}

export function usePurchaseBills(params: PurchaseBillsQueryParams) {
  return useQuery({
    queryKey: queryKeys.purchaseBills(params),
    queryFn: async () =>
      unwrap<PaginatedResponse<PurchaseBill>>(await api.get('/admin/purchase-bills', { params })),
    placeholderData: (prev) => prev,
  });
}

export function usePurchaseBill(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.purchaseBill(id ?? ''),
    queryFn: async () => unwrap<PurchaseBill>(await api.get(`/admin/purchase-bills/${id}`)),
    enabled: Boolean(id),
  });
}

/**
 * Note there is no subtotal or total in the payload: the API computes both from
 * the line items and rejects a request that tries to supply them.
 */
function toPayload(values: PurchaseBillFormValues) {
  const num = (v?: string) => (v && v.trim() ? Number(v) : undefined);
  const str = (v?: string) => (v && v.trim() ? v.trim() : undefined);

  return {
    vendorId: values.vendorId,
    billNumber: values.billNumber.trim(),
    billDate: new Date(values.billDate).toISOString(),
    dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
    discountAmount: num(values.discountAmount) ?? 0,
    attachmentMediaId: str(values.attachmentMediaId),
    notes: str(values.notes),
    items: values.items.map((item) => ({
      rawMaterialId: item.rawMaterialId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      notes: str(item.notes),
    })),
  };
}

/** Recording a bill moves raw-material stock, so material queries are invalidated too. */
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['purchase-bills'] });
  queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
}

export function useCreatePurchaseBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: PurchaseBillFormValues) =>
      unwrap<PurchaseBill>(await api.post('/admin/purchase-bills', toPayload(values))),
    onSuccess: () => {
      toast.success('Purchase bill recorded — stock updated');
      invalidateAll(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdatePurchaseBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: PurchaseBillFormValues }) =>
      unwrap<PurchaseBill>(await api.patch(`/admin/purchase-bills/${id}`, toPayload(values))),
    onSuccess: () => {
      toast.success('Purchase bill updated — stock and cost recalculated');
      invalidateAll(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeletePurchaseBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/purchase-bills/${id}`),
    onSuccess: () => {
      toast.success('Purchase bill deleted — stock reversed');
      invalidateAll(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
