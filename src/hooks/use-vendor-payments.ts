'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { VendorPaymentFormValues } from '@/lib/validations/vendor-payment.schema';
import type { PaginatedResponse, VendorLedger, VendorPayment } from '@/types/api';

export interface VendorPaymentsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vendorId?: string;
  purchaseBillId?: string;
  onAccountOnly?: boolean;
}

export function useVendorPayments(params: VendorPaymentsQueryParams) {
  return useQuery({
    queryKey: queryKeys.vendorPayments(params),
    queryFn: async () =>
      unwrap<PaginatedResponse<VendorPayment>>(await api.get('/admin/vendor-payments', { params })),
    placeholderData: (prev) => prev,
  });
}

export function useVendorLedger(vendorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vendorLedger(vendorId ?? ''),
    queryFn: async () => unwrap<VendorLedger>(await api.get(`/admin/vendors/${vendorId}/ledger`)),
    enabled: Boolean(vendorId),
  });
}

function toPayload(values: VendorPaymentFormValues) {
  const str = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  return {
    vendorId: values.vendorId,
    // Omitted entirely when blank - that is what makes it an on-account payment.
    purchaseBillId: str(values.purchaseBillId),
    amount: Number(values.amount),
    paidOn: new Date(values.paidOn).toISOString(),
    method: values.method,
    referenceNo: str(values.referenceNo),
    notes: str(values.notes),
  };
}

/** A payment changes a bill's derived status and the vendor ledger, so both are invalidated. */
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['vendor-payments'] });
  queryClient.invalidateQueries({ queryKey: ['purchase-bills'] });
  queryClient.invalidateQueries({ queryKey: ['vendor-ledger'] });
}

export function useCreateVendorPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: VendorPaymentFormValues) =>
      unwrap<VendorPayment>(await api.post('/admin/vendor-payments', toPayload(values))),
    onSuccess: () => {
      toast.success('Payment recorded');
      invalidateAll(queryClient);
    },
    // The API refuses a payment larger than the bill's outstanding amount and
    // says so; surface that message rather than a generic failure.
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateVendorPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: VendorPaymentFormValues }) =>
      unwrap<VendorPayment>(await api.patch(`/admin/vendor-payments/${id}`, toPayload(values))),
    onSuccess: () => {
      toast.success('Payment updated');
      invalidateAll(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteVendorPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/vendor-payments/${id}`),
    onSuccess: () => {
      toast.success('Payment deleted');
      invalidateAll(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
