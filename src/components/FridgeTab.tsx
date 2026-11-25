import { useState, useMemo } from 'react';
import {
  X,
} from 'lucide-react';
import { useTranslate } from '@/i18n';
import { DEFAULT_FRIDGE_ITEMS, FRIDGE_QUICK_ADD_ITEMS } from '@/domain/constants';
import { rankRecipesByFridge } from '@/domain/recipe-search';
import { RecipeCard } from '@/components/RecipeCard';
import type { Recipe, RecipeListHandlers } from '@/domain/types';

/** "Fridge" tab: pick ingredients you have and see the best matching recipes */
export function FridgeTab({ recipes, handlers }: { recipes: Recipe[]; handlers: RecipeListHandlers }) {
  const { t } = useTranslate();
  const [fridgeItems, setFridgeItems] = useState<string[]>(DEFAULT_FRIDGE_ITEMS);
  const [fridgeInput, setFridgeInput] = useState('');
  const fridgeMatches = useMemo(() => rankRecipesByFridge(recipes, fridgeItems), [recipes, fridgeItems]);

  const addFridgeItem = (value: string) => {
    const clean = value.trim().toLowerCase();
    if (!clean || fridgeItems.includes(clean)) return;
    setFridgeItems((prev) => [...prev, clean]);
    setFridgeInput('');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1A1F1C]">{t('fridge.title')}</h1>
        <p className="text-xs text-[#636B65] mt-1 leading-relaxed">{t('fridge.subtitle')}</p>
      </div>

      {/* Ingredient Adder */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addFridgeItem(fridgeInput);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={fridgeInput}
          onChange={(e) => setFridgeInput(e.target.value)}
          placeholder={t('fridge.input.placeholder')}
          className="flex-1 px-4 py-3 rounded-2xl bg-white border border-[#E4E1D6] text-sm focus:outline-none focus:ring-2 focus:ring-[#3E6B48]"
        />
        <button
          type="submit"
          className="px-4 py-3 rounded-2xl bg-[#3E6B48] text-white text-xs font-bold cursor-pointer"
        >
          {t('fridge.add')}
        </button>
      </form>

      {/* Active Fridge Chips */}
      {fridgeItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {fridgeItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3E6B48] text-white text-xs font-semibold"
            >
              {item}
              <button
                onClick={() => setFridgeItems((prev) => prev.filter((x) => x !== item))}
                className="hover:opacity-75 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          <button
            onClick={() => setFridgeItems([])}
            className="text-xs font-semibold text-[#7A827C] underline ml-1 cursor-pointer"
          >
            {t('fridge.clear')}
          </button>
        </div>
      )}

      {/* Quick Suggestions */}
      <div>
        <p className="text-[11px] font-bold text-[#7A827C] uppercase tracking-wider mb-2">
          {t('fridge.quickAdd')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FRIDGE_QUICK_ADD_ITEMS.map(
            (sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => addFridgeItem(sug)}
                disabled={fridgeItems.includes(sug)}
                className="px-3 py-1.5 rounded-full bg-white border border-[#E4E1D6] text-xs font-medium text-[#3C443E] hover:border-[#3E6B48] disabled:opacity-40 cursor-pointer"
              >
                + {sug}
              </button>
            )
          )}
        </div>
      </div>

      {/* Matched Recipes */}
      <section className="space-y-3.5 pt-2">
        <h2 className="text-base font-extrabold text-[#1F2421]">
          {t('fridge.matches', { count: fridgeMatches.length })}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fridgeMatches.map(({ recipe, matched, total }) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onOpen={handlers.onOpen}
            onToggleSave={handlers.onToggleSave}
            badgeText={
              fridgeItems.length > 0
                ? t('fridge.matchBadge', { matched, total })
                : undefined
            }
          />
        ))}
        </div>
      </section>
    </div>
  );
}
