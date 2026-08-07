'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { faqSchema, type FaqFormValues } from '@/lib/validations/faq.schema';
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from '@/hooks/use-faqs';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import type { FaqItem } from '@/types/api';

function FaqDialog({
  open,
  onOpenChange,
  faq,
  nextSortOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq?: FaqItem;
  nextSortOrder: number;
}) {
  const isEdit = !!faq;
  const create = useCreateFaq();
  const update = useUpdateFaq();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: faq?.question || '',
      answer: faq?.answer || '',
      sortOrder: faq?.sortOrder ?? nextSortOrder,
      isActive: faq?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    reset({
      question: faq?.question || '',
      answer: faq?.answer || '',
      sortOrder: faq?.sortOrder ?? nextSortOrder,
      isActive: faq?.isActive ?? true,
    });
  }, [faq, nextSortOrder, reset]);

  const onSubmit = (values: FaqFormValues) => {
    if (isEdit) {
      update.mutate({ id: faq.id, values }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={isEdit ? 'Edit FAQ' : 'New FAQ'} description="Frequently asked questions shown on the storefront.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Question" htmlFor="question" error={errors.question?.message} required>
            <Input id="question" invalid={!!errors.question} {...register('question')} />
          </FormField>
          <FormField label="Answer" htmlFor="answer" error={errors.answer?.message} required>
            <Textarea id="answer" rows={4} invalid={!!errors.answer} {...register('answer')} />
          </FormField>
          <div className="flex items-center gap-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />}
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
              {isEdit ? 'Save changes' : 'Create FAQ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FaqsPage() {
  const { data: faqs, isLoading } = useFaqs();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FaqItem | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<FaqItem | undefined>();

  const sorted = React.useMemo(() => [...(faqs || [])].sort((a, b) => a.sortOrder - b.sortOrder), [faqs]);

  const move = (index: number, direction: -1 | 1) => {
    const target = sorted[index + direction];
    const current = sorted[index];
    if (!target) return;
    // Swap sortOrder values so the two items trade places.
    updateFaq.mutate({ id: current.id, values: { sortOrder: target.sortOrder } });
    updateFaq.mutate({ id: target.id, values: { sortOrder: current.sortOrder } });
  };

  return (
    <div>
      <PageHeader
        title="FAQs"
        description="Frequently asked questions"
        actions={
          <Button
            variant="gold"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New FAQ
          </Button>
        }
      />

      {isLoading ? (
        <PageSpinner />
      ) : sorted.length === 0 ? (
        <Card>
          <EmptyState icon={HelpCircle} title="No FAQs yet" />
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((faq, index) => (
            <Card key={faq.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-medium text-ink-900">{faq.question}</p>
                    <Badge variant={faq.isActive ? 'moss' : 'neutral'}>{faq.isActive ? 'Active' : 'Hidden'}</Badge>
                  </div>
                  <p className="text-sm text-ink-600">{faq.answer}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={index === sorted.length - 1} onClick={() => move(index, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(faq);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(faq)}>
                    <Trash2 className="h-4 w-4 text-paprika-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FaqDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        faq={editing}
        nextSortOrder={sorted.length}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete FAQ?"
        description={`"${deleteTarget?.question}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        loading={deleteFaq.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteFaq.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
