import { z } from 'zod';

export const blogSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().optional().or(z.literal('')),
  excerpt: z.string().max(300).optional().or(z.literal('')),
  content: z.string().min(1, 'Content is required'),
  coverImageUrl: z.string().optional().or(z.literal('')),
  metaTitle: z.string().optional().or(z.literal('')),
  metaDescription: z.string().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
});
export type BlogFormValues = z.infer<typeof blogSchema>;
