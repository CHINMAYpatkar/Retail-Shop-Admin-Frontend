'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, ImagePlus } from 'lucide-react';
import { productSchema, type ProductFormValues } from '@/lib/validations/product.schema';
import { useCategories } from '@/hooks/use-categories';
import { useIngredients } from '@/hooks/use-ingredients';
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import type { Product } from '@/types/api';

function toDefaultValues(product?: Product): ProductFormValues {
  return {
    name: product?.name || '',
    slug: product?.slug || '',
    shortDescription: product?.shortDescription || '',
    description: product?.description || '',
    price: product ? Number(product.price) : 0,
    compareAtPrice: product?.compareAtPrice ? Number(product.compareAtPrice) : null,
    weightGrams: product?.weightGrams ?? null,
    shelfLifeDays: product?.shelfLifeDays ?? null,
    storageInstructions: product?.storageInstructions || '',
    preparationProcess: product?.preparationProcess || '',
    stockQuantity: product?.stockQuantity ?? 0,
    sku: product?.sku || '',
    categoryId: product?.categoryId || '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    metaTitle: product?.metaTitle || '',
    metaDescription: product?.metaDescription || '',
    ingredientIds: product?.ingredients?.map((pi) => pi.ingredient.id) || [],
    images:
      product?.images.map((img) => ({
        url: img.url,
        altText: img.altText || '',
        sortOrder: img.sortOrder ?? 0,
        isVideo: img.isVideo ?? false,
      })) || [],
    variants:
      product?.variants.map((v) => ({
        name: v.name,
        sku: v.sku || '',
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
        stockQuantity: v.stockQuantity,
        isActive: v.isActive,
      })) || [],
  };
}

export function ProductForm({ product }: { product?: Product }) {
  const isEdit = !!product;
  const router = useRouter();
  const { data: categories } = useCategories();
  const { data: ingredients } = useIngredients();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toDefaultValues(product),
  });

  const imagesArray = useFieldArray({ control, name: 'images' });
  const variantsArray = useFieldArray({ control, name: 'variants' });

  const onSubmit = (values: ProductFormValues) => {
    const payload: ProductFormValues = { ...values, slug: values.slug || undefined };
    if (isEdit) {
      updateProduct.mutate(
        { id: product.id, values: payload },
        { onSuccess: () => router.push('/products') },
      );
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => router.push('/products'),
      });
    }
  };

  const saving = createProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-16">
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="name" error={errors.name?.message} required className="sm:col-span-2">
            <Input id="name" invalid={!!errors.name} {...register('name')} />
          </FormField>

          <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate">
            <Input id="slug" {...register('slug')} />
          </FormField>

          <FormField label="Category" htmlFor="categoryId" error={errors.categoryId?.message} required>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Short description" htmlFor="shortDescription" className="sm:col-span-2">
            <Textarea id="shortDescription" rows={2} {...register('shortDescription')} />
          </FormField>

          <FormField label="Full description" htmlFor="description" className="sm:col-span-2">
            <Textarea id="description" rows={4} {...register('description')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & inventory</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FormField label="Price (₹)" htmlFor="price" error={errors.price?.message} required>
            <Input id="price" type="number" step="0.01" invalid={!!errors.price} {...register('price')} />
          </FormField>
          <FormField label="Compare-at price" htmlFor="compareAtPrice" hint="Optional strike-through price">
            <Input id="compareAtPrice" type="number" step="0.01" {...register('compareAtPrice')} />
          </FormField>
          <FormField label="Stock quantity" htmlFor="stockQuantity">
            <Input id="stockQuantity" type="number" {...register('stockQuantity')} />
          </FormField>
          <FormField label="SKU" htmlFor="sku">
            <Input id="sku" {...register('sku')} />
          </FormField>
          <FormField label="Weight (grams)" htmlFor="weightGrams">
            <Input id="weightGrams" type="number" {...register('weightGrams')} />
          </FormField>
          <FormField label="Shelf life (days)" htmlFor="shelfLifeDays">
            <Input id="shelfLifeDays" type="number" {...register('shelfLifeDays')} />
          </FormField>
          <FormField label="Storage instructions" htmlFor="storageInstructions" className="col-span-2">
            <Input id="storageInstructions" {...register('storageInstructions')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preparation process</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} placeholder="How this spice is traditionally prepared..." {...register('preparationProcess')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => imagesArray.append({ url: '', altText: '', sortOrder: imagesArray.fields.length, isVideo: false })}
          >
            <ImagePlus className="h-4 w-4" /> Add image
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {imagesArray.fields.length === 0 && <p className="text-sm text-ink-500">No images added yet.</p>}
          {imagesArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3 rounded-md border border-paper-200 p-3">
              <FormField label="Image" className="flex-1">
                <Controller
                  control={control}
                  name={`images.${index}.url` as const}
                  render={({ field: imageField }) => (
                    <FileUpload
                      value={imageField.value ?? ''}
                      onChange={imageField.onChange}
                      folder="products"
                    />
                  )}
                />
              </FormField>
              <div className="flex-1 space-y-2">
                <FormField label="Alt text" hint="Describes the image for screen readers and SEO">
                  <Input {...register(`images.${index}.altText` as const)} />
                </FormField>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => imagesArray.remove(index)}
                  className="gap-1.5 text-paprika-600"
                >
                  <Trash2 className="h-4 w-4" /> Remove image
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              variantsArray.append({ name: '', sku: '', priceOverride: null, stockQuantity: 0, isActive: true })
            }
          >
            <Plus className="h-4 w-4" /> Add variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {variantsArray.fields.length === 0 && (
            <p className="text-sm text-ink-500">No variants — this product sells as a single size.</p>
          )}
          {variantsArray.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md border border-paper-200 p-3 sm:grid-cols-5">
              <FormField label="Name" hint="e.g. 250g">
                <Input {...register(`variants.${index}.name` as const)} />
              </FormField>
              <FormField label="SKU">
                <Input {...register(`variants.${index}.sku` as const)} />
              </FormField>
              <FormField label="Price override">
                <Input type="number" step="0.01" {...register(`variants.${index}.priceOverride` as const)} />
              </FormField>
              <FormField label="Stock">
                <Input type="number" {...register(`variants.${index}.stockQuantity` as const)} />
              </FormField>
              <div className="flex items-end justify-between">
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <Controller
                    name={`variants.${index}.isActive` as const}
                    control={control}
                    render={({ field: cf }) => <Checkbox checked={cf.value} onCheckedChange={cf.onChange} />}
                  />
                  Active
                </label>
                <Button type="button" variant="ghost" size="icon" onClick={() => variantsArray.remove(index)}>
                  <Trash2 className="h-4 w-4 text-paprika-600" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="ingredientIds"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ingredients?.map((ingredient) => {
                  const checked = field.value.includes(ingredient.id);
                  return (
                    <label key={ingredient.id} className="flex items-center gap-2 text-sm text-ink-700">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          if (value) field.onChange([...field.value, ingredient.id]);
                          else field.onChange(field.value.filter((id) => id !== ingredient.id));
                        }}
                      />
                      {ingredient.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visibility & SEO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />}
              />
              Active (visible on storefront)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />}
              />
              Featured on homepage
            </label>
          </div>
          <FormField label="Meta title" htmlFor="metaTitle">
            <Input id="metaTitle" {...register('metaTitle')} />
          </FormField>
          <FormField label="Meta description" htmlFor="metaDescription">
            <Input id="metaDescription" {...register('metaDescription')} />
          </FormField>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-paper-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl justify-end gap-2 px-6 py-3 pl-64">
          <Button type="button" variant="outline" onClick={() => router.push('/products')}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" loading={saving}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>
    </form>
  );
}
