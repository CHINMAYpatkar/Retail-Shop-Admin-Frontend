import { z } from 'zod';

export const faqSchema = z.object({
  question: z.string().min(2, 'Question is required'),
  answer: z.string().min(2, 'Answer is required'),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type FaqFormValues = z.infer<typeof faqSchema>;
