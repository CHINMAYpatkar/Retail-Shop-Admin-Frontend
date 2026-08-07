import { z } from 'zod';

export const recipeStepSchema = z.object({
  title: z.string().min(1, 'Step title is required'),
  description: z.string().min(1, 'Step description is required'),
  imageUrl: z.string().optional().or(z.literal('')),
});

export const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.string().optional().or(z.literal('')),
});

export const recipeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  steps: z.array(recipeStepSchema).min(1, 'Add at least one step'),
  cookingTimeMins: z.coerce.number().int().min(1).optional().nullable(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  videoUrl: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  ingredients: z.array(recipeIngredientSchema).default([]),
  productIds: z.array(z.string()).default([]),
});
export type RecipeFormValues = z.infer<typeof recipeSchema>;
