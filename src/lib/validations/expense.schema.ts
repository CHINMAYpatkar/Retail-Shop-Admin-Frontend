import { z } from 'zod';

export const expenseSchema = z.object({
  category: z.enum([
    'RENT',
    'UTILITIES',
    'SALARY',
    'PACKAGING',
    'TRANSPORT',
    'MARKETING',
    'EQUIPMENT',
    'MAINTENANCE',
    'MISC',
  ]),
  title: z.string().min(2, 'Say what it was for'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Amount must be greater than zero')
    .refine((v) => (v.split('.')[1]?.length ?? 0) <= 2, 'At most 2 decimal places'),
  spentOn: z.string().min(1, 'Date is required'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CARD', 'OTHER']),
  vendorId: z.string().optional().or(z.literal('')),
  attachmentMediaId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
