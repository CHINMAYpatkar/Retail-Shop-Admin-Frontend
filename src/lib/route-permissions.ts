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
  { prefix: '/margins', permission: 'costing.view', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/expenses', permission: 'expenses.view', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/refunds', permission: 'refunds.view', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/reports', permission: 'reports.view', roles: ['SUPER_ADMIN', 'ADMIN'] },
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

  // The backend's DashboardController is @Roles(SUPER_ADMIN, ADMIN, MANAGER).
  // Without this rule a STAFF account could navigate to /dashboard and then
  // watch its data call fail with a 403 - the frontend must mirror the API.
  { prefix: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
];

export function findRouteRule(pathname: string): RoutePermissionRule | undefined {
  return ROUTE_PERMISSIONS.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`));
}

/** Whether an admin satisfies a route's rule. Used by the guard and the landing logic. */
export function canAccessRoute(
  pathname: string,
  admin: { roleName: AdminRoleName; permissions: string[] } | null,
): boolean {
  const rule = findRouteRule(pathname);
  if (!rule) return true; // unlisted routes are open to any authenticated admin
  if (!admin) return false;

  const permissionOk = !rule.permission || admin.permissions.includes(rule.permission);
  const roleOk = !rule.roles || rule.roles.includes(admin.roleName);
  return permissionOk && roleOk;
}

/**
 * Preference order for where an admin lands. The first route they can actually
 * access wins.
 *
 * Derived from the rules above rather than hardcoded per role, so it cannot
 * drift when a role's permissions change. `/account` is last because every
 * authenticated admin can reach it - it guarantees this never returns nothing.
 */
const LANDING_CANDIDATES = ['/dashboard', '/orders', '/support', '/products', '/account'] as const;

/**
 * Where to send an admin after login, or when they hit a route they cannot see.
 *
 * Sending everyone to /dashboard was wrong: the backend restricts the dashboard
 * to MANAGER and above, so a STAFF account landed on a page whose only data
 * call returned 403.
 */
export function defaultRouteFor(
  admin: { roleName: AdminRoleName; permissions: string[] } | null,
): string {
  if (!admin) return '/login';
  return LANDING_CANDIDATES.find((route) => canAccessRoute(route, admin)) ?? '/account';
}
