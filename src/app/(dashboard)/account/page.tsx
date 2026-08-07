'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/validations/auth.schema';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';

export default function AccountPage() {
  const admin = useAuthStore((s) => s.admin);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const changePassword = useMutation({
    mutationFn: async (values: ChangePasswordFormValues) =>
      api.post('/auth/admin/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader title="My account" description="Manage your admin profile and security" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-ink-500">Name: </span>
              <span className="text-ink-900">{admin?.name}</span>
            </p>
            <p>
              <span className="text-ink-500">Email: </span>
              <span className="text-ink-900">{admin?.email}</span>
            </p>
            <p>
              <span className="text-ink-500">Role: </span>
              <span className="text-ink-900">{admin?.roleName.replace('_', ' ')}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Change password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((values) => changePassword.mutate(values))} className="space-y-4">
              <FormField label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message} required>
                <Input id="currentPassword" type="password" invalid={!!errors.currentPassword} {...register('currentPassword')} />
              </FormField>
              <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message} required>
                <Input id="newPassword" type="password" invalid={!!errors.newPassword} {...register('newPassword')} />
              </FormField>
              <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
                <Input id="confirmPassword" type="password" invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
              </FormField>
              <Button type="submit" variant="gold" loading={changePassword.isPending}>
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
