/**
 * Maps dashboard route prefixes to the access rule required to view them.
 * A rule can require a specific permission key, restrict to certain roles,
 * or both. Routes not listed here (e.g. /dashboard, /account, /media,
 * /support) are open to any authenticated admin - which mirrors the backend
 * exactly: MediaController and SupportAdminController only use RolesGuard
 * with all four roles allowed, so there's no narrower permission to enforce
 * on the frontend either. Everything else is locked down by the same
 * permission keys the backend seeds and enforces server-side, so the
 * frontend and API can never disagree about who can see what.
 */
import type { AdminRoleName } from '@/types/api';

export interface RoutePermissionRule {
  prefix: string;
  permission?: string;
  roles?: AdminRoleName[];
}

export const ROUTE_PERMISSIONS: RoutePermissionRule[] = [
  { prefix: '/products', permission: 'products.view' },
  { prefix: '/categories', permission: 'categories.view' },
  { prefix: '/ingredients', permission: 'ingredients.view' },
  // Back office - role-restricted AND permission-gated, matching the backend
  // controllers which apply @Roles(SUPER_ADMIN, ADMIN) as well as the key.
  { prefix: '/vendors', permission: 'vendors.view', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/raw-materials', permission: 'raw-materials.view', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/purchase-bills', permission: 'purchase-bills.view', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/vendor-payments', permission: 'vendor-payments.view', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/orders', permission: 'orders.view' },
  { prefix: '/reviews', permission: 'reviews.view' },
  { prefix: '/customers', permission: 'customers.view' },
  { prefix: '/admin-users', permission: 'users.view' },
  { prefix: '/roles', permission: 'roles.view' },
  { prefix: '/recipes', permission: 'recipes.view' },
  { prefix: '/banners', permission: 'banners.view' },
  { prefix: '/cms-pages', permission: 'cms.view' },
  { prefix: '/blogs', permission: 'blogs.view' },
  { prefix: '/faqs', permission: 'faqs.view' },
  { prefix: '/settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export function findRouteRule(pathname: string): RoutePermissionRule | undefined {
  return ROUTE_PERMISSIONS.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`));
}
