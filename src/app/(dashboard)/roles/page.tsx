'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { roleSchema, type RoleFormValues } from '@/lib/validations/role.schema';
import { useRoles, usePermissions, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/use-roles';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Permission, Role } from '@/types/api';

const ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'] as const;

function RoleDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
}) {
  const isEdit = !!role;
  const { data: permissions } = usePermissions();
  const create = useCreateRole();
  const update = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || 'STAFF',
      description: role?.description || '',
      permissionKeys: role?.permissions.map((rp) => rp.permission.key) || [],
    },
  });

  React.useEffect(() => {
    reset({
      name: role?.name || 'STAFF',
      description: role?.description || '',
      permissionKeys: role?.permissions.map((rp) => rp.permission.key) || [],
    });
  }, [role, reset]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Permission[]>();
    (permissions ?? []).forEach((p) => {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    });
    return map;
  }, [permissions]);

  const onSubmit = (values: RoleFormValues) => {
    if (isEdit) {
      update.mutate({ id: role.id, values }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={isEdit ? 'Edit role' : 'New role'} description="Roles bundle permissions for a group of admin users." className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Role name" htmlFor="name" error={errors.name?.message} required>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                    <SelectTrigger id="name">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_NAMES.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Description" htmlFor="description">
              <Input id="description" {...register('description')} />
            </FormField>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-800">Permissions</p>
            <Controller
              name="permissionKeys"
              control={control}
              render={({ field }) => (
                <div className="max-h-72 space-y-4 overflow-y-auto scrollbar-thin rounded-md border border-paper-200 p-3">
                  {Array.from(grouped.entries()).map(([module, perms]) => (
                    <div key={module}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">{module}</p>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                        {perms.map((perm) => {
                          const checked = field.value.includes(perm.key);
                          return (
                            <label key={perm.key} className="flex items-center gap-1.5 text-sm text-ink-700">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  if (v) field.onChange([...field.value, perm.key]);
                                  else field.onChange(field.value.filter((k) => k !== perm.key));
                                }}
                              />
                              {perm.key.split('.')[1]}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
              {isEdit ? 'Save changes' : 'Create role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RolesPage() {
  const { data: roles, isLoading } = useRoles();
  const deleteRole = useDeleteRole();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Role | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<Role | undefined>();

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Define permission bundles for admin users"
        actions={
          <Button
            variant="gold"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New role
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : !roles || roles.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No roles yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name.replace('_', ' ')}</TableCell>
                  <TableCell className="text-sm text-ink-600">{role.description}</TableCell>
                  <TableCell>
                    <Badge variant="gold">{role.permissions.length} permissions</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(role);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {role.name !== 'SUPER_ADMIN' && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(role)}>
                          <Trash2 className="h-4 w-4 text-paprika-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <RoleDialog open={dialogOpen} onOpenChange={setDialogOpen} role={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete role?"
        description={`"${deleteTarget?.name}" will be removed. Admin users assigned to it must be reassigned first.`}
        confirmLabel="Delete"
        destructive
        loading={deleteRole.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteRole.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
