import { z } from 'zod';

export const productImageSchema = z.object({
  url: z.string().min(1, 'Image URL is required'),
  altText: z.string().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isVideo: z.boolean().default(false),
});

export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required (e.g. 250g)'),
  sku: z.string().optional().or(z.literal('')),
  priceOverride: z.coerce.number().min(0).optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().optional().or(z.literal('')),
  shortDescription: z.string().max(300).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  weightGrams: z.coerce.number().int().min(0).optional().nullable(),
  shelfLifeDays: z.coerce.number().int().min(0).optional().nullable(),
  storageInstructions: z.string().optional().or(z.literal('')),
  preparationProcess: z.string().optional().or(z.literal('')),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  sku: z.string().optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Category is required'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional().or(z.literal('')),
  metaDescription: z.string().optional().or(z.literal('')),
  ingredientIds: z.array(z.string()).default([]),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
});
export type ProductFormValues = z.infer<typeof productSchema>;
