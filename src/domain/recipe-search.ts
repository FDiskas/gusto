import type { Recipe, TagId } from '@/domain/types';

export interface FridgeMatch {
  recipe: Recipe;
  matched: number;
  total: number;
}

const includesIgnoreCase = (text: string, query: string) => text.toLowerCase().includes(query.toLowerCase());

/** Keeps recipes whose title or ingredients contain the query and that carry the selected tag */
export function filterRecipes(recipes: Recipe[], query: string, tag: TagId | 'all'): Recipe[] {
  const trimmedQuery = query.trim();
  return recipes.filter((recipe) => {
    const matchesTag = tag === 'all' || recipe.tags.includes(tag);
    const matchesQuery =
      !trimmedQuery ||
      includesIgnoreCase(recipe.title, trimmedQuery) ||
      recipe.ingredients.some((ingredient) => includesIgnoreCase(ingredient, trimmedQuery));
    return matchesTag && matchesQuery;
  });
}

/** Ranks recipes by the share of ingredients found in the fridge; with an empty fridge all recipes are returned */
export function rankRecipesByFridge(recipes: Recipe[], fridgeItems: string[]): FridgeMatch[] {
  if (fridgeItems.length === 0) {
    return recipes.map((recipe) => ({ recipe, matched: 0, total: recipe.ingredients.length }));
  }

  const matchRatio = ({ matched, total }: FridgeMatch) => matched / Math.max(1, total);

  return recipes
    .map((recipe) => ({
      recipe,
      matched: recipe.ingredients.filter((ingredient) =>
        fridgeItems.some((item) => includesIgnoreCase(ingredient, item))
      ).length,
      total: recipe.ingredients.length,
    }))
    .filter((match) => match.matched > 0)
    .sort((a, b) => matchRatio(b) - matchRatio(a));
}
