import { z } from 'zod';

const decimalString = (label: string, maxDp: number) =>
  z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      `${label} must be a number of 0 or more`,
    )
    .refine((v) => {
      if (!v) return true;
      const dp = v.split('.')[1]?.length ?? 0;
      return dp <= maxDp;
    }, `${label} allows at most ${maxDp} decimal places`);

export const rawMaterialSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().optional().or(z.literal('')),
  baseUnit: z.enum(['GRAM', 'KILOGRAM', 'MILLILITRE', 'LITRE', 'PIECE', 'PACKET']),
  // Kept as strings in the form so a Decimal is never round-tripped through a
  // JS float; converted once, at submit.
  stockQuantity: decimalString('Stock', 3),
  reorderLevel: decimalString('Reorder level', 3),
  avgCostPerUnit: decimalString('Cost per unit', 4),
  ingredientId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type RawMaterialFormValues = z.infer<typeof rawMaterialSchema>;
