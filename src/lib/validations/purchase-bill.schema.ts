import { z } from 'zod';

/**
 * Amounts stay strings through the form and are converted once at submit, so a
 * Decimal never round-trips through a JS float.
 */
const decimal = (label: string, maxDp: number, required = false) => {
  const base = z.string().refine((v) => (required ? v.trim().length > 0 : true), `${label} is required`);
  return base
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), `${label} must be 0 or more`)
    .refine((v) => (v.split('.')[1]?.length ?? 0) <= maxDp, `${label} allows at most ${maxDp} decimals`);
};

export const purchaseBillItemSchema = z.object({
  rawMaterialId: z.string().min(1, 'Choose a material'),
  quantity: decimal('Quantity', 3, true),
  unitPrice: decimal('Unit price', 4, true),
  notes: z.string().optional().or(z.literal('')),
});

export const purchaseBillSchema = z.object({
  vendorId: z.string().min(1, 'Choose a vendor'),
  billNumber: z.string().min(1, "Enter the vendor's bill number"),
  billDate: z.string().min(1, 'Bill date is required'),
  dueDate: z.string().optional().or(z.literal('')),
  discountAmount: decimal('Discount', 2),
  attachmentMediaId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  // At least one line: a bill with no lines is not a bill, and the API rejects it.
  items: z.array(purchaseBillItemSchema).min(1, 'Add at least one line item'),
});

export type PurchaseBillFormValues = z.infer<typeof purchaseBillSchema>;
export type PurchaseBillItemFormValues = z.infer<typeof purchaseBillItemSchema>;
