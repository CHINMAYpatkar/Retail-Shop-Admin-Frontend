'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { bannerSchema, type BannerFormValues } from '@/lib/validations/banner.schema';
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/hooks/use-banners';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { FileUpload } from '@/components/ui/file-upload';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Banner, BannerPlacement } from '@/types/api';

const PLACEMENTS: BannerPlacement[] = ['HOME_HERO', 'HOME_OFFER', 'CATEGORY', 'SLIDER'];

function BannerDialog({
  open,
  onOpenChange,
  banner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: Banner;
}) {
  const isEdit = !!banner;
  const create = useCreateBanner();
  const update = useUpdateBanner();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title || '',
      subtitle: banner?.subtitle || '',
      imageUrl: banner?.imageUrl || '',
      ctaLabel: banner?.ctaLabel || '',
      ctaUrl: banner?.ctaUrl || '',
      placement: banner?.placement || 'HOME_HERO',
      sortOrder: banner?.sortOrder ?? 0,
      isActive: banner?.isActive ?? true,
      startsAt: banner?.startsAt?.slice(0, 10) || '',
      endsAt: banner?.endsAt?.slice(0, 10) || '',
    },
  });

  React.useEffect(() => {
    reset({
      title: banner?.title || '',
      subtitle: banner?.subtitle || '',
      imageUrl: banner?.imageUrl || '',
      ctaLabel: banner?.ctaLabel || '',
      ctaUrl: banner?.ctaUrl || '',
      placement: banner?.placement || 'HOME_HERO',
      sortOrder: banner?.sortOrder ?? 0,
      isActive: banner?.isActive ?? true,
      startsAt: banner?.startsAt?.slice(0, 10) || '',
      endsAt: banner?.endsAt?.slice(0, 10) || '',
    });
  }, [banner, reset]);

  const onSubmit = (values: BannerFormValues) => {
    const payload = {
      ...values,
      startsAt: values.startsAt || undefined,
      endsAt: values.endsAt || undefined,
    };
    if (isEdit) {
      update.mutate({ id: banner.id, values: payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={isEdit ? 'Edit banner' : 'New banner'} description="Banners appear on the storefront homepage and category pages." className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Title" htmlFor="title" error={errors.title?.message} required>
              <Input id="title" invalid={!!errors.title} {...register('title')} />
            </FormField>
            <FormField label="Placement" htmlFor="placement" error={errors.placement?.message} required>
              <Controller
                name="placement"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="placement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLACEMENTS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <FormField label="Subtitle" htmlFor="subtitle">
            <Input id="subtitle" {...register('subtitle')} />
          </FormField>

          <FormField
            label="Image"
            htmlFor="imageUrl"
            error={errors.imageUrl?.message}
            required
            hint="Shown on its own, and used as the poster frame if you add a video"
          >
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <FileUpload value={field.value ?? ''} onChange={field.onChange} folder="banners" />
              )}
            />
          </FormField>

          <FormField
            label="Video (optional)"
            htmlFor="videoUrl"
            hint="Promo or advertisement clip. MP4 or WebM, up to 200MB."
          >
            <Controller
              control={control}
              name="videoUrl"
              render={({ field }) => (
                <FileUpload
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  folder="banners"
                  variant="video"
                  accept="video/mp4,video/webm"
                />
              )}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="CTA label" htmlFor="ctaLabel" hint="e.g. Shop now">
              <Input id="ctaLabel" {...register('ctaLabel')} />
            </FormField>
            <FormField label="CTA URL" htmlFor="ctaUrl">
              <Input id="ctaUrl" {...register('ctaUrl')} />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Sort order" htmlFor="sortOrder">
              <Input id="sortOrder" type="number" {...register('sortOrder')} />
            </FormField>
            <FormField label="Starts" htmlFor="startsAt" hint="Optional">
              <Input id="startsAt" type="date" {...register('startsAt')} />
            </FormField>
            <FormField label="Ends" htmlFor="endsAt" hint="Optional">
              <Input id="endsAt" type="date" {...register('endsAt')} />
            </FormField>
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />}
            />
            <label htmlFor="isActive" className="text-sm text-ink-700">
              Active
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
              {isEdit ? 'Save changes' : 'Create banner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BannersPage() {
  const { data: banners, isLoading } = useBanners();
  const deleteBanner = useDeleteBanner();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Banner | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<Banner | undefined>();

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Homepage hero, offer, category, and slider banners"
        actions={
          <Button
            variant="gold"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New banner
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : !banners || banners.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No banners yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banner</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={banner.imageUrl} alt="" className="h-9 w-16 rounded-md object-cover" />
                      <div>
                        <p className="font-medium text-ink-900">{banner.title}</p>
                        {banner.subtitle && <p className="text-xs text-ink-500">{banner.subtitle}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="clove">{banner.placement.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={banner.isActive ? 'moss' : 'neutral'}>{banner.isActive ? 'Active' : 'Hidden'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(banner);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(banner)}>
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

      <BannerDialog open={dialogOpen} onOpenChange={setDialogOpen} banner={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete banner?"
        description={`"${deleteTarget?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        loading={deleteBanner.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteBanner.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
