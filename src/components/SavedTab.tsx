import { useMemo } from 'react';
import {
  Heart,
} from 'lucide-react';
import { useTranslate } from '@/i18n';
import { RecipeCard } from '@/components/RecipeCard';
import type { Recipe, RecipeListHandlers } from '@/domain/types';

/** "Saved" tab: recipes marked with the heart */
export function SavedTab({ recipes, handlers }: { recipes: Recipe[]; handlers: RecipeListHandlers }) {
  const { t } = useTranslate();
  const savedRecipes = useMemo(() => recipes.filter((recipe) => recipe.saved), [recipes]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-[#1A1F1C]">{t('saved.title')}</h1>
      {savedRecipes.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#E7E4DA]">
          <Heart className="w-8 h-8 text-[#C9CFCB] mx-auto mb-2" />
          <p className="text-sm text-[#6E7770]">{t('saved.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpen={handlers.onOpen}
              onToggleSave={handlers.onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
