'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, ChefHat } from 'lucide-react';
import { useRecipes, useDeleteRecipe } from '@/hooks/use-recipes';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import type { Recipe } from '@/types/api';

export default function RecipesPage() {
  const router = useRouter();
  const { data: recipes, isLoading } = useRecipes();
  const deleteRecipe = useDeleteRecipe();
  const [deleteTarget, setDeleteTarget] = React.useState<Recipe | undefined>();

  return (
    <div>
      <PageHeader
        title="Recipes"
        description="Recipes linked to spice products for storefront discovery"
        actions={
          <Button variant="gold" onClick={() => router.push('/recipes/new')}>
            <Plus className="h-4 w-4" /> New recipe
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : !recipes || recipes.length === 0 ? (
          <EmptyState icon={ChefHat} title="No recipes yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipe</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Cooking time</TableHead>
                <TableHead>Linked products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell>
                    <Link href={`/recipes/${recipe.id}`} className="font-medium hover:text-gold-700">
                      {recipe.name}
                    </Link>
                    <p className="text-xs text-ink-500">/{recipe.slug}</p>
                  </TableCell>
                  <TableCell className="text-sm text-ink-600">{recipe.difficulty || '—'}</TableCell>
                  <TableCell className="text-sm text-ink-600">
                    {recipe.cookingTimeMins ? `${recipe.cookingTimeMins} min` : '—'}
                  </TableCell>
                  <TableCell className="font-data">{recipe._count?.products ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={recipe.isActive ? 'moss' : 'neutral'}>
                      {recipe.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/recipes/${recipe.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(recipe)}>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete recipe?"
        description={`"${deleteTarget?.name}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        loading={deleteRecipe.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteRecipe.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
