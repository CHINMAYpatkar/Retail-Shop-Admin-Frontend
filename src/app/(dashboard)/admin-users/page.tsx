'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import {
  createAdminUserSchema,
  updateAdminUserSchema,
  type CreateAdminUserFormValues,
  type UpdateAdminUserFormValues,
} from '@/lib/validations/admin-user.schema';
import {
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
} from '@/hooks/use-admin-users';
import { useRoles } from '@/hooks/use-roles';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import type { AdminUserRecord } from '@/types/api';

function AdminUserDialog({
  open,
  onOpenChange,
  adminUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminUser?: AdminUserRecord;
}) {
  const isEdit = !!adminUser;
  const { data: roles } = useRoles();
  const create = useCreateAdminUser();
  const update = useUpdateAdminUser();

  const createForm = useForm<CreateAdminUserFormValues>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: { name: '', email: '', password: '', roleId: '' },
  });
  const updateForm = useForm<UpdateAdminUserFormValues>({
    resolver: zodResolver(updateAdminUserSchema),
    defaultValues: {
      name: adminUser?.name,
      email: adminUser?.email,
      roleId: adminUser?.role.id,
      isActive: adminUser?.isActive,
    },
  });

  React.useEffect(() => {
    if (isEdit) {
      updateForm.reset({
        name: adminUser?.name,
        email: adminUser?.email,
        password: '',
        roleId: adminUser?.role.id,
        isActive: adminUser?.isActive,
      });
    } else {
      createForm.reset({ name: '', email: '', password: '', roleId: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUser, open]);

  if (isEdit) {
    const {
      register,
      handleSubmit,
      control,
      formState: { errors },
    } = updateForm;

    const onSubmit = (values: UpdateAdminUserFormValues) => {
      const payload = { ...values, password: values.password || undefined };
      update.mutate({ id: adminUser.id, values: payload }, { onSuccess: () => onOpenChange(false) });
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent title="Edit admin user" description="Update account details, role, or status.">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Name" htmlFor="name" error={errors.name?.message}>
              <Input id="name" {...register('name')} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...register('email')} />
            </FormField>
            <FormField label="New password" htmlFor="password" hint="Leave blank to keep the current password" error={errors.password?.message}>
              <Input id="password" type="password" {...register('password')} />
            </FormField>
            <FormField label="Role" htmlFor="roleId" error={errors.roleId?.message}>
              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="roleId">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <div className="flex items-center gap-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <label htmlFor="isActive" className="text-sm text-ink-700">
                Account active
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold" loading={update.isPending}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = createForm;

  const onCreateSubmit = (values: CreateAdminUserFormValues) => {
    create.mutate(values, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="New admin user" description="Invite a teammate to manage the store.">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <FormField label="Name" htmlFor="new-name" error={errors.name?.message} required>
            <Input id="new-name" invalid={!!errors.name} {...register('name')} />
          </FormField>
          <FormField label="Email" htmlFor="new-email" error={errors.email?.message} required>
            <Input id="new-email" type="email" invalid={!!errors.email} {...register('email')} />
          </FormField>
          <FormField label="Password" htmlFor="new-password" error={errors.password?.message} required>
            <Input id="new-password" type="password" invalid={!!errors.password} {...register('password')} />
          </FormField>
          <FormField label="Role" htmlFor="new-roleId" error={errors.roleId?.message} required>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="new-roleId">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending}>
              Create admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const { data: adminUsers, isLoading } = useAdminUsers();
  const deleteAdminUser = useDeleteAdminUser();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminUserRecord | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUserRecord | undefined>();

  return (
    <div>
      <PageHeader
        title="Admin users"
        description="Manage who can access the admin console"
        actions={
          <Button
            variant="gold"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New admin
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : !adminUsers || adminUsers.length === 0 ? (
          <EmptyState icon={UserCog} title="No admin users yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium text-ink-900">{user.name}</p>
                    <p className="text-xs text-ink-500">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="gold">{user.role.name.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-ink-600">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt, true) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'moss' : 'paprika'}>{user.isActive ? 'Active' : 'Disabled'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(user);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(user)}>
                        <Trash2 className="h-4 w-4 text-paprika-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AdminUserDialog open={dialogOpen} onOpenChange={setDialogOpen} adminUser={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete admin user?"
        description={`"${deleteTarget?.name}" will permanently lose access to the admin console.`}
        confirmLabel="Delete"
        destructive
        loading={deleteAdminUser.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteAdminUser.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
