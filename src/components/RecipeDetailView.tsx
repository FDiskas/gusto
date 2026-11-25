import { useState } from 'react';
import type React from 'react';
import { Clock, Heart, FileText, ExternalLink, Check, Trash2, Edit3, ChevronLeft } from 'lucide-react';
import { useTranslate } from '@/i18n';
import { TAG_CONFIG, FOLDER_NAME } from '@/domain/constants';
import type { Recipe } from '@/domain/types';

/** Full Recipe View with checkable ingredients & steps + Google Docs link */
export function RecipeDetailView({
  recipe,
  onClose,
  onEdit,
  onDelete,
  onToggleSave,
}: {
  recipe: Recipe;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onToggleSave: (recipe: Recipe, e: React.MouseEvent) => void;
}) {
  const { t } = useTranslate();
  const [checkedIngr, setCheckedIngr] = useState<Record<number, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleIngr = (idx: number) => setCheckedIngr((prev) => ({ ...prev, [idx]: !prev[idx] }));
  const toggleStep = (idx: number) => setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const doneSteps = Object.values(checkedSteps).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-40 bg-surface overflow-y-auto">
      <div className="max-w-md md:max-w-3xl mx-auto min-h-screen pb-16 md:bg-surface">
        {/* Hero Image */}
        <div className="relative h-72 md:h-96 w-full">
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35" />

          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md text-ink text-xs font-bold shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('recipe.back')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => onToggleSave(recipe, e)}
                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-sm cursor-pointer"
              >
                <Heart className={`w-4.5 h-4.5 ${recipe.saved ? 'fill-heart text-heart' : 'text-ink'}`} />
              </button>
              <button
                onClick={() => onEdit(recipe)}
                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-ink shadow-sm cursor-pointer"
                aria-label={t('recipe.edit')}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {recipe.tags.map((tagId) => {
                const cfg = TAG_CONFIG.find((c) => c.id === tagId);
                return (
                  <span
                    key={tagId}
                    className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold"
                  >
                    {cfg?.emoji} {cfg && t(cfg.labelKey)}
                  </span>
                );
              })}
            </div>
            <h1 className="text-2xl font-extrabold leading-tight">{recipe.title}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-white/85 font-medium">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {t('recipe.time', { min: recipe.prepTime })}
              </span>
              {recipe.authorName && <span>• {recipe.authorName}</span>}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 md:px-8 pt-5 space-y-6">
          {/* Open in Google Docs Action */}
          <a
            href={recipe.docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-line hover:border-brand transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">{t('recipe.openDoc')}</p>
                <p className="text-[11px] text-muted">Google Docs • {FOLDER_NAME}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-brand" />
          </a>

          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-5 md:gap-8 md:items-start">
            {/* Ingredients */}
            <section className="md:col-span-2 md:sticky md:top-4">
              <h2 className="text-lg font-extrabold text-ink mb-3">{t('recipe.ingredients')}</h2>
              <div className="bg-white rounded-3xl p-4 border border-line space-y-2.5">
                {recipe.ingredients.map((item, idx) => {
                  const isDone = !!checkedIngr[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleIngr(idx)}
                      className="w-full flex items-start gap-3 text-left py-1 cursor-pointer group"
                    >
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isDone ? 'bg-brand border-brand text-white' : 'border-line-strong group-hover:border-brand'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span
                        className={`text-sm leading-snug transition-colors ${
                          isDone ? 'line-through text-subtle' : 'text-ink'
                        }`}
                      >
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Steps */}
            <section className="md:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-ink">{t('recipe.steps')}</h2>
                <span className="text-xs font-semibold text-brand bg-brand-soft px-2.5 py-1 rounded-full">
                  {t('recipe.checkedCount', { done: doneSteps, total: recipe.steps.length })}
                </span>
              </div>
              <div className="space-y-3">
                {recipe.steps.map((step, idx) => {
                  const isDone = !!checkedSteps[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleStep(idx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-3.5 cursor-pointer ${
                        isDone
                          ? 'bg-brand-wash border-brand-line opacity-75'
                          : 'bg-white border-line hover:border-brand-line'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 ${
                          isDone ? 'bg-brand text-white' : 'bg-brand-soft text-brand-ink'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      <p className={`text-sm leading-relaxed ${isDone ? 'line-through text-muted' : 'text-ink'}`}>
                        {step}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Delete Section (Inline confirmation, no confirm()) */}
          <div className="pt-4 border-t border-line">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('recipe.delete')}</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-red-800">{t('recipe.deleteConfirm')}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-xl bg-white text-xs font-semibold text-ink-soft border border-line-strong cursor-pointer"
                  >
                    {t('recipe.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(recipe.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-xs font-semibold text-white cursor-pointer"
                  >
                    {t('recipe.confirm')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
