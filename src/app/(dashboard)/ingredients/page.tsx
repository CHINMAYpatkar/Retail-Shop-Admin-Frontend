'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Leaf, Search } from 'lucide-react';
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from '@/hooks/use-ingredients';
import { ingredientSchema, type IngredientFormValues } from '@/lib/validations/ingredient.schema';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/ui/file-upload';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Ingredient } from '@/types/api';

const EMPTY: IngredientFormValues = {
  name: '',
  slug: '',
  description: '',
  benefits: '',
  imageUrl: '',
  isActive: true,
};

function IngredientDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Ingredient;
}) {
  const create = useCreateIngredient();
  const update = useUpdateIngredient();
  const isEdit = Boolean(editing);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: EMPTY,
  });

  // Repopulate whenever the dialog opens, so switching rows doesn't leave the
  // previous ingredient's values behind.
  React.useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            name: editing.name,
            slug: editing.slug ?? '',
            description: editing.description ?? '',
            benefits: editing.benefits ?? '',
            imageUrl: editing.imageUrl ?? '',
            isActive: editing.isActive,
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  const onSubmit = (values: IngredientFormValues) => {
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
        title={isEdit ? 'Edit ingredient' : 'New ingredient'}
        description="Ingredients are the story behind a product - they appear on the storefront and can be attached to products and recipes."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" placeholder="e.g. Turmeric" invalid={!!errors.name} {...register('name')} />
          </FormField>

          <FormField
            label="Slug"
            htmlFor="slug"
            error={errors.slug?.message}
            hint="Leave blank to generate from the name"
          >
            <Input id="slug" placeholder="turmeric" invalid={!!errors.slug} {...register('slug')} />
          </FormField>

          <FormField label="Image" htmlFor="imageUrl">
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <FileUpload value={field.value ?? ''} onChange={field.onChange} folder="ingredients" />
              )}
            />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <Textarea
              id="description"
              rows={3}
              placeholder="What it is, where it comes from..."
              {...register('description')}
            />
          </FormField>

          <FormField label="Benefits" htmlFor="benefits" hint="Why it matters - shown on the storefront">
            <Textarea id="benefits" rows={3} placeholder="Anti-inflammatory, aids digestion..." {...register('benefits')} />
          </FormField>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                Active - visible on the storefront
              </label>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
              {isEdit ? 'Save changes' : 'Create ingredient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IngredientsPage() {
  const { data, isLoading } = useIngredients();
  const deleteIngredient = useDeleteIngredient();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Ingredient | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<Ingredient | undefined>();
  const [search, setSearch] = React.useState('');

  // The endpoint returns the full list, so filtering client-side avoids a round
  // trip and keeps typing instant.
  const filtered = React.useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return term ? data.filter((i) => i.name.toLowerCase().includes(term)) : data;
  }, [data, search]);

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Ingredients"
        description="The building blocks of your products - each one can carry its own image, story and benefits."
        actions={
          <Button variant="gold" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New ingredient
          </Button>
        }
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data?.length ? (
        <EmptyState
          icon={Leaf}
          title="No ingredients yet"
          description="Add your first ingredient, then attach it to products and recipes."
          action={
            <Button variant="gold" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New ingredient
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                placeholder="Search ingredients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <span className="font-data text-xs text-ink-400">
              {filtered.length} of {data.length}
            </span>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Benefits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell>
                      {ingredient.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ingredient.imageUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper-100 text-ink-300">
                          <Leaf className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-ink-900">{ingredient.name}</TableCell>
                    <TableCell className="font-data text-xs text-ink-500">{ingredient.slug}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-ink-600">
                      {ingredient.benefits || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ingredient.isActive ? 'moss' : 'neutral'}>
                        {ingredient.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ingredient)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(ingredient)}>
                        <Trash2 className="h-4 w-4 text-paprika-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <IngredientDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete ingredient?"
        description={`"${deleteTarget?.name}" will be removed. Products and recipes referencing it will lose that link.`}
        confirmLabel="Delete"
        destructive
        loading={deleteIngredient.isPending}
        onConfirm={() => {
          if (deleteTarget)
            deleteIngredient.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
