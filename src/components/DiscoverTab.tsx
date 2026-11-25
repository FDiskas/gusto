import { useState, useMemo } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useTranslate } from '@/i18n';
import { TAG_CONFIG } from '@/domain/constants';
import { filterRecipes } from '@/domain/recipe-search';
import { RecipeCard } from '@/components/RecipeCard';
import type { Recipe, RecipeListHandlers, TagId } from '@/domain/types';

/** "Discover" tab: search, tag filter and the full recipe list */
export function DiscoverTab({
  recipes,
  handlers,
  onAddRecipe,
  onOpenFridge,
}: {
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
      <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-tight">{t('home.greeting')}</h1>

      {/* Search Input */}
      <div className="relative md:max-w-xl">
        <Search className="w-4.5 h-4.5 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('home.search.placeholder')}
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white border border-line text-sm text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tags wrap onto multiple rows instead of scrolling sideways */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag('all')}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedTag === 'all' ? 'bg-brand text-white shadow-xs' : 'bg-white border border-line text-ink-soft'
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
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                active ? 'bg-brand text-white shadow-xs' : `${tag.bg} ${tag.text}`
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
        className="w-full text-left p-4 rounded-[24px] bg-tag-vegetarian hover:bg-brand-line transition-colors flex items-center gap-4 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center text-2xl shrink-0">🥫</div>
        <div className="min-w-0">
          <h3 className="font-extrabold text-base text-brand-deep leading-snug">{t('home.fridgeCard.title')}</h3>
          <p className="text-xs text-brand-deep mt-0.5 leading-snug">{t('home.fridgeCard.desc')}</p>
        </div>
      </button>

      {/* Recipe List */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">{t('home.popular')}</h2>
          <span className="text-xs font-semibold text-muted">{filteredRecipes.length}</span>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-line">
            <p className="text-sm text-muted mb-3">{t('home.empty')}</p>
            <button
              onClick={onAddRecipe}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-white text-xs font-bold cursor-pointer"
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
