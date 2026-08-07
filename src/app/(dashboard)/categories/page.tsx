'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { categorySchema, type CategoryFormValues } from '@/lib/validations/category.schema';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-categories';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import type { Category } from '@/types/api';

function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
}) {
  const isEdit = !!category;
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      imageUrl: category?.imageUrl || '',
      isActive: category?.isActive ?? true,
      sortOrder: category?.sortOrder ?? 0,
    },
  });

  React.useEffect(() => {
    reset({
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      imageUrl: category?.imageUrl || '',
      isActive: category?.isActive ?? true,
      sortOrder: category?.sortOrder ?? 0,
    });
  }, [category, reset]);

  const onSubmit = (values: CategoryFormValues) => {
    const payload = { ...values, slug: values.slug || undefined };
    if (isEdit) {
      update.mutate({ id: category.id, values: payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={isEdit ? 'Edit category' : 'New category'} description="Categories organize your spice catalog for browsing.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" invalid={!!errors.name} {...register('name')} />
          </FormField>
          <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate from the name">
            <Input id="slug" placeholder="e.g. garam-masala" {...register('slug')} />
          </FormField>
          <FormField label="Description" htmlFor="description">
            <Textarea id="description" rows={3} {...register('description')} />
          </FormField>
          <FormField label="Image URL" htmlFor="imageUrl">
            <Input id="imageUrl" placeholder="https://..." {...register('imageUrl')} />
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
              Visible on storefront
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
              {isEdit ? 'Save changes' : 'Create category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<Category | undefined>();

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize products into browsable groups"
        actions={
          <Button
            variant="gold"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : !categories || categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No categories yet"
            description="Create your first category to start organizing products."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="font-data text-xs text-ink-500">{category.slug}</TableCell>
                  <TableCell>{category._count?.products ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? 'moss' : 'neutral'}>
                      {category.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(category);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(category)}>
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

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete category?"
        description={`"${deleteTarget?.name}" will be permanently removed. This only works if no products are assigned to it.`}
        confirmLabel="Delete"
        destructive
        loading={deleteCategory.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteCategory.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
