'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import type { MediaAsset, UploadFolder, UploadResult } from '@/types/api';

/**
 * Uploads a file to the API, then records it in the media library.
 *
 * Both steps, always: the library is meant to be a complete inventory of every
 * file we hold, which is what makes orphan cleanup possible later. Uploading
 * without recording would leave files on disk that nothing in the database
 * knows about.
 *
 * Replaces the old presign -> PUT-to-S3 -> record flow. Storage is local disk
 * now, so bytes go through the API (backend ADR 0008).
 */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: UploadFolder }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', folder);

      // The api client's request interceptor strips its default JSON
      // Content-Type for FormData, so the browser generates the multipart
      // boundary. Do not set the header here.
      const uploaded = unwrap<UploadResult>(await api.post('/admin/uploads', form));

      const asset = unwrap<MediaAsset>(
        await api.post('/admin/media', {
          fileName: uploaded.fileName,
          type: uploaded.mediaType,
          storageKey: uploaded.storageKey,
          folder,
          sizeBytes: uploaded.sizeBytes,
          mimeType: uploaded.mimeType,
        }),
      );

      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Human-readable size, for upload previews and the media grid. */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
