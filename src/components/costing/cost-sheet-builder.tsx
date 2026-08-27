'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { costSheetSchema, type CostSheetFormValues } from '@/lib/validations/cost-sheet.schema';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useCreateCostSheet, useUpdateCostSheet } from '@/hooks/use-costing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { unitShortLabel, type ProductCostSheet } from '@/types/api';

const EMPTY_ITEM = { rawMaterialId: '', quantity: '', ratePerUnit: '', notes: '' };

interface Props {
  productId: string;
  /** Selling price, so the margin can be shown live. */
  sellingPrice: number;
  /** Passing a sheet edits it in place; omitting creates the next version. */
  sheet?: ProductCostSheet;
  onDone?: () => void;
}

export function CostSheetBuilder({ productId, sellingPrice, sheet, onDone }: Props) {
  const create = useCreateCostSheet(productId);
  const update = useUpdateCostSheet();
  const { data: materials } = useRawMaterials({ limit: 100, isActive: true });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CostSheetFormValues>({
    resolver: zodResolver(costSheetSchema),
    defaultValues: sheet
      ? {
          batchYieldQuantity: String(sheet.batchYieldQuantity),
          labourCost: sheet.labourCost,
          packagingCost: sheet.packagingCost,
          overheadCost: sheet.overheadCost,
          otherCost: sheet.otherCost,
          effectiveFrom: sheet.effectiveFrom.slice(0, 10),
          notes: sheet.notes ?? '',
          items: sheet.items.map((item) => ({
            rawMaterialId: item.rawMaterialId,
            quantity: item.quantity,
            ratePerUnit: item.ratePerUnit,
            notes: item.notes ?? '',
          })),
        }
      : {
          batchYieldQuantity: '',
          labourCost: '0',
          packagingCost: '0',
          overheadCost: '0',
          otherCost: '0',
          effectiveFrom: '',
          notes: '',
          items: [{ ...EMPTY_ITEM }],
        },
  });

  const itemsArray = useFieldArray({ control, name: 'items' });
  const watched = useWatch({ control });

  const materialById = React.useCallback(
    (id?: string) => materials?.items.find((m) => m.id === id),
    [materials],
  );

  /**
   * Mirrors the server's arithmetic so the numbers move as you type. The server
   * recomputes on save and ignores anything sent, so this is only a preview -
   * but seeing the margin while entering costs is the entire reason this screen
   * exists, so it has to be live.
   */
  const totals = React.useMemo(() => {
    const items = watched.items ?? [];

    const materialCost = items.reduce((acc, item) => {
      const qty = Number(item?.quantity);
      // Blank rate means "use the material's current average" - the same
      // fallback the server applies, so preview it with the same number.
      const rate =
        item?.ratePerUnit && item.ratePerUnit.trim()
          ? Number(item.ratePerUnit)
          : Number(materialById(item?.rawMaterialId)?.avgCostPerUnit ?? 0);
      if (Number.isNaN(qty) || Number.isNaN(rate)) return acc;
      return acc + qty * rate;
    }, 0);

    const making =
      (Number(watched.labourCost) || 0) +
      (Number(watched.packagingCost) || 0) +
      (Number(watched.overheadCost) || 0) +
      (Number(watched.otherCost) || 0);

    const batch = materialCost + making;
    const yieldQty = Number(watched.batchYieldQuantity);
    const perUnit = yieldQty >= 1 ? batch / yieldQty : null;

    const marginAmount = perUnit === null ? null : sellingPrice - perUnit;
    const marginPercent =
      marginAmount === null || sellingPrice === 0 ? null : (marginAmount / sellingPrice) * 100;

    return { materialCost, making, batch, perUnit, marginAmount, marginPercent };
  }, [watched, materialById, sellingPrice]);

  const onSubmit = (values: CostSheetFormValues) => {
    if (sheet) update.mutate({ id: sheet.id, values }, { onSuccess: onDone });
    else create.mutate(values, { onSuccess: onDone });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Materials per batch</CardTitle>
            <p className="mt-1 text-xs text-ink-500">
              Quantities in each material&apos;s own unit. Leave the rate blank to use its current
              average cost - whichever rate is used gets frozen onto this sheet.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => itemsArray.append({ ...EMPTY_ITEM })}
          >
            <Plus className="h-4 w-4" /> Add material
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.items?.message && (
            <p className="text-sm text-paprika-600">{errors.items.message}</p>
          )}

          {itemsArray.fields.map((field, index) => {
            const material = materialById(watched.items?.[index]?.rawMaterialId);
            const unit = material ? unitShortLabel(material.baseUnit) : 'unit';
            const qty = Number(watched.items?.[index]?.quantity);
            const rateRaw = watched.items?.[index]?.ratePerUnit;
            const rate =
              rateRaw && rateRaw.trim() ? Number(rateRaw) : Number(material?.avgCostPerUnit ?? 0);
            const line = Number.isNaN(qty) || Number.isNaN(rate) ? 0 : qty * rate;

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
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
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
                    label={`Qty (${unit})`}
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
                    label={`Rate / ${unit}`}
                    className="sm:col-span-3"
                    error={errors.items?.[index]?.ratePerUnit?.message}
                    hint={material?.avgCostPerUnit ? `avg ${material.avgCostPerUnit}` : 'no average yet'}
                  >
                    <Input
                      inputMode="decimal"
                      placeholder={material?.avgCostPerUnit ?? '0.0000'}
                      {...register(`items.${index}.ratePerUnit` as const)}
                    />
                  </FormField>

                  <div className="flex items-end justify-between gap-2 sm:col-span-2">
                    <div className="text-right">
                      <p className="text-xs text-ink-500">Line</p>
                      <p className="font-data text-sm text-ink-900">{formatCurrency(line)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={itemsArray.fields.length === 1}
                      onClick={() => itemsArray.remove(index)}
                      aria-label="Remove material"
                    >
                      <Trash2 className="h-4 w-4 text-paprika-600" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Making costs</CardTitle>
            <p className="mt-1 text-xs text-ink-500">Per batch, entered by hand.</p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField label="Labour" htmlFor="labourCost" error={errors.labourCost?.message}>
              <Input id="labourCost" inputMode="decimal" {...register('labourCost')} />
            </FormField>
            <FormField label="Packaging" htmlFor="packagingCost" error={errors.packagingCost?.message}>
              <Input id="packagingCost" inputMode="decimal" {...register('packagingCost')} />
            </FormField>
            <FormField label="Overhead" htmlFor="overheadCost" error={errors.overheadCost?.message}>
              <Input id="overheadCost" inputMode="decimal" {...register('overheadCost')} />
            </FormField>
            <FormField label="Other" htmlFor="otherCost" error={errors.otherCost?.message}>
              <Input id="otherCost" inputMode="decimal" {...register('otherCost')} />
            </FormField>

            <FormField
              label="Batch yield"
              htmlFor="batchYieldQuantity"
              error={errors.batchYieldQuantity?.message}
              required
              hint="Sellable units one batch produces"
            >
              <Input
                id="batchYieldQuantity"
                inputMode="numeric"
                placeholder="100"
                invalid={!!errors.batchYieldQuantity}
                {...register('batchYieldQuantity')}
              />
            </FormField>

            <FormField label="Effective from" htmlFor="effectiveFrom" hint="Defaults to today">
              <Input id="effectiveFrom" type="date" {...register('effectiveFrom')} />
            </FormField>

            <FormField label="Notes" htmlFor="notes" className="sm:col-span-2">
              <Textarea id="notes" rows={2} {...register('notes')} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost and margin</CardTitle>
            <p className="mt-1 text-xs text-ink-500">
              Updates as you type. Recomputed on save, so it always matches the lines.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Materials</span>
              <span className="font-data">{formatCurrency(totals.materialCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Making costs</span>
              <span className="font-data">{formatCurrency(totals.making)}</span>
            </div>
            <div className="flex justify-between border-t border-paper-200 pt-2">
              <span className="text-ink-600">Batch total</span>
              <span className="font-data">{formatCurrency(totals.batch)}</span>
            </div>

            <div className="mt-3 rounded-md bg-paper-100 p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-600">Cost per unit</span>
                <span className="font-data text-2xl font-semibold text-ink-900">
                  {totals.perUnit === null ? '—' : formatCurrency(totals.perUnit)}
                </span>
              </div>
              {totals.perUnit === null && (
                <p className="mt-1 text-xs text-ink-500">Enter a batch yield of 1 or more.</p>
              )}
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex justify-between">
                <span className="text-ink-500">Selling price</span>
                <span className="font-data">{formatCurrency(sellingPrice)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-ink-600">Margin</span>
                <span
                  className={
                    totals.marginAmount !== null && totals.marginAmount < 0
                      ? 'font-data text-xl font-semibold text-paprika-600'
                      : 'font-data text-xl font-semibold text-moss-700'
                  }
                >
                  {totals.marginAmount === null ? '—' : formatCurrency(totals.marginAmount)}
                  {totals.marginPercent !== null && (
                    <span className="ml-2 text-sm font-normal">
                      ({totals.marginPercent.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
              {totals.marginAmount !== null && totals.marginAmount < 0 && (
                <p className="text-xs text-paprika-700">
                  This product would sell at a loss. Raise the price or reduce cost.
                </p>
              )}
              <p className="pt-1 text-xs text-ink-400">
                Margin is a share of the selling price, not a markup on cost.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-3">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
          {sheet ? 'Save corrections' : 'Save as new version'}
        </Button>
      </div>
    </form>
  );
}
