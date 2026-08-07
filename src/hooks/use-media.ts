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

interface PresignResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export function useMediaAssets(params: MediaQueryParams) {
  return useQuery({
    queryKey: queryKeys.media(params),
    queryFn: async () => unwrap<PaginatedResponse<MediaAsset>>(await api.get('/admin/media', { params })),
    placeholderData: (prev) => prev,
  });
}

/** Registers a media asset the admin already has a URL for (no S3 upload needed). */
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

/** Full presign -> PUT to S3 -> record flow. Requires real AWS credentials on the backend. */
export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      const { uploadUrl, publicUrl, key } = unwrap<PresignResponse>(
        await api.post('/admin/uploads/presign', { fileName: file.name, contentType: file.type, folder }),
      );

      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });

      const type: MediaType = file.type.startsWith('video') ? 'VIDEO' : file.type.startsWith('image') ? 'IMAGE' : 'DOCUMENT';

      return unwrap<MediaAsset>(
        await api.post('/admin/media', {
          fileName: file.name,
          url: publicUrl,
          type,
          folder,
          sizeBytes: file.size,
          key,
        }),
      );
    },
    onSuccess: () => {
      toast.success('File uploaded');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

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
