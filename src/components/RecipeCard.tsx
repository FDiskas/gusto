import type React from 'react';
import {
  Clock,
  Heart,
  FileText,
} from 'lucide-react';
import { useTranslate } from '@/i18n';
import type { Recipe } from '@/domain/types';

/** Recipe Card matching the minimalist Gusto visual design */
export const RecipeCard: React.FC<{
  recipe: Recipe;
  onOpen: (recipe: Recipe) => void;
  onToggleSave: (recipe: Recipe, e: React.MouseEvent) => void;
  badgeText?: string;
}> = ({ recipe, onOpen, onToggleSave, badgeText }) => {
  const { t } = useTranslate();

  return (
    <div
      onClick={() => onOpen(recipe)}
      className="relative rounded-[26px] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group h-56 bg-[#242B26]"
    >
      <img
        src={recipe.imageUrl}
        alt={recipe.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

      {/* Top row: optional match badge / Doc pill + Heart */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {badgeText ? (
            <span className="px-2.5 py-1 rounded-full bg-[#3E6B48] text-white text-xs font-bold shadow-sm">
              {badgeText}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-white/90 text-[11px] font-medium">
              <FileText className="w-3 h-3" />
              <span>{t('recipe.docBadge')}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => onToggleSave(recipe, e)}
          className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/45 transition-colors cursor-pointer"
          aria-label={t('recipe.save')}
        >
          <Heart className={`w-4.5 h-4.5 ${recipe.saved ? 'fill-[#FF6B6B] text-[#FF6B6B]' : 'text-white'}`} />
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-white font-extrabold text-xl leading-tight line-clamp-2 drop-shadow-sm mb-2">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {t('recipe.time', { min: recipe.prepTime })}
            </span>
            {recipe.authorName && (
              <>
                <span className="opacity-50">•</span>
                <span className="truncate opacity-85">{recipe.authorName}</span>
              </>
            )}
          </div>
        </div>

        <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3E6B48] group-hover:bg-[#32583B] text-white text-xs font-bold shadow-sm transition-colors">
          <span>👉</span>
          <span>{t('home.cookBtn')}</span>
        </span>
      </div>
    </div>
  );
};
