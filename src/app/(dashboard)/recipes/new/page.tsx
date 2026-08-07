'use client';

import { PageHeader } from '@/components/ui/page-header';
import { RecipeForm } from '@/components/recipes/recipe-form';

export default function NewRecipePage() {
  return (
    <div>
      <PageHeader title="New recipe" description="Create a recipe to feature alongside your spice products" />
      <RecipeForm />
    </div>
  );
}
