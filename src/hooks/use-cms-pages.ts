'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { CmsPage } from '@/types/api';
import type { CmsPageFormValues } from '@/lib/validations/cms-page.schema';

export function useCmsPages() {
  return useQuery({
    queryKey: queryKeys.cmsPages,
    queryFn: async () => unwrap<CmsPage[]>(await api.get('/admin/cms/pages')),
  });
}

export function useUpsertCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: CmsPageFormValues) => unwrap<CmsPage>(await api.post('/admin/cms/pages', values)),
    onSuccess: () => {
      toast.success('Page saved');
      queryClient.invalidateQueries({ queryKey: queryKeys.cmsPages });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => api.delete(`/admin/cms/pages/${slug}`),
    onSuccess: () => {
      toast.success('Page deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.cmsPages });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
