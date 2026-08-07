'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { FaqItem } from '@/types/api';
import type { FaqFormValues } from '@/lib/validations/faq.schema';

export function useFaqs() {
  return useQuery({
    queryKey: queryKeys.faqs,
    queryFn: async () => unwrap<FaqItem[]>(await api.get('/admin/faqs')),
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: FaqFormValues) => unwrap<FaqItem>(await api.post('/admin/faqs', values)),
    onSuccess: () => {
      toast.success('FAQ created');
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<FaqFormValues> }) =>
      unwrap<FaqItem>(await api.patch(`/admin/faqs/${id}`, values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/faqs/${id}`),
    onSuccess: () => {
      toast.success('FAQ deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
