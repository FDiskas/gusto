import { describe, expect, test } from 'bun:test';
import { filterRecipes, rankRecipesByFridge } from '@/domain/recipe-search';
import type { Recipe } from '@/domain/types';

const makeRecipe = (overrides: Partial<Recipe>): Recipe => ({
  id: 'id',
  title: 'Recipe',
  prepTime: 10,
  tags: ['dinner'],
  imageUrl: '',
  ingredients: [],
  steps: [],
  saved: false,
  docUrl: '',
  updatedAt: '',
  ...overrides,
});

const salmon = makeRecipe({ id: 'salmon', title: 'Kepta lašiša', tags: ['quick'], ingredients: ['lašiša', 'citrina'] });
const soup = makeRecipe({
  id: 'soup',
  title: 'Moliūgų sriuba',
  tags: ['soups'],
  ingredients: ['moliūgas', 'česnakas'],
});

describe('filterRecipes', () => {
  test('returns every recipe for an empty query and the "all" tag', () => {
    expect(filterRecipes([salmon, soup], '  ', 'all')).toEqual([salmon, soup]);
  });

  test('matches the title case-insensitively', () => {
    expect(filterRecipes([salmon, soup], 'SRIUBA', 'all')).toEqual([soup]);
  });

  test('matches ingredients', () => {
    expect(filterRecipes([salmon, soup], 'citrina', 'all')).toEqual([salmon]);
  });

  test('filters by tag', () => {
    expect(filterRecipes([salmon, soup], '', 'soups')).toEqual([soup]);
  });
});

describe('rankRecipesByFridge', () => {
  test('returns all recipes with zero matches when the fridge is empty', () => {
    expect(rankRecipesByFridge([salmon, soup], [])).toEqual([
      { recipe: salmon, matched: 0, total: 2 },
      { recipe: soup, matched: 0, total: 2 },
    ]);
  });

  test('drops recipes without any matching ingredient', () => {
    const result = rankRecipesByFridge([salmon, soup], ['lašiša']);
    expect(result.map((match) => match.recipe.id)).toEqual(['salmon']);
  });

  test('sorts by the share of matched ingredients', () => {
    const partial = makeRecipe({ id: 'partial', ingredients: ['lašiša', 'a', 'b', 'c'] });
    const result = rankRecipesByFridge([partial, salmon], ['lašiša', 'citrina']);
    expect(result.map((match) => match.recipe.id)).toEqual(['salmon', 'partial']);
  });
});
