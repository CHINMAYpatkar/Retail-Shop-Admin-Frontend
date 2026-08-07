'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { restoreSession } from '@/hooks/use-auth';
import { PageSpinner } from '@/components/ui/spinner';

export default function RootPage() {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const admin = useAuthStore((s) => s.admin);

  useEffect(() => {
    if (!isHydrated) {
      restoreSession();
      return;
    }
    router.replace(admin ? '/dashboard' : '/login');
  }, [isHydrated, admin, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-50">
      <PageSpinner />
    </div>
  );
}
