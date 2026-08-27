'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Wallet, Search } from 'lucide-react';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses';
import { useVendors } from '@/hooks/use-vendors';
import { expenseSchema, type ExpenseFormValues } from '@/lib/validations/expense.schema';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { DocumentUpload } from '@/components/ui/document-upload';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_MODES,
  type Expense,
  type ExpenseCategory,
} from '@/types/api';

const EMPTY: ExpenseFormValues = {
  category: 'MISC',
  title: '',
  amount: '',
  spentOn: '',
  method: 'CASH',
  vendorId: '',
  attachmentMediaId: '',
  notes: '',
};

const categoryLabel = (value: string) =>
  EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
const methodLabel = (value: string) => PAYMENT_MODES.find((m) => m.value === value)?.label ?? value;

function ExpenseDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Expense;
}) {
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const { data: vendors } = useVendors({ limit: 100, isActive: true });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({ resolver: zodResolver(expenseSchema), defaultValues: EMPTY });

  React.useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            category: editing.category,
            title: editing.title,
            amount: editing.amount,
            spentOn: editing.spentOn.slice(0, 10),
            method: editing.method,
            vendorId: editing.vendorId ?? '',
            attachmentMediaId: editing.attachmentMediaId ?? '',
            notes: editing.notes ?? '',
          }
        : EMPTY,
    );
  }, [open, editing, reset]);

  const onSubmit = (values: ExpenseFormValues) => {
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
        title={editing ? 'Edit expense' : 'Record an expense'}
        description="Money spent running the business - rent, packaging, transport. Not raw materials, which go on a purchase bill."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category" required>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Amount" htmlFor="amount" error={errors.amount?.message} required>
              <Input id="amount" inputMode="decimal" invalid={!!errors.amount} {...register('amount')} />
            </FormField>

            <FormField
              label="What was it for"
              htmlFor="title"
              error={errors.title?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                id="title"
                placeholder="e.g. Workshop rent for August"
                invalid={!!errors.title}
                {...register('title')}
              />
            </FormField>

            <FormField label="Spent on" htmlFor="spentOn" error={errors.spentOn?.message} required>
              <Input id="spentOn" type="date" invalid={!!errors.spentOn} {...register('spentOn')} />
            </FormField>

            <FormField label="Method" required>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="Vendor"
              hint="Optional - only if paid to a vendor you track"
              className="sm:col-span-2"
            >
              <Controller
                control={control}
                name="vendorId"
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {vendors?.items.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <FormField label="Receipt" hint="Stored privately - only readable by an admin">
            <Controller
              control={control}
              name="attachmentMediaId"
              render={({ field }) => (
                <DocumentUpload
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  fallbackLabel="Attached receipt"
                />
              )}
            />
          </FormField>

          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={2} {...register('notes')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Record expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string>('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | undefined>();

  const { data, isLoading } = useExpenses({
    page,
    limit: 20,
    search: search || undefined,
    category: (category || undefined) as ExpenseCategory | undefined,
  });
  const deleteExpense = useDeleteExpense();

  const filtering = Boolean(search || category);

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Money spent running the business. Raw materials belong on a purchase bill instead."
        actions={
          <Button variant="gold" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Record expense
          </Button>
        }
      />

      {data && data.total > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-ink-500">
                {filtering ? 'Total (filtered)' : 'Total spend'}
              </p>
              <p className="mt-1 font-data text-xl text-ink-900">
                {formatCurrency(Number(data.summary.totalAmount))}
              </p>
              <p className="mt-1 text-xs text-ink-400">{data.total} entries</p>
            </CardContent>
          </Card>
          {data.summary.byCategory.slice(0, 3).map((row) => (
            <Card key={row.category}>
              <CardContent className="pt-5">
                <p className="text-xs text-ink-500">{categoryLabel(row.category)}</p>
                <p className="mt-1 font-data text-xl text-ink-900">
                  {formatCurrency(Number(row.amount))}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search title, notes or vendor..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={category || 'all'}
          onValueChange={(v) => {
            setCategory(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading || !data ? (
          <PageSpinner />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={filtering ? 'No expenses match those filters' : 'No expenses recorded yet'}
            description={
              filtering
                ? 'Try a different category or search.'
                : 'Record rent, packaging, transport and anything else that is not raw material.'
            }
            action={
              filtering ? undefined : (
                <Button variant="gold" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Record expense
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>What for</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-data text-xs text-ink-500">
                      {expense.spentOn.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="clove">{categoryLabel(expense.category)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-ink-800">{expense.title}</TableCell>
                    <TableCell className="text-sm text-ink-600">
                      {expense.vendor?.name || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-600">
                      {methodLabel(expense.method)}
                    </TableCell>
                    <TableCell className="text-right font-data">
                      {formatCurrency(Number(expense.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(expense);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(expense)}>
                        <Trash2 className="h-4 w-4 text-paprika-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete expense?"
        description={`"${deleteTarget?.title}" will be removed and will no longer count against profit.`}
        confirmLabel="Delete"
        destructive
        loading={deleteExpense.isPending}
        onConfirm={() => {
          if (deleteTarget)
            deleteExpense.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
