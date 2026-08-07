import { z } from 'zod';

export const cmsPageSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(1, 'Content is required'),
  metaTitle: z.string().optional().or(z.literal('')),
  metaDescription: z.string().optional().or(z.literal('')),
  isPublished: z.boolean().default(true),
});
export type CmsPageFormValues = z.infer<typeof cmsPageSchema>;
