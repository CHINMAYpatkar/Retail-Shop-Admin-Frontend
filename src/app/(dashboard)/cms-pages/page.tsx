'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { cmsPageSchema, type CmsPageFormValues } from '@/lib/validations/cms-page.schema';
import { useCmsPages, useUpsertCmsPage, useDeleteCmsPage } from '@/hooks/use-cms-pages';
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
import { formatDate } from '@/lib/utils';
import type { CmsPage } from '@/types/api';

const SUGGESTED_PAGES = [
  { slug: 'about', title: 'About Us' },
  { slug: 'contact', title: 'Contact Us' },
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'terms', title: 'Terms & Conditions' },
  { slug: 'refund-policy', title: 'Refund Policy' },
];

function PageDialog({
  open,
  onOpenChange,
  page,
  presetSlug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: CmsPage;
  presetSlug?: { slug: string; title: string };
}) {
  const upsert = useUpsertCmsPage();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CmsPageFormValues>({
    resolver: zodResolver(cmsPageSchema),
    defaultValues: {
      slug: page?.slug || presetSlug?.slug || '',
      title: page?.title || presetSlug?.title || '',
      content: page?.content || '',
      metaTitle: page?.metaTitle || '',
      metaDescription: page?.metaDescription || '',
      isPublished: page?.isPublished ?? true,
    },
  });

  React.useEffect(() => {
    reset({
      slug: page?.slug || presetSlug?.slug || '',
      title: page?.title || presetSlug?.title || '',
      content: page?.content || '',
      metaTitle: page?.metaTitle || '',
      metaDescription: page?.metaDescription || '',
      isPublished: page?.isPublished ?? true,
    });
  }, [page, presetSlug, reset]);

  const onSubmit = (values: CmsPageFormValues) => {
    upsert.mutate(values, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={page ? 'Edit page' : 'New page'} description="Static content pages like About, Privacy, and Terms." className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Slug" htmlFor="slug" error={errors.slug?.message} required hint="URL path, e.g. about">
              <Input id="slug" invalid={!!errors.slug} disabled={!!page} {...register('slug')} />
            </FormField>
            <FormField label="Title" htmlFor="title" error={errors.title?.message} required>
              <Input id="title" invalid={!!errors.title} {...register('title')} />
            </FormField>
          </div>

          <FormField label="Content" htmlFor="content" error={errors.content?.message} required hint="Plain text or HTML">
            <Textarea id="content" rows={10} invalid={!!errors.content} {...register('content')} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Meta title" htmlFor="metaTitle">
              <Input id="metaTitle" {...register('metaTitle')} />
            </FormField>
            <FormField label="Meta description" htmlFor="metaDescription">
              <Input id="metaDescription" {...register('metaDescription')} />
            </FormField>
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="isPublished"
              control={control}
              render={({ field }) => (
                <Checkbox id="isPublished" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <label htmlFor="isPublished" className="text-sm text-ink-700">
              Published (visible on storefront)
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={upsert.isPending}>
              Save page
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CmsPagesPage() {
  const { data: pages, isLoading } = useCmsPages();
  const deletePage = useDeleteCmsPage();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CmsPage | undefined>();
  const [presetSlug, setPresetSlug] = React.useState<{ slug: string; title: string } | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<CmsPage | undefined>();

  const existingSlugs = new Set((pages || []).map((p) => p.slug));
  const missingSuggested = SUGGESTED_PAGES.filter((s) => !existingSlugs.has(s.slug));

  return (
    <div>
      <PageHeader
        title="CMS Pages"
        description="Static content: About, Contact, Privacy, Terms, Refund Policy"
        actions={
          <Button
            variant="gold"
            onClick={() => {
              setEditing(undefined);
              setPresetSlug(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New page
          </Button>
        }
      />

      {missingSuggested.length > 0 && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center gap-2 px-5 py-3">
            <span className="text-xs text-ink-500">Quick add:</span>
            {missingSuggested.map((s) => (
              <Button
                key={s.slug}
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(undefined);
                  setPresetSlug(s);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> {s.title}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : !pages || pages.length === 0 ? (
          <EmptyState icon={FileText} title="No pages yet" description="Add your first static page above." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="font-data text-xs text-ink-500">/{page.slug}</TableCell>
                  <TableCell className="text-sm text-ink-600">{formatDate(page.updatedAt)}</TableCell>
                  <TableCell>
                    <Badge variant={page.isPublished ? 'moss' : 'neutral'}>
                      {page.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(page);
                          setPresetSlug(undefined);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(page)}>
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

      <PageDialog open={dialogOpen} onOpenChange={setDialogOpen} page={editing} presetSlug={presetSlug} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete page?"
        description={`"${deleteTarget?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        loading={deletePage.isPending}
        onConfirm={() => {
          if (deleteTarget) deletePage.mutate(deleteTarget.slug, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
