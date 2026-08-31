'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { defaultRouteFor } from '@/lib/route-permissions';
import { getStoredRefreshToken, useAuthStore, type AdminUser } from '@/store/auth-store';
import type { AdminProfileResponse } from '@/types/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * The signed-in admin's profile and permissions, in one call.
 *
 * This used to fetch `/admin/users/:id` plus the full `/admin/roles` list.
 * Both are gated to SUPER_ADMIN/ADMIN at the ROLE level on the backend, so a
 * MANAGER or STAFF account got a 403 here and **could not log in at all** -
 * login succeeded, then the profile fetch failed and the session never
 * completed.
 *
 * `/auth/admin/me` needs only authentication, returns the flat permission list
 * directly, and avoids handing every admin the entire permission matrix just so
 * the client could find its own row.
 */
async function fetchAdminProfile(): Promise<AdminUser> {
  const profile = unwrap<AdminProfileResponse>(await api.get('/auth/admin/me'));

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    roleName: profile.role.name,
    permissions: profile.permissions,
  };
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { accessToken, refreshToken } = unwrap<TokenPair>(await api.post('/auth/admin/login', payload));

      // Temporarily set the access token so the profile call below is authenticated.
      useAuthStore.getState().setAccessToken(accessToken);
      const admin = await fetchAdminProfile();

      setSession(admin, accessToken, refreshToken);
      return admin;
    },
    onSuccess: (admin) => {
      toast.success(`Welcome back, ${admin.name.split(' ')[0]}`);
      // Role-aware: the dashboard is MANAGER and above on the backend, so a
      // STAFF account is sent somewhere it can actually use.
      router.push(defaultRouteFor(admin));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        await api.post('/auth/admin/logout', { refreshToken }).catch(() => undefined);
      }
    },
    onSettled: () => {
      clear();
      queryClient.clear();
      router.push('/login');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: { email: string }) =>
      unwrap<{ message: string }>(await api.post('/auth/admin/forgot-password', payload)),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: { email: string; code: string; newPassword: string }) =>
      unwrap<{ message: string }>(await api.post('/auth/admin/reset-password', payload)),
    onSuccess: () => {
      toast.success('Password reset. Please sign in with your new password.');
      router.push('/login');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Attempts to silently restore a session from the persisted refresh token on app boot. */
export async function restoreSession(): Promise<void> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    useAuthStore.getState().setHydrated();
    return;
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } = unwrap<TokenPair>(
      await api.post('/auth/admin/refresh', { refreshToken }),
    );
    useAuthStore.getState().setAccessToken(accessToken);
    const admin = await fetchAdminProfile();
    useAuthStore.getState().setSession(admin, accessToken, newRefreshToken);
  } catch {
    useAuthStore.getState().clear();
  } finally {
    useAuthStore.getState().setHydrated();
  }
}
