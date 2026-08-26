import { z } from 'zod';

export const bannerPlacementEnum = z.enum(['HOME_HERO', 'HOME_OFFER', 'CATEGORY', 'SLIDER']);

export const bannerSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  subtitle: z.string().optional().or(z.literal('')),
  videoUrl: z.string().optional().or(z.literal('')),
  imageUrl: z.string().min(1, 'Image URL is required'),
  ctaLabel: z.string().optional().or(z.literal('')),
  ctaUrl: z.string().optional().or(z.literal('')),
  placement: bannerPlacementEnum,
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional().or(z.literal('')),
  endsAt: z.string().optional().or(z.literal('')),
});
export type BannerFormValues = z.infer<typeof bannerSchema>;
