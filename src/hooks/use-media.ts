'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { MediaAsset, MediaType, PaginatedResponse } from '@/types/api';

export interface MediaQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: MediaType;
  folder?: string;
}

export function useMediaAssets(params: MediaQueryParams) {
  return useQuery({
    queryKey: queryKeys.media(params),
    queryFn: async () => unwrap<PaginatedResponse<MediaAsset>>(await api.get('/admin/media', { params })),
    placeholderData: (prev) => prev,
  });
}

/** Registers an externally-hosted asset by URL - nothing is uploaded. */
export function useAddMediaByUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { fileName: string; url: string; type: MediaType; folder?: string }) =>
      unwrap<MediaAsset>(await api.post('/admin/media', payload)),
    onSuccess: () => {
      toast.success('Media added');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Uploads a file through the API and records it in the library.
 *
 * The previous implementation presigned an S3 PUT and uploaded straight to the
 * bucket. Storage is local disk now, so the bytes go through the API instead -
 * see useUploadFile, which this delegates to.
 */
export { useUploadFile as useUploadMedia } from './use-uploads';

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/media/${id}`),
    onSuccess: () => {
      toast.success('Media deleted');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
