import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  contactPerson: z.string().optional().or(z.literal('')),
  // Empty string is allowed and sent as undefined; only a non-empty value is
  // validated as an email, so leaving the field blank isn't an error.
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  addressLine1: z.string().optional().or(z.literal('')),
  addressLine2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  gstin: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
