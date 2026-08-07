'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { Banner } from '@/types/api';
import type { BannerFormValues } from '@/lib/validations/banner.schema';

export function useBanners() {
  return useQuery({
    queryKey: queryKeys.banners,
    queryFn: async () => unwrap<Banner[]>(await api.get('/admin/banners')),
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: BannerFormValues) => unwrap<Banner>(await api.post('/admin/banners', values)),
    onSuccess: () => {
      toast.success('Banner created');
      queryClient.invalidateQueries({ queryKey: queryKeys.banners });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<BannerFormValues> }) =>
      unwrap<Banner>(await api.patch(`/admin/banners/${id}`, values)),
    onSuccess: () => {
      toast.success('Banner updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.banners });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/banners/${id}`),
    onSuccess: () => {
      toast.success('Banner deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.banners });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
