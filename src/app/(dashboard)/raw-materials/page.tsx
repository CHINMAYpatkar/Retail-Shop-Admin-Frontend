'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import {
  useRawMaterials,
  useCreateRawMaterial,
  useUpdateRawMaterial,
  useDeleteRawMaterial,
} from '@/hooks/use-raw-materials';
import { useIngredients } from '@/hooks/use-ingredients';
import { rawMaterialSchema, type RawMaterialFormValues } from '@/lib/validations/raw-material.schema';
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
import { MEASUREMENT_UNITS, unitShortLabel, type RawMaterial } from '@/types/api';

const EMPTY: RawMaterialFormValues = {
  name: '',
  code: '',
  baseUnit: 'GRAM',
  stockQuantity: '',
  reorderLevel: '',
  avgCostPerUnit: '',
  ingredientId: '',
  notes: '',
  isActive: true,
};

/** True when the material has a reorder level and is at or below it. */
function isLow(material: RawMaterial): boolean {
  if (material.reorderLevel === null || material.reorderLevel === undefined) return false;
  return Number(material.stockQuantity) <= Number(material.reorderLevel);
}

function RawMaterialDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: RawMaterial;
}) {
  const create = useCreateRawMaterial();
  const update = useUpdateRawMaterial();
  const { data: ingredients } = useIngredients();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<RawMaterialFormValues>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: EMPTY,
  });

  const unit = watch('baseUnit');
  // The API refuses a unit change while stock exists, because the stored
  // quantity was recorded in the old unit. Disable rather than let it fail.
  const hasStock = Boolean(editing && Number(editing.stockQuantity) !== 0);

  React.useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            name: editing.name,
            code: editing.code ?? '',
            baseUnit: editing.baseUnit,
            stockQuantity: editing.stockQuantity ?? '',
            reorderLevel: editing.reorderLevel ?? '',
            avgCostPerUnit: editing.avgCostPerUnit ?? '',
            ingredientId: editing.ingredientId ?? '',
            notes: editing.notes ?? '',
            isActive: editing.isActive,
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  const onSubmit = (values: RawMaterialFormValues) => {
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
        title={editing ? 'Edit raw material' : 'New raw material'}
        description="What you actually buy and stock - including packaging like jars and labels, which have no storefront ingredient."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
              <Input
                id="name"
                placeholder="e.g. Turmeric powder (bulk)"
                invalid={!!errors.name}
                {...register('name')}
              />
            </FormField>

            <FormField label="Code" htmlFor="code" hint="Your own reference. Must be unique.">
              <Input id="code" placeholder="RM-TUR-01" {...register('code')} />
            </FormField>

            <FormField
              label="Base unit"
              required
              hint={
                hasStock
                  ? 'Locked while stock exists - the quantity was recorded in this unit'
                  : 'Everything is measured in this one unit. No conversion.'
              }
            >
              <Controller
                control={control}
                name="baseUnit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={hasStock}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="Linked ingredient"
              hint="Optional - only for materials shown on the storefront"
            >
              <Controller
                control={control}
                name="ingredientId"
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ingredients?.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label={`Stock (${unitShortLabel(unit)})`}
              htmlFor="stockQuantity"
              error={errors.stockQuantity?.message}
              hint={editing ? 'Purchases will add to this' : 'Opening stock'}
            >
              <Input id="stockQuantity" inputMode="decimal" placeholder="0" {...register('stockQuantity')} />
            </FormField>

            <FormField
              label={`Reorder level (${unitShortLabel(unit)})`}
              htmlFor="reorderLevel"
              error={errors.reorderLevel?.message}
              hint="Flagged as low at or below this"
            >
              <Input id="reorderLevel" inputMode="decimal" {...register('reorderLevel')} />
            </FormField>

            <FormField
              label={`Cost per ${unitShortLabel(unit)}`}
              htmlFor="avgCostPerUnit"
              error={errors.avgCostPerUnit?.message}
              hint="Maintained automatically once bills are recorded"
              className="sm:col-span-2"
            >
              <Input id="avgCostPerUnit" inputMode="decimal" placeholder="0.0000" {...register('avgCostPerUnit')} />
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
                Active - available when recording bills and cost sheets
              </label>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Create material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RawMaterialsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [lowOnly, setLowOnly] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RawMaterial | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<RawMaterial | undefined>();

  const { data, isLoading } = useRawMaterials({
    page,
    limit: 20,
    search: search || undefined,
    lowStockOnly: lowOnly || undefined,
  });
  const deleteMaterial = useDeleteRawMaterial();

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const lowCount = data?.items.filter(isLow).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Raw materials"
        description="Operational stock - what you buy, hold and consume. Separate from storefront ingredients."
        actions={
          <Button variant="gold" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New material
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search by name or code..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-ink-600">
          <Checkbox
            checked={lowOnly}
            onCheckedChange={(value) => {
              setLowOnly(Boolean(value));
              setPage(1);
            }}
          />
          Low stock only
        </label>

        {!lowOnly && lowCount > 0 && (
          <Badge variant="paprika">
            {lowCount} low on this page
          </Badge>
        )}
      </div>

      <Card>
        {isLoading || !data ? (
          <PageSpinner />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              lowOnly
                ? 'Nothing is low on stock'
                : search
                  ? 'No materials match that search'
                  : 'No raw materials yet'
            }
            description={
              lowOnly
                ? 'Every material with a reorder level is above it.'
                : 'Add what you buy - spices in bulk, and packaging like jars, labels and pouches.'
            }
            action={
              lowOnly || search ? undefined : (
                <Button variant="gold" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New material
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
                  <TableHead>Code</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reorder at</TableHead>
                  <TableHead className="text-right">Cost / unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((material) => {
                  const low = isLow(material);
                  return (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium text-ink-900">{material.name}</TableCell>
                      <TableCell className="font-data text-xs text-ink-500">{material.code || '-'}</TableCell>
                      <TableCell className="text-sm text-ink-600">
                        {material.ingredient?.name || <span className="text-ink-300">-</span>}
                      </TableCell>
                      <TableCell className="text-right font-data">
                        <span className={low ? 'font-semibold text-paprika-600' : ''}>
                          {material.stockQuantity} {unitShortLabel(material.baseUnit)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-data text-xs text-ink-500">
                        {material.reorderLevel ?? '-'}
                      </TableCell>
                      <TableCell className="text-right font-data text-xs text-ink-600">
                        {material.avgCostPerUnit ?? '-'}
                      </TableCell>
                      <TableCell>
                        {low ? (
                          <Badge variant="paprika">Low stock</Badge>
                        ) : (
                          <Badge variant={material.isActive ? 'moss' : 'neutral'}>
                            {material.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(material);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(material)}>
                          <Trash2 className="h-4 w-4 text-paprika-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <RawMaterialDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete raw material?"
        description={`"${deleteTarget?.name}" will be removed permanently. If bills or cost sheets reference it the delete will be refused - mark it inactive instead.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMaterial.isPending}
        onConfirm={() => {
          if (deleteTarget)
            deleteMaterial.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
