'use client';

import * as React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Banknote, Search } from 'lucide-react';
import {
  useVendorPayments,
  useCreateVendorPayment,
  useUpdateVendorPayment,
  useDeleteVendorPayment,
} from '@/hooks/use-vendor-payments';
import { useVendors } from '@/hooks/use-vendors';
import { usePurchaseBills } from '@/hooks/use-purchase-bills';
import {
  vendorPaymentSchema,
  type VendorPaymentFormValues,
} from '@/lib/validations/vendor-payment.schema';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { PAYMENT_MODES, type VendorPayment } from '@/types/api';

const EMPTY: VendorPaymentFormValues = {
  vendorId: '',
  purchaseBillId: '',
  amount: '',
  paidOn: '',
  method: 'UPI',
  referenceNo: '',
  notes: '',
};

function toDateInput(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function methodLabel(value: string): string {
  return PAYMENT_MODES.find((m) => m.value === value)?.label ?? value;
}

function PaymentDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: VendorPayment;
}) {
  const create = useCreateVendorPayment();
  const update = useUpdateVendorPayment();
  const { data: vendors } = useVendors({ limit: 100, isActive: true });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VendorPaymentFormValues>({
    resolver: zodResolver(vendorPaymentSchema),
    defaultValues: EMPTY,
  });

  const selectedVendor = useWatch({ control, name: 'vendorId' });
  const selectedBillId = useWatch({ control, name: 'purchaseBillId' });

  // Only that vendor's bills are offered - the API rejects a bill belonging to
  // another vendor, so showing them would only invite an error.
  const { data: bills } = usePurchaseBills({
    limit: 100,
    vendorId: selectedVendor || undefined,
  });

  const selectedBill = bills?.items.find((b) => b.id === selectedBillId);

  React.useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            vendorId: editing.vendorId,
            purchaseBillId: editing.purchaseBillId ?? '',
            amount: editing.amount,
            paidOn: toDateInput(editing.paidOn),
            method: editing.method,
            referenceNo: editing.referenceNo ?? '',
            notes: editing.notes ?? '',
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  const onSubmit = (values: VendorPaymentFormValues) => {
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
        title={editing ? 'Edit payment' : 'Record a payment'}
        description="Link it to a bill to settle that bill, or leave the bill blank to record an advance."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Vendor" error={errors.vendorId?.message} required>
            <Controller
              control={control}
              name="vendorId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    // Any bill already chosen belongs to the previous vendor, so
                    // keeping it would guarantee a rejection on submit.
                    setValue('purchaseBillId', '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.items.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField
            label="Against bill"
            hint={
              selectedBill
                ? `Outstanding on this bill: ${formatCurrency(Number(selectedBill.outstandingAmount))}`
                : 'Leave blank for an on-account payment (an advance)'
            }
          >
            <Controller
              control={control}
              name="purchaseBillId"
              render={({ field }) => (
                <Select
                  value={field.value || 'none'}
                  onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  disabled={!selectedVendor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedVendor ? 'On account' : 'Choose a vendor first'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">On account (no bill)</SelectItem>
                    {bills?.items
                      .filter((b) => Number(b.outstandingAmount) > 0 || b.id === selectedBillId)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.billNumber} - {formatCurrency(Number(b.outstandingAmount))} due
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Amount" htmlFor="amount" error={errors.amount?.message} required>
              <Input id="amount" inputMode="decimal" invalid={!!errors.amount} {...register('amount')} />
            </FormField>

            <FormField label="Paid on" htmlFor="paidOn" error={errors.paidOn?.message} required>
              <Input id="paidOn" type="date" invalid={!!errors.paidOn} {...register('paidOn')} />
            </FormField>

            <FormField label="Method" required>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="Reference"
              htmlFor="referenceNo"
              hint="UPI txn id, cheque number - the audit trail"
            >
              <Input id="referenceNo" {...register('referenceNo')} />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register('notes')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Record payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VendorPaymentsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [vendorId, setVendorId] = React.useState('');
  const [onAccountOnly, setOnAccountOnly] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VendorPayment | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<VendorPayment | undefined>();

  const { data: vendors } = useVendors({ limit: 100 });
  const { data, isLoading } = useVendorPayments({
    page,
    limit: 20,
    search: search || undefined,
    vendorId: vendorId || undefined,
    onAccountOnly: onAccountOnly || undefined,
  });
  const deletePayment = useDeleteVendorPayment();

  const filtering = Boolean(search || vendorId || onAccountOnly);

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Vendor payments"
        description="Money paid to vendors. Linking a payment to a bill settles it; leaving the bill blank records an advance."
        actions={
          <Button variant="gold" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Record payment
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search reference, vendor or bill..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={vendorId || 'all'}
          onValueChange={(v) => {
            setVendorId(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vendors</SelectItem>
            {vendors?.items.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-ink-600">
          <Checkbox
            checked={onAccountOnly}
            onCheckedChange={(value) => {
              setOnAccountOnly(Boolean(value));
              setPage(1);
            }}
          />
          On account only
        </label>
      </div>

      <Card>
        {isLoading || !data ? (
          <PageSpinner />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title={filtering ? 'No payments match those filters' : 'No payments recorded yet'}
            description={
              filtering
                ? 'Try a different vendor or reference.'
                : 'Record what you have paid vendors, against a bill or on account.'
            }
            action={
              filtering ? undefined : (
                <Button variant="gold" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Record payment
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Against</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-data text-xs text-ink-500">
                      {payment.paidOn.slice(0, 10)}
                    </TableCell>
                    <TableCell className="text-sm text-ink-700">{payment.vendor?.name}</TableCell>
                    <TableCell className="text-sm">
                      {payment.purchaseBill ? (
                        <span className="font-data text-xs">{payment.purchaseBill.billNumber}</span>
                      ) : (
                        <Badge variant="clove">On account</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-ink-600">{methodLabel(payment.method)}</TableCell>
                    <TableCell className="font-data text-xs text-ink-500">
                      {payment.referenceNo || '-'}
                    </TableCell>
                    <TableCell className="text-right font-data">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(payment);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(payment)}>
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

      <PaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete payment?"
        description={`This payment will be removed. Any bill it was settling will go back to showing the amount as outstanding.`}
        confirmLabel="Delete"
        destructive
        loading={deletePayment.isPending}
        onConfirm={() => {
          if (deleteTarget)
            deletePayment.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
