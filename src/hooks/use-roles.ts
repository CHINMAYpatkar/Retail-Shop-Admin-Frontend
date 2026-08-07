'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { Permission, Role } from '@/types/api';
import type { RoleFormValues } from '@/lib/validations/role.schema';

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: async () => unwrap<Role[]>(await api.get('/admin/roles')),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.permissions,
    queryFn: async () => unwrap<Permission[]>(await api.get('/admin/permissions')),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: RoleFormValues) => unwrap<Role>(await api.post('/admin/roles', values)),
    onSuccess: () => {
      toast.success('Role created');
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<RoleFormValues> }) =>
      unwrap<Role>(await api.patch(`/admin/roles/${id}`, values)),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/roles/${id}`),
    onSuccess: () => {
      toast.success('Role deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
