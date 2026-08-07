import { AuthGuard } from '@/components/layout/auth-guard';
import { RouteGuard } from '@/components/layout/route-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-paper-50">
        <Sidebar />
        <div className="pl-60">
          <Topbar />
          <main className="mx-auto max-w-7xl px-6 py-6">
            <RouteGuard>{children}</RouteGuard>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
