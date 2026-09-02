/**
 * Route access rules.
 *
 * This file is the frontend half of a contract with the backend guards, and the
 * failure it exists to prevent has happened twice:
 *
 *  - Sending every role to /dashboard after login, when the backend restricts
 *    the dashboard to MANAGER and above, so STAFF landed on a page whose only
 *    data call 403'd. That looked like "login is broken" to the user.
 *  - A rule going stale after a backend guard changed, leaving a role able to
 *    navigate somewhere every request then failed.
 *
 * The permission sets below mirror `prisma/seed.ts`. If a grant changes there,
 * these fixtures must change with it - which is the point.
 */
import { describe, expect, it } from 'vitest';
import { canAccessRoute, defaultRouteFor, findRouteRule, ROUTE_PERMISSIONS } from './route-permissions';
import type { AdminRoleName } from '@/types/api';

const MODULES_FULL = [
  'products', 'categories', 'ingredients', 'recipes', 'orders', 'customers',
  'reviews', 'banners', 'cms', 'blogs', 'faqs', 'media', 'support', 'settings',
  'users', 'roles', 'dashboard', 'vendors', 'raw-materials', 'purchase-bills',
  'vendor-payments', 'costing', 'expenses', 'refunds', 'reports',
];
const ACTIONS = ['view', 'create', 'update', 'delete'];

function keysFor(modules: string[]): string[] {
  return modules.flatMap((m) => ACTIONS.map((a) => `${m}.${a}`));
}

interface Admin {
  roleName: AdminRoleName;
  permissions: string[];
}

const SUPER_ADMIN: Admin = { roleName: 'SUPER_ADMIN', permissions: keysFor(MODULES_FULL) };
const ADMIN: Admin = {
  roleName: 'ADMIN',
  permissions: keysFor(MODULES_FULL.filter((m) => m !== 'roles')),
};
const MANAGER: Admin = {
  roleName: 'MANAGER',
  permissions: [
    ...keysFor(['products', 'categories', 'ingredients', 'recipes', 'orders', 'customers', 'reviews', 'dashboard']),
    'media.view', 'media.create', 'media.update',
  ],
};
const STAFF: Admin = { roleName: 'STAFF', permissions: ['orders.view', 'support.view'] };

describe('findRouteRule', () => {
  it('matches an exact path', () => {
    expect(findRouteRule('/products')?.prefix).toBe('/products');
  });

  it('matches a nested path', () => {
    expect(findRouteRule('/products/abc-123/costing')?.prefix).toBe('/products');
  });

  it('does not match a path that merely shares a prefix string', () => {
    // /productsomething must not inherit /products' rule.
    expect(findRouteRule('/productsomething')).toBeUndefined();
  });

  it('returns undefined for an unlisted route', () => {
    expect(findRouteRule('/account')).toBeUndefined();
    expect(findRouteRule('/support')).toBeUndefined();
  });
});

describe('canAccessRoute', () => {
  it('denies everything to an unauthenticated visitor except unlisted routes', () => {
    expect(canAccessRoute('/products', null)).toBe(false);
    expect(canAccessRoute('/reports', null)).toBe(false);
  });

  it('lets SUPER_ADMIN everywhere', () => {
    for (const rule of ROUTE_PERMISSIONS) {
      expect(canAccessRoute(rule.prefix, SUPER_ADMIN)).toBe(true);
    }
  });

  describe('MANAGER runs operations but not the back office', () => {
    it.each(['/products', '/categories', '/ingredients', '/recipes', '/orders', '/customers', '/reviews', '/dashboard', '/media'])(
      'allows %s',
      (route) => {
        expect(canAccessRoute(route, MANAGER)).toBe(true);
      },
    );

    it.each(['/vendors', '/raw-materials', '/purchase-bills', '/vendor-payments', '/margins', '/expenses', '/refunds', '/reports', '/settings', '/admin-users', '/roles'])(
      'denies %s',
      (route) => {
        expect(canAccessRoute(route, MANAGER)).toBe(false);
      },
    );
  });

  describe('STAFF views orders and support and nothing else', () => {
    it('allows /orders', () => {
      expect(canAccessRoute('/orders', STAFF)).toBe(true);
    });

    it('allows /support, which has no rule because the backend has no narrower one', () => {
      expect(canAccessRoute('/support', STAFF)).toBe(true);
    });

    it.each(['/products', '/dashboard', '/media', '/reports', '/vendors', '/settings', '/admin-users'])(
      'denies %s',
      (route) => {
        expect(canAccessRoute(route, STAFF)).toBe(false);
      },
    );
  });

  it('requires BOTH the role and the permission where a rule sets both', () => {
    // A MANAGER who somehow held reports.view still must not see /reports,
    // because the backend controller is @Roles(SUPER_ADMIN, ADMIN) as well.
    const managerWithKey: Admin = {
      roleName: 'MANAGER',
      permissions: [...MANAGER.permissions, 'reports.view'],
    };
    expect(canAccessRoute('/reports', managerWithKey)).toBe(false);

    // And an ADMIN missing the key must not see it either.
    const adminWithoutKey: Admin = {
      roleName: 'ADMIN',
      permissions: ADMIN.permissions.filter((p) => p !== 'reports.view'),
    };
    expect(canAccessRoute('/reports', adminWithoutKey)).toBe(false);
  });

  it('treats an unlisted route as open to any authenticated admin', () => {
    expect(canAccessRoute('/account', STAFF)).toBe(true);
  });
});

describe('defaultRouteFor', () => {
  it('sends an unauthenticated visitor to login', () => {
    expect(defaultRouteFor(null)).toBe('/login');
  });

  it('sends SUPER_ADMIN, ADMIN and MANAGER to the dashboard', () => {
    expect(defaultRouteFor(SUPER_ADMIN)).toBe('/dashboard');
    expect(defaultRouteFor(ADMIN)).toBe('/dashboard');
    expect(defaultRouteFor(MANAGER)).toBe('/dashboard');
  });

  it('sends STAFF to /orders, not to a dashboard that would 403', () => {
    expect(defaultRouteFor(STAFF)).toBe('/orders');
  });

  it('never returns a route the admin cannot access', () => {
    // The property that actually matters, whatever the candidate order is.
    for (const admin of [SUPER_ADMIN, ADMIN, MANAGER, STAFF]) {
      expect(canAccessRoute(defaultRouteFor(admin), admin)).toBe(true);
    }
  });

  it('falls back to /support for a role granted nothing at all', () => {
    // /support has no rule, so it is reachable by any authenticated admin and
    // comes before /account in the candidate list. Asserted because a
    // permission-less account must still land somewhere that renders.
    const nobody: Admin = { roleName: 'STAFF', permissions: [] };
    const landing = defaultRouteFor(nobody);
    expect(canAccessRoute(landing, nobody)).toBe(true);
    expect(landing).toBe('/support');
  });
});
