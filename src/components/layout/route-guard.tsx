'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { findRouteRule } from '@/lib/route-permissions';
import { Button } from '@/components/ui/button';

/**
 * Enforces role/permission-based access at the route level - not just hiding
 * sidebar links. If an admin without the right permission types a URL
 * directly (e.g. a STAFF account navigating to /roles), they see this
 * screen instead of the page, and the underlying API calls would also be
 * rejected server-side (this is a UX guard, not the security boundary -
 * the backend's RolesGuard/PermissionsGuard remain the source of truth).
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const admin = useAuthStore((s) => s.admin);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const rule = pathname ? findRouteRule(pathname) : undefined;
  const permissionOk = !rule?.permission || hasPermission(rule.permission);
  const roleOk = !rule?.roles || (admin ? rule.roles.includes(admin.roleName) : false);
  const allowed = !rule || (permissionOk && roleOk);

  React.useEffect(() => {
    if (!allowed) {
      toast.error("You don't have permission to access that section.");
    }
    // Only re-notify when the blocked route actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, allowed]);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-paper-200 bg-white py-24 text-center shadow-subtle">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paprika-100">
          <ShieldAlert className="h-5 w-5 text-paprika-600" />
        </span>
        <p className="font-display text-base font-semibold text-ink-900">Access denied</p>
        <p className="max-w-sm text-sm text-ink-500">
          Your role ({admin?.roleName.replace('_', ' ')}) doesn&apos;t include access to this section. Contact a
          Super Admin if you believe this is a mistake.
        </p>
        <Button variant="gold" onClick={() => router.push('/dashboard')}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
