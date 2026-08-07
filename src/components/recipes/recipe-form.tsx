'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { recipeSchema, type RecipeFormValues } from '@/lib/validations/recipe.schema';
import { useIngredients } from '@/hooks/use-ingredients';
import { useProducts } from '@/hooks/use-products';
import { useCreateRecipe, useUpdateRecipe } from '@/hooks/use-recipes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Recipe } from '@/types/api';

function toDefaultValues(recipe?: Recipe): RecipeFormValues {
  return {
    name: recipe?.name || '',
    slug: recipe?.slug || '',
    description: recipe?.description || '',
    steps: recipe?.steps?.length ? recipe.steps : [{ title: '', description: '', imageUrl: '' }],
    cookingTimeMins: recipe?.cookingTimeMins ?? null,
    difficulty: (recipe?.difficulty as 'Easy' | 'Medium' | 'Hard' | undefined) ?? undefined,
    videoUrl: recipe?.videoUrl || '',
    imageUrl: recipe?.imageUrl || '',
    isActive: recipe?.isActive ?? true,
    ingredients: recipe?.ingredients?.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity || '' })) || [],
    productIds: recipe?.products?.map((p) => p.productId) || [],
  };
}

export function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const isEdit = !!recipe;
  const router = useRouter();
  const { data: ingredients } = useIngredients();
  const { data: productsPage } = useProducts({ page: 1, limit: 200 });
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: toDefaultValues(recipe),
  });

  const stepsArray = useFieldArray({ control, name: 'steps' });
  const ingredientsArray = useFieldArray({ control, name: 'ingredients' });

  const onSubmit = (values: RecipeFormValues) => {
    const payload = { ...values, slug: values.slug || undefined };
    if (isEdit) {
      updateRecipe.mutate({ id: recipe.id, values: payload }, { onSuccess: () => router.push('/recipes') });
    } else {
      createRecipe.mutate(payload, { onSuccess: () => router.push('/recipes') });
    }
  };

  const saving = createRecipe.isPending || updateRecipe.isPending;
  const products = productsPage?.items || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-16">
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="name" error={errors.name?.message} required className="sm:col-span-2">
            <Input id="name" invalid={!!errors.name} {...register('name')} />
          </FormField>
          <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate">
            <Input id="slug" {...register('slug')} />
          </FormField>
          <FormField label="Image URL" htmlFor="imageUrl">
            <Input id="imageUrl" placeholder="https://..." {...register('imageUrl')} />
          </FormField>
          <FormField label="Description" htmlFor="description" className="sm:col-span-2">
            <Textarea id="description" rows={3} {...register('description')} />
          </FormField>
          <FormField label="Cooking time (mins)" htmlFor="cookingTimeMins">
            <Input id="cookingTimeMins" type="number" {...register('cookingTimeMins')} />
          </FormField>
          <FormField label="Difficulty" htmlFor="difficulty">
            <Controller
              name="difficulty"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Video URL" htmlFor="videoUrl" className="sm:col-span-2">
            <Input id="videoUrl" placeholder="https://..." {...register('videoUrl')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Steps</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => stepsArray.append({ title: '', description: '', imageUrl: '' })}
          >
            <Plus className="h-4 w-4" /> Add step
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.steps?.message && <p className="text-xs text-paprika-600">{errors.steps.message}</p>}
          {stepsArray.fields.map((field, index) => (
            <div key={field.id} className="space-y-2 rounded-md border border-paper-200 p-3">
              <div className="flex items-start gap-2">
                <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-100 text-xs font-semibold text-gold-700">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <Input placeholder="Step title" {...register(`steps.${index}.title` as const)} />
                  <Textarea rows={2} placeholder="Step description" {...register(`steps.${index}.description` as const)} />
                  <Input placeholder="Step image URL (optional)" {...register(`steps.${index}.imageUrl` as const)} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={stepsArray.fields.length === 1}
                  onClick={() => stepsArray.remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-paprika-600" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => ingredientsArray.append({ ingredientId: '', quantity: '' })}
          >
            <Plus className="h-4 w-4" /> Add ingredient
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {ingredientsArray.fields.length === 0 && <p className="text-sm text-ink-500">No ingredients linked yet.</p>}
          {ingredientsArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 rounded-md border border-paper-200 p-3">
              <FormField label="Ingredient" className="flex-1">
                <Controller
                  name={`ingredients.${index}.ingredientId` as const}
                  control={control}
                  render={({ field: selectField }) => (
                    <Select value={selectField.value} onValueChange={selectField.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients?.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Quantity" hint="e.g. 2 tsp" className="w-40">
                <Input {...register(`ingredients.${index}.quantity` as const)} />
              </FormField>
              <Button type="button" variant="ghost" size="icon" onClick={() => ingredientsArray.remove(index)}>
                <Trash2 className="h-4 w-4 text-paprika-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked products</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="productIds"
            control={control}
            render={({ field }) => (
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto scrollbar-thin sm:grid-cols-3">
                {products.map((product) => {
                  const checked = field.value.includes(product.id);
                  return (
                    <label key={product.id} className="flex items-center gap-2 text-sm text-ink-700">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          if (value) field.onChange([...field.value, product.id]);
                          else field.onChange(field.value.filter((id) => id !== product.id));
                        }}
                      />
                      {product.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />}
            />
            Active (visible on storefront)
          </label>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-paper-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl justify-end gap-2 px-6 py-3 pl-64">
          <Button type="button" variant="outline" onClick={() => router.push('/recipes')}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" loading={saving}>
            {isEdit ? 'Save changes' : 'Create recipe'}
          </Button>
        </div>
      </div>
    </form>
  );
}
