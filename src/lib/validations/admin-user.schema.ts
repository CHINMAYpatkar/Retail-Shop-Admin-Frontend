import { z } from 'zod';

export const createAdminUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().min(1, 'Role is required'),
});
export type CreateAdminUserFormValues = z.infer<typeof createAdminUserSchema>;

export const updateAdminUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Enter a valid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  roleId: z.string().min(1, 'Role is required').optional(),
  isActive: z.boolean().optional(),
});
export type UpdateAdminUserFormValues = z.infer<typeof updateAdminUserSchema>;
