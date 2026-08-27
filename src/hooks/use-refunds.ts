'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { RefundFormValues } from '@/lib/validations/refund.schema';
import type { Refund, RefundStatus, RefundsResponse } from '@/types/api';

export interface RefundsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: RefundStatus;
  orderId?: string;
}

export function useRefunds(params: RefundsQueryParams) {
  return useQuery({
    queryKey: queryKeys.refunds(params),
    queryFn: async () => unwrap<RefundsResponse>(await api.get('/admin/refunds', { params })),
    placeholderData: (prev) => prev,
  });
}

/** Refunds for one order, for the panel on the order detail page. */
export function useOrderRefunds(orderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orderRefunds(orderId ?? ''),
    queryFn: async () => unwrap<Refund[]>(await api.get(`/admin/orders/${orderId}/refunds`)),
    enabled: Boolean(orderId),
  });
}

function toPayload(values: RefundFormValues) {
  const str = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  return {
    amount: Number(values.amount),
    reason: values.reason.trim(),
    method: values.method,
    status: values.status,
    referenceNo: str(values.referenceNo),
    refundedOn: values.refundedOn ? new Date(values.refundedOn).toISOString() : undefined,
    notes: str(values.notes),
  };
}

/**
 * A refund changes the order's payment status and every revenue figure, so
 * orders, dashboard and reports are all invalidated alongside refunds.
 */
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['refunds'] });
  queryClient.invalidateQueries({ queryKey: ['order-refunds'] });
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['reports'] });
}

export function useCreateRefund(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: RefundFormValues) =>
      unwrap<Refund>(await api.post(`/admin/orders/${orderId}/refunds`, toPayload(values))),
    onSuccess: (refund) => {
      toast.success(
        refund.status === 'COMPLETED'
          ? 'Refund recorded as sent'
          : 'Refund recorded as pending - mark it sent once the money goes',
      );
      invalidate(queryClient);
    },
    // The API refuses a refund larger than the order allows, and refuses one on
    // an order that has not been delivered; surface those messages verbatim.
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RefundFormValues }) =>
      unwrap<Refund>(await api.patch(`/admin/refunds/${id}`, toPayload(values))),
    onSuccess: () => {
      toast.success('Refund updated');
      invalidate(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Marks a pending refund as sent. Separate from the full update because it is
 * the single action this screen exists to make easy.
 */
export function useMarkRefundSent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, referenceNo }: { id: string; referenceNo?: string }) =>
      unwrap<Refund>(
        await api.patch(`/admin/refunds/${id}`, {
          status: 'COMPLETED',
          ...(referenceNo ? { referenceNo } : {}),
        }),
      ),
    onSuccess: () => {
      toast.success('Marked as sent');
      invalidate(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Note: there is deliberately no delete hook. Refunds are financial records; a
// mistake is corrected with a FAILED status, not by removing history.
