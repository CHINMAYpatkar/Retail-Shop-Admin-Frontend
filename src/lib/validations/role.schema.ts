import { z } from 'zod';

export const roleSchema = z.object({
  name: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']),
  description: z.string().optional().or(z.literal('')),
  permissionKeys: z.array(z.string()).default([]),
});
export type RoleFormValues = z.infer<typeof roleSchema>;
