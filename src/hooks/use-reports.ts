'use client';

import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  ProfitLossReport,
  PurchaseSummaryReport,
  StockValuationReport,
  VendorPayablesReport,
} from '@/types/api';

export interface DateRange {
  fromDate?: string;
  toDate?: string;
}

export function useProfitLoss(range: DateRange) {
  return useQuery({
    queryKey: queryKeys.report('profit-loss', range),
    queryFn: async () =>
      unwrap<ProfitLossReport>(await api.get('/admin/reports/profit-loss', { params: range })),
    placeholderData: (prev) => prev,
  });
}

export function useVendorPayables() {
  return useQuery({
    queryKey: queryKeys.report('vendor-payables'),
    queryFn: async () =>
      unwrap<VendorPayablesReport>(await api.get('/admin/reports/vendor-payables')),
  });
}

export function useStockValuation() {
  return useQuery({
    queryKey: queryKeys.report('stock-valuation'),
    queryFn: async () =>
      unwrap<StockValuationReport>(await api.get('/admin/reports/stock-valuation')),
  });
}

export function usePurchaseSummary(range: DateRange) {
  return useQuery({
    queryKey: queryKeys.report('purchase-summary', range),
    queryFn: async () =>
      unwrap<PurchaseSummaryReport>(
        await api.get('/admin/reports/purchase-summary', { params: range }),
      ),
    placeholderData: (prev) => prev,
  });
}
