'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Truck, Search } from 'lucide-react';
import {
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from '@/hooks/use-vendors';
import { vendorSchema, type VendorFormValues } from '@/lib/validations/vendor.schema';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Vendor } from '@/types/api';

const EMPTY: VendorFormValues = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  gstin: '',
  notes: '',
  isActive: true,
};

function VendorDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Vendor;
}) {
  const create = useCreateVendor();
  const update = useUpdateVendor();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<VendorFormValues>({ resolver: zodResolver(vendorSchema), defaultValues: EMPTY });

  React.useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            name: editing.name,
            contactPerson: editing.contactPerson ?? '',
            email: editing.email ?? '',
            phone: editing.phone ?? '',
            addressLine1: editing.addressLine1 ?? '',
            addressLine2: editing.addressLine2 ?? '',
            city: editing.city ?? '',
            state: editing.state ?? '',
            postalCode: editing.postalCode ?? '',
            gstin: editing.gstin ?? '',
            notes: editing.notes ?? '',
            isActive: editing.isActive,
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  const onSubmit = (values: VendorFormValues) => {
    const done = () => {
      reset(EMPTY);
      onOpenChange(false);
    };
    if (editing) update.mutate({ id: editing.id, values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={editing ? 'Edit vendor' : 'New vendor'}
        description="A supplier you buy raw materials from."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
              <Input id="name" placeholder="e.g. Patel Traders" invalid={!!errors.name} {...register('name')} />
            </FormField>
            <FormField label="Contact person" htmlFor="contactPerson">
              <Input id="contactPerson" {...register('contactPerson')} />
            </FormField>
            <FormField label="Phone" htmlFor="phone">
              <Input id="phone" {...register('phone')} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" invalid={!!errors.email} {...register('email')} />
            </FormField>
            <FormField label="Address line 1" htmlFor="addressLine1" className="sm:col-span-2">
              <Input id="addressLine1" {...register('addressLine1')} />
            </FormField>
            <FormField label="City" htmlFor="city">
              <Input id="city" {...register('city')} />
            </FormField>
            <FormField label="State" htmlFor="state">
              <Input id="state" {...register('state')} />
            </FormField>
            <FormField label="Postal code" htmlFor="postalCode">
              <Input id="postalCode" {...register('postalCode')} />
            </FormField>
            <FormField label="GSTIN" htmlFor="gstin" hint="Recorded for reference only">
              <Input id="gstin" {...register('gstin')} />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register('notes')} />
          </FormField>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                Active — available when recording new bills
              </label>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Create vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VendorsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Vendor | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<Vendor | undefined>();

  const { data, isLoading } = useVendors({ page, limit: 20, search: search || undefined });
  const deleteVendor = useDeleteVendor();

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Suppliers you buy raw materials from. Bills and payments are recorded against them."
        actions={
          <Button variant="gold" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New vendor
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search vendors..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card>
        {isLoading || !data ? (
          <PageSpinner />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={search ? 'No vendors match that search' : 'No vendors yet'}
            description={
              search
                ? 'Try a different name, contact or phone number.'
                : 'Add the suppliers you buy raw materials from.'
            }
            action={
              search ? undefined : (
                <Button variant="gold" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New vendor
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium text-ink-900">{vendor.name}</TableCell>
                    <TableCell className="text-sm text-ink-600">
                      {vendor.contactPerson || '-'}
                      {vendor.phone && (
                        <span className="ml-2 font-data text-xs text-ink-400">{vendor.phone}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-ink-600">
                      {[vendor.city, vendor.state].filter(Boolean).join(', ') || '-'}
                    </TableCell>
                    <TableCell className="font-data text-xs text-ink-500">{vendor.gstin || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={vendor.isActive ? 'moss' : 'neutral'}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(vendor);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(vendor)}>
                        <Trash2 className="h-4 w-4 text-paprika-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <VendorDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete vendor?"
        description={`"${deleteTarget?.name}" will be removed permanently. If any bills or payments reference them the delete will be refused — mark them inactive instead.`}
        confirmLabel="Delete"
        destructive
        loading={deleteVendor.isPending}
        onConfirm={() => {
          if (deleteTarget)
            deleteVendor.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
