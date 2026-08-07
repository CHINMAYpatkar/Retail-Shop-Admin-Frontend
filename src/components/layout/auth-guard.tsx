'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { restoreSession } from '@/hooks/use-auth';
import { PageSpinner } from '@/components/ui/spinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const admin = useAuthStore((s) => s.admin);

  React.useEffect(() => {
    if (!isHydrated) {
      restoreSession();
    }
  }, [isHydrated]);

  React.useEffect(() => {
    if (isHydrated && !admin) {
      router.replace('/login');
    }
  }, [isHydrated, admin, router]);

  if (!isHydrated || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-50">
        <PageSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
