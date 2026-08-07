'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { blogSchema, type BlogFormValues } from '@/lib/validations/blog.schema';
import { useCreateBlog, useUpdateBlog } from '@/hooks/use-blogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Blog } from '@/types/api';

function toDefaultValues(blog?: Blog): BlogFormValues {
  return {
    title: blog?.title || '',
    slug: blog?.slug || '',
    excerpt: blog?.excerpt || '',
    content: blog?.content || '',
    coverImageUrl: blog?.coverImageUrl || '',
    metaTitle: blog?.metaTitle || '',
    metaDescription: blog?.metaDescription || '',
    isPublished: blog?.isPublished ?? false,
  };
}

export function BlogForm({ blog }: { blog?: Blog }) {
  const isEdit = !!blog;
  const router = useRouter();
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: toDefaultValues(blog),
  });

  const onSubmit = (values: BlogFormValues) => {
    const payload = { ...values, slug: values.slug || undefined };
    if (isEdit) {
      updateBlog.mutate({ id: blog.id, values: payload }, { onSuccess: () => router.push('/blogs') });
    } else {
      createBlog.mutate(payload, { onSuccess: () => router.push('/blogs') });
    }
  };

  const saving = createBlog.isPending || updateBlog.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-16">
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Title" htmlFor="title" error={errors.title?.message} required className="sm:col-span-2">
            <Input id="title" invalid={!!errors.title} {...register('title')} />
          </FormField>
          <FormField label="Slug" htmlFor="slug" hint="Leave blank to auto-generate">
            <Input id="slug" {...register('slug')} />
          </FormField>
          <FormField label="Cover image URL" htmlFor="coverImageUrl">
            <Input id="coverImageUrl" placeholder="https://..." {...register('coverImageUrl')} />
          </FormField>
          <FormField label="Excerpt" htmlFor="excerpt" className="sm:col-span-2" hint="Short summary shown in listings">
            <Textarea id="excerpt" rows={2} {...register('excerpt')} />
          </FormField>
          <FormField label="Content" htmlFor="content" error={errors.content?.message} required className="sm:col-span-2">
            <Textarea id="content" rows={12} invalid={!!errors.content} {...register('content')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishing & SEO</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 sm:col-span-2">
            <Controller
              name="isPublished"
              control={control}
              render={({ field }) => <Checkbox id="isPublished" checked={field.value} onCheckedChange={field.onChange} />}
            />
            <label htmlFor="isPublished" className="text-sm text-ink-700">
              Published (visible on storefront)
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
          <Button type="button" variant="outline" onClick={() => router.push('/blogs')}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" loading={saving}>
            {isEdit ? 'Save changes' : 'Create post'}
          </Button>
        </div>
      </div>
    </form>
  );
}
