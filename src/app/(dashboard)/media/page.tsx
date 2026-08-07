'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ImageOff, Search, UploadCloud, Link as LinkIcon, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useMediaAssets, useAddMediaByUrl, useUploadMedia, useDeleteMedia } from '@/hooks/use-media';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MediaAsset, MediaType } from '@/types/api';

const addByUrlSchema = z.object({
  fileName: z.string().min(1, 'Give this asset a name'),
  url: z.string().min(1, 'URL is required'),
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
  folder: z.string().optional().or(z.literal('')),
});
type AddByUrlValues = z.infer<typeof addByUrlSchema>;

const FOLDERS = ['products', 'banners', 'recipes', 'reviews', 'blogs', 'ingredients', 'categories', 'misc'];

function AddByUrlDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addByUrl = useAddMediaByUrl();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddByUrlValues>({
    resolver: zodResolver(addByUrlSchema),
    defaultValues: { fileName: '', url: '', type: 'IMAGE', folder: 'misc' },
  });

  const onSubmit = (values: AddByUrlValues) => {
    addByUrl.mutate(
      { ...values, folder: values.folder || undefined },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add media by URL" description="Register an asset you already have a link for - no upload needed.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" htmlFor="fileName" error={errors.fileName?.message} required>
            <Input id="fileName" placeholder="e.g. garam-masala-hero" invalid={!!errors.fileName} {...register('fileName')} />
          </FormField>
          <FormField label="URL" htmlFor="url" error={errors.url?.message} required>
            <Input id="url" placeholder="https://..." invalid={!!errors.url} {...register('url')} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type" htmlFor="type">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Folder" htmlFor="folder">
              <Controller
                name="folder"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || 'misc'} onValueChange={field.onChange}>
                    <SelectTrigger id="folder">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLDERS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={addByUrl.isPending}>
              Add asset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const upload = useUploadMedia();
  const [file, setFile] = React.useState<File | null>(null);
  const [folder, setFolder] = React.useState('misc');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Upload from device"
        description="Uploads directly to S3 via a presigned URL. Requires AWS credentials configured on the backend."
      >
        <div className="space-y-4">
          <FormField label="File">
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </FormField>
          <FormField label="Folder">
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLDERS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="gold"
              loading={upload.isPending}
              disabled={!file}
              onClick={() => {
                if (!file) return;
                upload.mutate(
                  { file, folder },
                  {
                    onSuccess: () => {
                      setFile(null);
                      onOpenChange(false);
                    },
                  },
                );
              }}
            >
              Upload
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssetCard({ asset, onDelete }: { asset: MediaAsset; onDelete: () => void }) {
  const copyUrl = () => {
    navigator.clipboard.writeText(asset.url);
    toast.success('URL copied to clipboard');
  };

  return (
    <Card className="group relative overflow-hidden">
      <div className="aspect-square bg-paper-100">
        {asset.type === 'IMAGE' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt={asset.fileName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-300">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-medium text-ink-800">{asset.fileName}</p>
        <p className="text-[11px] text-ink-400">{asset.folder || 'misc'}</p>
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={copyUrl}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-ink-600 shadow-subtle hover:text-gold-700"
          aria-label="Copy URL"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-paprika-600 shadow-subtle hover:bg-paprika-100"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}

export default function MediaLibraryPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState<MediaType | ''>('');
  const [addByUrlOpen, setAddByUrlOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<MediaAsset | undefined>();

  const { data, isLoading } = useMediaAssets({ page, limit: 24, search: search || undefined, type: type || undefined });
  const deleteMedia = useDeleteMedia();

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Images, videos, and documents used across the storefront"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddByUrlOpen(true)}>
              <LinkIcon className="h-4 w-4" /> Add by URL
            </Button>
            <Button variant="gold" onClick={() => setUploadOpen(true)}>
              <UploadCloud className="h-4 w-4" /> Upload
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search files..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={type || 'all'}
          onValueChange={(v) => {
            setType(v === 'all' ? '' : (v as MediaType));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="IMAGE">Images</SelectItem>
            <SelectItem value="VIDEO">Videos</SelectItem>
            <SelectItem value="DOCUMENT">Documents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading || !data ? (
        <PageSpinner />
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={ImageOff}
            title="No media yet"
            description='Use "Add by URL" if you already have image links, or "Upload" once AWS S3 credentials are configured on the backend.'
            action={
              <Button variant="gold" size="sm" onClick={() => setAddByUrlOpen(true)}>
                <Plus className="h-4 w-4" /> Add your first asset
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {data.items.map((asset) => (
              <AssetCard key={asset.id} asset={asset} onDelete={() => setDeleteTarget(asset)} />
            ))}
          </div>
          <Card className="mt-3">
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </Card>
        </>
      )}

      <AddByUrlDialog open={addByUrlOpen} onOpenChange={setAddByUrlOpen} />
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete asset?"
        description={`"${deleteTarget?.fileName}" will be permanently removed${deleteTarget?.url.includes('amazonaws.com') ? ' from S3' : ''}.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMedia.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMedia.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
