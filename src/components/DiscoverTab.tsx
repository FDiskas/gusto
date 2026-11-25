import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
} from 'lucide-react';
import { useTranslate } from '@/i18n';
import { TAG_CONFIG } from '@/domain/constants';
import { filterRecipes } from '@/domain/recipe-search';
import { RecipeCard } from '@/components/RecipeCard';
import type { Recipe, RecipeListHandlers, TagId } from '@/domain/types';

/** "Discover" tab: search, tag filter and the full recipe list */
export function DiscoverTab({ recipes, handlers, onAddRecipe, onOpenFridge }: {
  recipes: Recipe[];
  handlers: RecipeListHandlers;
  onAddRecipe: () => void;
  onOpenFridge: () => void;
}) {
  const { t } = useTranslate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagId | 'all'>('all');
  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, searchQuery, selectedTag),
    [recipes, searchQuery, selectedTag]
  );

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-extrabold tracking-tight text-[#1A1F1C] leading-tight">
        {t('home.greeting')}
      </h1>

      {/* Search Input */}
      <div className="relative md:max-w-xl">
        <Search className="w-4.5 h-4.5 text-[#7A827C] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('home.search.placeholder')}
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white border border-[#E4E1D6] text-sm text-[#1F2421] placeholder:text-[#8A928C] focus:outline-none focus:ring-2 focus:ring-[#3E6B48] shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A928C] hover:text-[#1F2421] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-5 px-5 md:-mx-8 md:px-8 no-scrollbar">
        <button
          onClick={() => setSelectedTag('all')}
          className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedTag === 'all'
              ? 'bg-[#3E6B48] text-white shadow-xs'
              : 'bg-white border border-[#E4E1D6] text-[#3C443E]'
          }`}
        >
          {t('tag.all')}
        </button>
        {TAG_CONFIG.map((tag) => {
          const active = selectedTag === tag.id;
          return (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(active ? 'all' : tag.id)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                active ? `${tag.activeBg} text-white shadow-xs` : `${tag.bg} ${tag.text}`
              }`}
            >
              {tag.emoji} {t(tag.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Fridge Quick Promo Banner (Matches Approved Gusto Design) */}
      <button
        type="button"
        onClick={onOpenFridge}
        className="w-full text-left p-4 rounded-[24px] bg-[#D6E2D5] hover:bg-[#CBDAC9] transition-colors flex items-center gap-4 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center text-2xl shrink-0">
          🥫
        </div>
        <div className="min-w-0">
          <h3 className="font-extrabold text-base text-[#1E3322] leading-snug">
            {t('home.fridgeCard.title')}
          </h3>
          <p className="text-xs text-[#3D5742] mt-0.5 leading-snug">
            {t('home.fridgeCard.desc')}
          </p>
        </div>
      </button>

      {/* Recipe List */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#1F2421]">{t('home.popular')}</h2>
          <span className="text-xs font-semibold text-[#7A827C]">{filteredRecipes.length}</span>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#E7E4DA]">
            <p className="text-sm text-[#6E7770] mb-3">{t('home.empty')}</p>
            <button
              onClick={onAddRecipe}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3E6B48] text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('home.empty.cta')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onOpen={handlers.onOpen}
                onToggleSave={handlers.onToggleSave}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
