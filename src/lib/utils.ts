import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDate(date: string | Date, withTime = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(d);
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

interface ApiErrorPayload {
  message?: string | string[];
  statusCode?: number;
}

interface ApiErrorLike {
  message?: string;
  response?: { data?: ApiErrorPayload };
}

/**
 * Extracts a human-readable message from any API error shape.
 * Our backend's global exception filter always returns { message }
 * (string or string[] for validation errors) - this normalizes both,
 * plus network/unknown errors, into a single display string.
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as ApiErrorLike;
    const data = err.response?.data;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    if (err.message === 'Network Error') {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    if (typeof err.message === 'string' && err.message.length > 0) return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function slugPreview(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}
