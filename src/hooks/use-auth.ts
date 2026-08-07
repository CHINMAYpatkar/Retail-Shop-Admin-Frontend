'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { getStoredRefreshToken, useAuthStore, type AdminUser } from '@/store/auth-store';
import type { AdminUserRecord, Role } from '@/types/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub: string;
  email?: string;
  exp?: number;
  iat?: number;
}

function decodeJwtSub(token: string): string {
  const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
  return payload.sub;
}

/**
 * The login/refresh response only carries tokens, not the admin's profile.
 * We decode `sub` (the admin id) from the access token, then fetch the
 * admin-user record plus the full roles list (which is where permissions
 * live) to assemble the AdminUser shape our store/UI need.
 */
async function fetchAdminProfile(adminId: string): Promise<AdminUser> {
  const user = unwrap<AdminUserRecord>(await api.get(`/admin/users/${adminId}`));
  const roles = unwrap<Role[]>(await api.get('/admin/roles'));
  const role = roles.find((r) => r.id === user.role.id);
  const permissions = role ? role.permissions.map((rp) => rp.permission.key) : [];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleName: user.role.name,
    permissions,
  };
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { accessToken, refreshToken } = unwrap<TokenPair>(await api.post('/auth/admin/login', payload));

      // Temporarily set the access token so the profile calls below are authenticated.
      useAuthStore.getState().setAccessToken(accessToken);
      const adminId = decodeJwtSub(accessToken);
      const admin = await fetchAdminProfile(adminId);

      setSession(admin, accessToken, refreshToken);
      return admin;
    },
    onSuccess: (admin) => {
      toast.success(`Welcome back, ${admin.name.split(' ')[0]}`);
      router.push('/dashboard');
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
    const adminId = decodeJwtSub(accessToken);
    const admin = await fetchAdminProfile(adminId);
    useAuthStore.getState().setSession(admin, accessToken, newRefreshToken);
  } catch {
    useAuthStore.getState().clear();
  } finally {
    useAuthStore.getState().setHydrated();
  }
}
