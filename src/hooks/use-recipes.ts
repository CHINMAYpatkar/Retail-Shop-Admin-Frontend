'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { Recipe } from '@/types/api';
import type { RecipeFormValues } from '@/lib/validations/recipe.schema';

export function useRecipes() {
  return useQuery({
    queryKey: queryKeys.recipes,
    queryFn: async () => unwrap<Recipe[]>(await api.get('/admin/recipes')),
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recipe(id || ''),
    queryFn: async () => unwrap<Recipe>(await api.get(`/admin/recipes/${id}`)),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: RecipeFormValues) => unwrap<Recipe>(await api.post('/admin/recipes', values)),
    onSuccess: () => {
      toast.success('Recipe created');
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<RecipeFormValues> }) =>
      unwrap<Recipe>(await api.patch(`/admin/recipes/${id}`, values)),
    onSuccess: (_data, variables) => {
      toast.success('Recipe updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipe(variables.id) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/recipes/${id}`),
    onSuccess: () => {
      toast.success('Recipe deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
