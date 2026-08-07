'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { Blog } from '@/types/api';
import type { BlogFormValues } from '@/lib/validations/blog.schema';

export function useBlogs() {
  return useQuery({
    queryKey: queryKeys.blogs,
    queryFn: async () => unwrap<Blog[]>(await api.get('/admin/blogs')),
  });
}

export function useBlog(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blog(id || ''),
    queryFn: async () => unwrap<Blog>(await api.get(`/admin/blogs/${id}`)),
    enabled: !!id,
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: BlogFormValues) => unwrap<Blog>(await api.post('/admin/blogs', values)),
    onSuccess: () => {
      toast.success('Blog post created');
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<BlogFormValues> }) =>
      unwrap<Blog>(await api.patch(`/admin/blogs/${id}`, values)),
    onSuccess: (_data, variables) => {
      toast.success('Blog post updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.blog(variables.id) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/blogs/${id}`),
    onSuccess: () => {
      toast.success('Blog post deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.blogs });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
