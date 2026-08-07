import { z } from 'zod';

export const businessInfoSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  supportEmail: z.string().email('Enter a valid email address'),
  supportPhone: z.string().min(1, 'Phone number is required'),
  addressLine: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});
export type BusinessInfoFormValues = z.infer<typeof businessInfoSchema>;

export const socialLinksSchema = z.object({
  instagram: z.string().optional().or(z.literal('')),
  facebook: z.string().optional().or(z.literal('')),
  twitter: z.string().optional().or(z.literal('')),
  youtube: z.string().optional().or(z.literal('')),
});
export type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;

export const seoDefaultsSchema = z.object({
  defaultMetaTitle: z.string().min(1, 'Default meta title is required'),
  defaultMetaDescription: z.string().min(1, 'Default meta description is required'),
  ogImageUrl: z.string().optional().or(z.literal('')),
});
export type SeoDefaultsFormValues = z.infer<typeof seoDefaultsSchema>;

export const invoiceSettingsSchema = z.object({
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  gstNumber: z.string().optional().or(z.literal('')),
  footerNote: z.string().optional().or(z.literal('')),
});
export type InvoiceSettingsFormValues = z.infer<typeof invoiceSettingsSchema>;
