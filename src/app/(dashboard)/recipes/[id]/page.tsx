'use client';

import { useParams } from 'next/navigation';
import { useRecipe } from '@/hooks/use-recipes';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { RecipeForm } from '@/components/recipes/recipe-form';

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const { data: recipe, isLoading } = useRecipe(params.id);

  if (isLoading) return <PageSpinner />;
  if (!recipe) return <EmptyState title="Recipe not found" />;

  return (
    <div>
      <PageHeader title={recipe.name} description="Edit recipe" />
      <RecipeForm recipe={recipe} />
    </div>
  );
}
