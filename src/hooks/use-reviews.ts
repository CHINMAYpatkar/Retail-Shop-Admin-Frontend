'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { PaginatedResponse, Review, ReviewStatus } from '@/types/api';

export interface ReviewsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewStatus;
}

export function useReviews(params: ReviewsQueryParams) {
  return useQuery({
    queryKey: queryKeys.reviews(params),
    queryFn: async () => unwrap<PaginatedResponse<Review>>(await api.get('/admin/reviews', { params })),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewStatus }) =>
      unwrap<Review>(await api.patch(`/admin/reviews/${id}/status`, { status })),
    onSuccess: () => {
      toast.success('Review updated');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useReplyToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) =>
      unwrap<Review>(await api.patch(`/admin/reviews/${id}/reply`, { reply })),
    onSuccess: () => {
      toast.success('Reply posted');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => {
      toast.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
