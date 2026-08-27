import { z } from 'zod';

export const vendorPaymentSchema = z.object({
  vendorId: z.string().min(1, 'Choose a vendor'),
  /** Empty means an on-account payment - an advance not tied to any bill. */
  purchaseBillId: z.string().optional().or(z.literal('')),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Amount must be greater than zero')
    .refine((v) => (v.split('.')[1]?.length ?? 0) <= 2, 'At most 2 decimal places'),
  paidOn: z.string().min(1, 'Payment date is required'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CARD', 'OTHER']),
  referenceNo: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type VendorPaymentFormValues = z.infer<typeof vendorPaymentSchema>;
