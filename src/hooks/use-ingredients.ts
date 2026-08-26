'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { IngredientFormValues } from '@/lib/validations/ingredient.schema';
import type { Ingredient } from '@/types/api';

/** The admin list returns every ingredient, active or not, sorted by name. */
export function useIngredients() {
  return useQuery({
    queryKey: queryKeys.ingredients,
    queryFn: async () => unwrap<Ingredient[]>(await api.get('/admin/ingredients')),
  });
}

/** Optional fields are sent as undefined rather than '' so they clear properly. */
function toPayload(values: IngredientFormValues) {
  return {
    name: values.name,
    slug: values.slug || undefined,
    description: values.description || undefined,
    benefits: values.benefits || undefined,
    imageUrl: values.imageUrl || undefined,
    isActive: values.isActive,
  };
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: IngredientFormValues) =>
      unwrap<Ingredient>(await api.post('/admin/ingredients', toPayload(values))),
    onSuccess: () => {
      toast.success('Ingredient created');
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: IngredientFormValues }) =>
      unwrap<Ingredient>(await api.patch(`/admin/ingredients/${id}`, toPayload(values))),
    onSuccess: () => {
      toast.success('Ingredient updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/ingredients/${id}`),
    onSuccess: () => {
      toast.success('Ingredient deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
      // A deleted ingredient disappears from the product form's picker too.
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
