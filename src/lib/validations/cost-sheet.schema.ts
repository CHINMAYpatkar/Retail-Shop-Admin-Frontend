import { z } from 'zod';

const decimal = (label: string, maxDp: number, required = false) =>
  z
    .string()
    .refine((v) => (required ? v.trim().length > 0 : true), `${label} is required`)
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), `${label} must be 0 or more`)
    .refine((v) => (v.split('.')[1]?.length ?? 0) <= maxDp, `${label} allows at most ${maxDp} decimals`);

export const costSheetItemSchema = z.object({
  rawMaterialId: z.string().min(1, 'Choose a material'),
  quantity: decimal('Quantity', 3, true),
  /** Blank means "use the material's current average cost", which the API resolves. */
  ratePerUnit: decimal('Rate', 4),
  notes: z.string().optional().or(z.literal('')),
});

export const costSheetSchema = z.object({
  batchYieldQuantity: z
    .string()
    .min(1, 'Batch yield is required')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, 'Must be a whole number of 1 or more'),
  labourCost: decimal('Labour', 2),
  packagingCost: decimal('Packaging', 2),
  overheadCost: decimal('Overhead', 2),
  otherCost: decimal('Other', 2),
  effectiveFrom: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(costSheetItemSchema).min(1, 'Add at least one material'),
});

export type CostSheetFormValues = z.infer<typeof costSheetSchema>;
