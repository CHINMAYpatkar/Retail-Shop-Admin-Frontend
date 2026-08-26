import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getStoredRefreshToken, useAuthStore } from '@/store/auth-store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // FormData must NOT carry the instance's default `application/json`.
  // A multipart body is only parseable with a boundary, and the browser only
  // generates one when Content-Type is left unset. With the header forced to
  // JSON the server cannot parse the body at all: multer finds no file, and the
  // `file` field falls through to the validation pipe, which rejects it as
  // "property file should not exist" - an error that points nowhere near the
  // real cause. Deleting the header here fixes every multipart call at once.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<ApiEnvelope<TokenPair>>(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/admin/refresh`,
      { refreshToken },
    );
    const { accessToken, refreshToken: newRefreshToken } = data.data;
    const admin = useAuthStore.getState().admin;
    if (admin) {
      useAuthStore.getState().setSession(admin, accessToken, newRefreshToken);
    } else {
      useAuthStore.getState().setAccessToken(accessToken);
    }
    return accessToken;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthRoute = originalRequest?.url?.includes('/auth/admin/');
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      // Coalesce concurrent 401s into a single refresh call.
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

/** Backend wraps every response as { success, data }; this unwraps consistently. */
export function unwrap<T>(response: { data: ApiEnvelope<T> | T }): T {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}
