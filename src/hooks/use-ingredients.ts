'use client';

import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Ingredient } from '@/types/api';

export function useIngredients() {
  return useQuery({
    queryKey: queryKeys.ingredients,
    queryFn: async () => unwrap<Ingredient[]>(await api.get('/admin/ingredients')),
  });
}
