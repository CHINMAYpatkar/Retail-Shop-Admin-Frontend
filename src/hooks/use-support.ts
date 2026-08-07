'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { PaginatedResponse, SupportTicket, TicketStatus } from '@/types/api';

export interface TicketsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TicketStatus;
}

export function useTickets(params: TicketsQueryParams) {
  return useQuery({
    queryKey: queryKeys.tickets(params),
    queryFn: async () =>
      unwrap<PaginatedResponse<SupportTicket>>(await api.get('/admin/support/tickets', { params })),
    placeholderData: (prev) => prev,
  });
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ticket(id || ''),
    queryFn: async () => unwrap<SupportTicket>(await api.get(`/admin/support/tickets/${id}`)),
    enabled: !!id,
    refetchInterval: 15_000,
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) =>
      unwrap<SupportTicket>(await api.post(`/admin/support/tickets/${id}/messages`, { message })),
    onSuccess: (_data, variables) => {
      toast.success('Reply sent');
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) =>
      unwrap<SupportTicket>(await api.patch(`/admin/support/tickets/${id}/status`, { status })),
    onSuccess: (_data, variables) => {
      toast.success('Ticket status updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
