'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  purchaseBillSchema,
  type PurchaseBillFormValues,
} from '@/lib/validations/purchase-bill.schema';
import { useVendors } from '@/hooks/use-vendors';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useCreatePurchaseBill, useUpdatePurchaseBill } from '@/hooks/use-purchase-bills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { DocumentUpload } from '@/components/ui/document-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { unitShortLabel, type PurchaseBill } from '@/types/api';

const EMPTY_ITEM = { rawMaterialId: '', quantity: '', unitPrice: '', notes: '' };

/** Date input needs yyyy-MM-dd; the API returns an ISO timestamp. */
function toDateInput(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export function PurchaseBillForm({ bill }: { bill?: PurchaseBill }) {
  const router = useRouter();
  const create = useCreatePurchaseBill();
  const update = useUpdatePurchaseBill();

  const { data: vendors } = useVendors({ limit: 100, isActive: true });
  const { data: materials } = useRawMaterials({ limit: 100, isActive: true });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseBillFormValues>({
    resolver: zodResolver(purchaseBillSchema),
    defaultValues: bill
      ? {
          vendorId: bill.vendorId,
          billNumber: bill.billNumber,
          billDate: toDateInput(bill.billDate),
          dueDate: toDateInput(bill.dueDate),
          discountAmount: bill.discountAmount ?? '0',
          attachmentMediaId: bill.attachmentMediaId ?? '',
          notes: bill.notes ?? '',
          items: bill.items.map((item) => ({
            rawMaterialId: item.rawMaterialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes ?? '',
          })),
        }
      : {
          vendorId: '',
          billNumber: '',
          billDate: '',
          dueDate: '',
          discountAmount: '0',
          attachmentMediaId: '',
          notes: '',
          items: [{ ...EMPTY_ITEM }],
        },
  });

  const itemsArray = useFieldArray({ control, name: 'items' });

  // Watched so the totals below update as you type. These mirror what the API
  // will compute - the server recomputes them and ignores anything sent, so this
  // is a preview, never the source of truth.
  const watchedItems = useWatch({ control, name: 'items' });
  const watchedDiscount = useWatch({ control, name: 'discountAmount' });

  const { subtotal, total } = React.useMemo(() => {
    const sub = (watchedItems ?? []).reduce((acc, item) => {
      const q = Number(item?.quantity);
      const p = Number(item?.unitPrice);
      if (Number.isNaN(q) || Number.isNaN(p)) return acc;
      return acc + q * p;
    }, 0);
    const discount = Number(watchedDiscount) || 0;
    return { subtotal: sub, total: Math.max(sub - discount, 0) };
  }, [watchedItems, watchedDiscount]);

  const onSubmit = (values: PurchaseBillFormValues) => {
    const done = () => router.push('/purchase-bills');
    if (bill) update.mutate({ id: bill.id, values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  const materialById = (id: string) => materials?.items.find((m) => m.id === id);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Bill details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Vendor" error={errors.vendorId?.message} required>
            <Controller
              control={control}
              name="vendorId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
            label="Bill number"
            htmlFor="billNumber"
            error={errors.billNumber?.message}
            required
            hint="From the vendor's paper bill. Must be unique for this vendor."
          >
            <Input id="billNumber" invalid={!!errors.billNumber} {...register('billNumber')} />
          </FormField>

          <FormField label="Bill date" htmlFor="billDate" error={errors.billDate?.message} required>
            <Input id="billDate" type="date" invalid={!!errors.billDate} {...register('billDate')} />
          </FormField>

          <FormField label="Due date" htmlFor="dueDate" hint="Optional">
            <Input id="dueDate" type="date" {...register('dueDate')} />
          </FormField>

          <FormField label="Bill scan" className="sm:col-span-2">
            <Controller
              control={control}
              name="attachmentMediaId"
              render={({ field }) => (
                <DocumentUpload value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          </FormField>

          <FormField label="Notes" htmlFor="notes" className="sm:col-span-2">
            <Textarea id="notes" rows={2} {...register('notes')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Line items</CardTitle>
            <p className="mt-1 text-xs text-ink-500">
              Quantities are in each material&apos;s own unit. Recording this bill adds them to stock.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => itemsArray.append({ ...EMPTY_ITEM })}
          >
            <Plus className="h-4 w-4" /> Add line
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.items?.message && <p className="text-sm text-paprika-600">{errors.items.message}</p>}

          {itemsArray.fields.map((field, index) => {
            const selected = materialById(watchedItems?.[index]?.rawMaterialId ?? '');
            const unit = selected ? unitShortLabel(selected.baseUnit) : 'unit';
            const q = Number(watchedItems?.[index]?.quantity);
            const p = Number(watchedItems?.[index]?.unitPrice);
            const line = Number.isNaN(q) || Number.isNaN(p) ? 0 : q * p;

            return (
              <div key={field.id} className="rounded-md border border-paper-200 p-3">
                <div className="grid gap-3 sm:grid-cols-12">
                  <FormField
                    label="Material"
                    className="sm:col-span-4"
                    error={errors.items?.[index]?.rawMaterialId?.message}
                  >
                    <Controller
                      control={control}
                      name={`items.${index}.rawMaterialId` as const}
                      render={({ field: materialField }) => (
                        <Select value={materialField.value} onValueChange={materialField.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials?.items.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                                {m.code ? ` (${m.code})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>

                  <FormField
                    label={`Quantity (${unit})`}
                    className="sm:col-span-3"
                    error={errors.items?.[index]?.quantity?.message}
                  >
                    <Input
                      inputMode="decimal"
                      placeholder="0"
                      invalid={!!errors.items?.[index]?.quantity}
                      {...register(`items.${index}.quantity` as const)}
                    />
                  </FormField>

                  <FormField
                    label={`Price per ${unit}`}
                    className="sm:col-span-3"
                    error={errors.items?.[index]?.unitPrice?.message}
                  >
                    <Input
                      inputMode="decimal"
                      placeholder="0.0000"
                      invalid={!!errors.items?.[index]?.unitPrice}
                      {...register(`items.${index}.unitPrice` as const)}
                    />
                  </FormField>

                  <div className="flex items-end justify-between gap-2 sm:col-span-2">
                    <div className="text-right">
                      <p className="text-xs text-ink-500">Line total</p>
                      <p className="font-data text-sm text-ink-900">{formatCurrency(line)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      // A bill must keep at least one line, and the API rejects
                      // an empty array - so removing the last one is blocked.
                      disabled={itemsArray.fields.length === 1}
                      onClick={() => itemsArray.remove(index)}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4 text-paprika-600" />
                    </Button>
                  </div>
                </div>

                {selected && (
                  <p className="mt-2 font-data text-xs text-ink-400">
                    in stock: {selected.stockQuantity} {unit}
                    {selected.avgCostPerUnit ? ` · current avg cost ${selected.avgCostPerUnit}` : ''}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField
            label="Discount"
            htmlFor="discountAmount"
            error={errors.discountAmount?.message}
            className="max-w-xs"
          >
            <Input id="discountAmount" inputMode="decimal" {...register('discountAmount')} />
          </FormField>

          <div className="ml-auto max-w-xs space-y-1 border-t border-paper-200 pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Subtotal</span>
              <span className="font-data">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Discount</span>
              <span className="font-data">-{formatCurrency(Number(watchedDiscount) || 0)}</span>
            </div>
            <div className="flex justify-between border-t border-paper-200 pt-1 text-base font-semibold">
              <span>Total</span>
              <span className="font-data">{formatCurrency(total)}</span>
            </div>
          </div>

          <p className="text-xs text-ink-400">
            Calculated from the line items. The server recomputes these on save, so they always
            match the lines.
          </p>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 border-t border-paper-200 bg-paper-50/95 px-6 py-3 backdrop-blur lg:left-64">
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/purchase-bills')}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
            {bill ? 'Save changes' : 'Record bill'}
          </Button>
        </div>
      </div>
    </form>
  );
}
