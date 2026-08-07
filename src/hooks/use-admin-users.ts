'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { AdminUserRecord } from '@/types/api';
import type {
  CreateAdminUserFormValues,
  UpdateAdminUserFormValues,
} from '@/lib/validations/admin-user.schema';

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: async () => unwrap<AdminUserRecord[]>(await api.get('/admin/users')),
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: CreateAdminUserFormValues) =>
      unwrap<AdminUserRecord>(await api.post('/admin/users', values)),
    onSuccess: () => {
      toast.success('Admin user created');
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateAdminUserFormValues }) =>
      unwrap<AdminUserRecord>(await api.patch(`/admin/users/${id}`, values)),
    onSuccess: () => {
      toast.success('Admin user updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('Admin user deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
