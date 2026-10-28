'use client';

import * as React from 'react';
import { useFieldArray, useForm, type Control, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Columns3, Plus, Trash2 } from 'lucide-react';
import { footerSchema, type FooterFormValues } from '@/lib/validations/settings.schema';
import { useUpsertSetting } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * The storefront footer: columns of links, plus a closing note.
 *
 * Nested field arrays - columns, each with its own links - so the inner list
 * lives in its own component. `useFieldArray` must be called with a concrete
 * name, and a name built from a loop index cannot be hooked at the parent
 * level without breaking the rules of hooks.
 */
export function FooterSection({ initial }: { initial: FooterFormValues }) {
  const upsert = useUpsertSetting();
  const { register, control, handleSubmit, formState } = useForm<FooterFormValues>({
    resolver: zodResolver(footerSchema),
    values: initial,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'columns' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Columns3 className="h-4 w-4" /> Footer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => upsert.mutate({ key: 'footer', value: values }))}
          className="space-y-5"
        >
          <div className="space-y-4">
            {fields.map((field, columnIndex) => (
              <div key={field.id} className="rounded-md border border-ink-200 p-4">
                <div className="mb-3 flex items-end gap-3">
                  <FormField label="Column heading" className="flex-1">
                    <Input
                      {...register(`columns.${columnIndex}.heading`)}
                      placeholder="Shop"
                    />
                  </FormField>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(columnIndex)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <FooterLinks control={control} register={register} columnIndex={columnIndex} />
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ heading: '', links: [{ label: '', href: '' }] })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add column
          </Button>

          <FormField label="Closing note" hint="Shown beside the copyright line.">
            <Input {...register('note')} placeholder="Ground in Malvan. Shipped across India." />
          </FormField>

          <div>
            <Button type="submit" disabled={upsert.isPending || !formState.isDirty}>
              {upsert.isPending ? 'Saving…' : 'Save footer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FooterLinks({
  control,
  register,
  columnIndex,
}: {
  control: Control<FooterFormValues>;
  register: UseFormRegister<FooterFormValues>;
  columnIndex: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `columns.${columnIndex}.links`,
  });

  return (
    <div className="space-y-2.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-ink-400">Links</span>

      {fields.map((field, linkIndex) => (
        <div key={field.id} className="flex items-center gap-2">
          <Input
            {...register(`columns.${columnIndex}.links.${linkIndex}.label`)}
            placeholder="All products"
            className="flex-1"
          />
          <Input
            {...register(`columns.${columnIndex}.links.${linkIndex}.href`)}
            placeholder="/shop"
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => remove(linkIndex)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ label: '', href: '' })}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add link
      </Button>
    </div>
  );
}
