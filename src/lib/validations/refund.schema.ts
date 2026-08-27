import { z } from 'zod';

export const refundSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Amount must be greater than zero')
    .refine((v) => (v.split('.')[1]?.length ?? 0) <= 2, 'At most 2 decimal places'),
  /** Required: a refund without a recorded reason is not much of a record. */
  reason: z.string().min(3, 'Give a reason - this is the record of why money was returned'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CARD', 'OTHER']),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
  referenceNo: z.string().optional().or(z.literal('')),
  refundedOn: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type RefundFormValues = z.infer<typeof refundSchema>;
