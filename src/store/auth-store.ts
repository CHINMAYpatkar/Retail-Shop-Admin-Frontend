import { create } from 'zustand';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleName: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF';
  permissions: string[];
}

interface AuthState {
  admin: AdminUser | null;
  accessToken: string | null;
  /** true once we've attempted to restore a session from localStorage on boot */
  isHydrated: boolean;
  setSession: (admin: AdminUser, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setHydrated: () => void;
  clear: () => void;
  hasPermission: (permission: string) => boolean;
}

const REFRESH_TOKEN_KEY = 'rs_admin_refresh_token';

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

const storeRefreshToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  accessToken: null,
  isHydrated: false,

  setSession: (admin, accessToken, refreshToken) => {
    storeRefreshToken(refreshToken);
    set({ admin, accessToken });
  },

  setAccessToken: (accessToken) => set({ accessToken }),

  setHydrated: () => set({ isHydrated: true }),

  clear: () => {
    storeRefreshToken(null);
    set({ admin: null, accessToken: null });
  },

  hasPermission: (permission) => {
    const admin = get().admin;
    if (!admin) return false;
    if (admin.roleName === 'SUPER_ADMIN') return true;
    return admin.permissions.includes(permission);
  },
}));
