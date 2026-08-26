import { z } from 'zod';

export const ingredientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Lowercase letters, numbers and hyphens only')
    .optional()
    .or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  benefits: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;
