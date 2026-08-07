'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';

/**
 * Settings are stored as arbitrary JSON per key on the backend (Setting.value: Json).
 * GET /admin/settings returns the full { [key]: value } map in one call, which is
 * what every settings section in the UI reads from - this avoids one request per
 * section and keeps all of them in sync after any single save.
 */
export function useAllSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => unwrap<Record<string, unknown>>(await api.get('/admin/settings')),
  });
}

export function useUpsertSetting<T>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: T }) =>
      unwrap<{ key: string; value: T }>(await api.put(`/admin/settings/${key}`, { value })),
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
