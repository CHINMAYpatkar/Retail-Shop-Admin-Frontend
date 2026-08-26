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

export interface SmtpStatus {
  configured: boolean;
  host?: string;
  from?: string;
}

/**
 * Reports whether SMTP verified at API boot.
 *
 * Worth surfacing because email is a hard dependency for customer access, not
 * a nice-to-have: customers log in with an emailed OTP, so if SMTP is down
 * nobody can sign in. Better to see that here than to learn it from a customer.
 */
export function useSmtpStatus() {
  return useQuery({
    queryKey: ['settings', 'smtp-status'],
    queryFn: async () => unwrap<SmtpStatus>(await api.get('/admin/settings/system/smtp-status')),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: async (to: string) =>
      unwrap<{ success: boolean; error?: string }>(
        await api.post('/admin/settings/system/test-email', { to }),
      ),
    onSuccess: (result) => {
      // The endpoint reports delivery failure in the payload rather than
      // throwing, so a 200 is not on its own proof the mail was sent.
      if (result.success) toast.success('Test email sent - check the inbox');
      else toast.error(result.error || 'Test email could not be sent');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
