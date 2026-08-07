'use client';

import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { DashboardSummary } from '@/types/api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => unwrap<DashboardSummary>(await api.get('/admin/dashboard/summary')),
  });
}
