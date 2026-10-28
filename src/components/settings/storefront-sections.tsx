'use client';

import * as React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image as ImageIcon, Megaphone, LayoutGrid, Columns3, Plus, Trash2 } from 'lucide-react';
import {
  brandingSchema,
  announcementSchema,
  uspStripSchema,
  homeSectionsSchema,
  footerSchema,
  type BrandingFormValues,
  type AnnouncementFormValues,
  type UspStripFormValues,
  type HomeSectionsFormValues,
  type FooterFormValues,
} from '@/lib/validations/settings.schema';
import { useUpsertSetting } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Forms for the five settings keys the storefront renders its chrome from.
 *
 * Until these existed the only way to change the announcement bar, the logo,
 * the home headings or the footer was to edit JSON in the database - which
 * made the "no static content, all admin-managed" promise technically true and
 * practically useless.
 *
 * The storefront treats every field as optional and renders nothing when one is
 * absent, so these forms do not need to enforce much. Leaving a heading blank
 * is a legitimate way to hide a section.
 */

/** The icon names the storefront's USP strip knows how to render. */
const USP_ICONS = ['leaf', 'sparkles', 'package', 'truck'] as const;

export function BrandingSection({ initial }: { initial: BrandingFormValues }) {
  const upsert = useUpsertSetting();
  const { control, handleSubmit, setValue, watch, formState } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    values: initial,
  });

  const logoUrl = watch('logoUrl') ?? '';
  const faviconUrl = watch('faviconUrl') ?? '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Branding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => upsert.mutate({ key: 'branding', value: values }))}
          className="space-y-5"
        >
          <FormField
            label="Logo"
            hint="Shown in the header and footer. Leave empty to use the wordmark instead."
          >
            <FileUpload
              value={logoUrl}
              onChange={(url) => setValue('logoUrl', url, { shouldDirty: true })}
              folder="misc"
            />
          </FormField>

          <FormField label="Favicon" hint="The small icon in the browser tab.">
            <FileUpload
              value={faviconUrl}
              onChange={(url) => setValue('faviconUrl', url, { shouldDirty: true })}
              folder="misc"
            />
          </FormField>

          <FormField
            label="Wordmark"
            hint="The shop name, set in the display typeface when no logo is uploaded."
          >
            <Input {...control.register('wordmark')} placeholder="Patkar Masale" />
          </FormField>

          <Button type="submit" disabled={upsert.isPending || !formState.isDirty}>
            {upsert.isPending ? 'Saving…' : 'Save branding'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function AnnouncementSection({ initial }: { initial: AnnouncementFormValues }) {
  const upsert = useUpsertSetting();
  const { register, handleSubmit, formState } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    values: initial,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-4 w-4" /> Announcement bar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => upsert.mutate({ key: 'announcement', value: values }))}
          className="space-y-5"
        >
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" {...register('enabled')} className="h-4 w-4" />
            Show the bar above the header
          </label>

          <FormField
            label="Message"
            hint="Customers can dismiss it. Changing the text shows it again to everyone."
          >
            <Input {...register('message')} placeholder="Free delivery on orders over ₹800" />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Link label (optional)">
              <Input {...register('linkLabel')} placeholder="Shop now" />
            </FormField>
            <FormField label="Link URL (optional)">
              <Input {...register('linkUrl')} placeholder="/shop" />
            </FormField>
          </div>

          <Button type="submit" disabled={upsert.isPending || !formState.isDirty}>
            {upsert.isPending ? 'Saving…' : 'Save announcement'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function UspStripSection({ initial }: { initial: UspStripFormValues }) {
  const upsert = useUpsertSetting();
  const { register, control, handleSubmit, formState } = useForm<UspStripFormValues>({
    resolver: zodResolver(uspStripSchema),
    values: initial,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" /> Why buy from us
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => upsert.mutate({ key: 'usp_strip', value: values }))}
          className="space-y-5"
        >
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" {...register('enabled')} className="h-4 w-4" />
            Show the strip on the home page
          </label>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-md border border-ink-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-ink-400">
                    Item {index + 1}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                  <FormField label="Icon">
                    {/* A fixed list: the storefront only ships these icons, and
                        anything else silently falls back to a default. */}
                    <select
                      {...register(`items.${index}.icon`)}
                      className="h-10 w-full rounded-md border border-ink-200 bg-paper-50 px-3 text-sm"
                    >
                      {USP_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Title">
                    <Input {...register(`items.${index}.title`)} placeholder="Whole spices only" />
                  </FormField>
                </div>

                <FormField label="Description" className="mt-4">
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder="Bought whole, ground shortly before it reaches you."
                  />
                </FormField>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ icon: 'leaf', title: '', description: '' })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add item
          </Button>

          <div>
            <Button type="submit" disabled={upsert.isPending || !formState.isDirty}>
              {upsert.isPending ? 'Saving…' : 'Save strip'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function HomeSectionsSection({ initial }: { initial: HomeSectionsFormValues }) {
  const upsert = useUpsertSetting();
  const { register, control, handleSubmit, formState } = useForm<HomeSectionsFormValues>({
    resolver: zodResolver(homeSectionsSchema),
    values: initial,
  });
  const { fields } = useFieldArray({ control, name: 'sections' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" /> Home page sections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => upsert.mutate({ key: 'home_sections', value: values }))}
          className="space-y-5"
        >
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-md border border-ink-200 p-4">
              {/* The key is shown but not editable: the storefront looks each
                  section up by key, so changing one here would silently detach
                  the heading from the section it belongs to. */}
              <div className="mb-3 flex items-center justify-between">
                <code className="rounded bg-paper-200 px-2 py-0.5 text-xs text-ink-600">
                  {field.key}
                </code>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...register(`sections.${index}.enabled`)}
                    className="h-4 w-4"
                  />
                  Show
                </label>
              </div>
              <input type="hidden" {...register(`sections.${index}.key`)} />

              <FormField label="Heading">
                <Input {...register(`sections.${index}.heading`)} placeholder="Ground this week" />
              </FormField>
              <FormField label="Sub-heading" className="mt-4">
                <Textarea
                  {...register(`sections.${index}.subheading`)}
                  rows={2}
                  placeholder="We grind to order rather than holding inventory."
                />
              </FormField>
            </div>
          ))}

          <Button type="submit" disabled={upsert.isPending || !formState.isDirty}>
            {upsert.isPending ? 'Saving…' : 'Save sections'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
