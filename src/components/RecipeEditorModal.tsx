import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { X, AlertCircle, ImagePlus } from 'lucide-react';
import { useTranslate } from '@/i18n';
import { TAG_CONFIG, CURATED_IMAGES } from '@/domain/constants';
import { describeError } from '@/lib/error';
import { resizePhoto } from '@/lib/image';
import type { TagId, Recipe, RecipeDraft } from '@/domain/types';

/** Create / Edit Recipe Modal */
export function RecipeEditorModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Recipe | null;
  onClose: () => void;
  onSave: (data: RecipeDraft, existingId?: string) => Promise<void>;
}) {
  const { t } = useTranslate();
  const [title, setTitle] = useState(initial?.title || '');
  const [prepTime, setPrepTime] = useState(String(initial?.prepTime || 20));
  const [tags, setTags] = useState<TagId[]>(initial?.tags || ['dinner']);
  const [imageUrl, setImageUrl] = useState<string>(initial?.imageUrl || CURATED_IMAGES[0]!);
  const [ingredientsText, setIngredientsText] = useState(initial?.ingredients.join('\n') || '');
  const [stepsText, setStepsText] = useState(initial?.steps.join('\n') || '');
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<Blob | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [error, setError] = useState<{ message: string; detail: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const resized = await resizePhoto(file);
      setPhoto(resized);
      setPhotoPreview(URL.createObjectURL(resized));
    } catch (photoError) {
      setError({ message: t('error.photoFailed'), detail: describeError(photoError) });
    }
  };

  const clearPhoto = () => {
    setPhoto(undefined);
    setPhotoPreview(undefined);
  };

  const chooseImageUrl = (url: string) => {
    clearPhoto();
    setImageUrl(url);
  };

  const toggleTag = (id: TagId) => {
    setTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          title: title.trim(),
          prepTime: Math.max(1, Number(prepTime) || 15),
          tags: tags.length > 0 ? tags : ['dinner'],
          imageUrl: imageUrl.trim() || CURATED_IMAGES[0]!,
          ingredients: ingredientsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          steps: stepsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          imageFileId: !photo && imageUrl === initial?.imageUrl ? initial?.imageFileId : undefined,
          photo,
          saved: initial?.saved ?? false,
          authorName: initial?.authorName,
        },
        initial?.id
      );
      onClose();
    } catch (saveError) {
      setError({ message: t('error.saveFailed'), detail: describeError(saveError) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md md:max-w-xl max-h-[92dvh] bg-surface rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-line flex items-center justify-between">
          <h2 className="font-extrabold text-base text-ink">
            {initial ? t('editor.editTitle') : t('editor.newTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-ink-soft cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">{t('editor.field.title')}</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('editor.field.titlePlaceholder')}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-line-strong text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-soft mb-1.5">{t('editor.field.time')}</label>
              <input
                type="number"
                min={1}
                max={600}
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-line-strong text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft mb-1.5">{t('editor.field.image')}</label>
              <input
                type="url"
                value={/^(blob|data):/.test(imageUrl) ? '' : imageUrl}
                onChange={(e) => chooseImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-line-strong text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          {/* Photo upload: shown full width on top of the Google Doc */}
          <div className="space-y-2">
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-surface-sunken border border-line-strong">
              <img src={photoPreview ?? imageUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md text-ink text-xs font-bold shadow-sm cursor-pointer"
              >
                <ImagePlus className="w-4 h-4 text-brand" />
                <span>{photoPreview ? t('editor.photo.replace') : t('editor.photo.upload')}</span>
              </button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            <p className="text-[11px] text-muted">{t('editor.photo.hint')}</p>
          </div>

          {/* Quick image presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CURATED_IMAGES.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => chooseImageUrl(img)}
                className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  !photoPreview && imageUrl === img ? 'border-brand scale-105' : 'border-transparent opacity-75'
                }`}
              >
                <img src={img} alt={t('editor.preset.alt')} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">{t('editor.field.tags')}</label>
            <div className="flex flex-wrap gap-2">
              {TAG_CONFIG.map((tag) => {
                const active = tags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      active ? 'bg-brand text-white' : `${tag.bg} ${tag.text}`
                    }`}
                  >
                    {tag.emoji} {t(tag.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">{t('editor.field.ingredients')}</label>
            <textarea
              rows={4}
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder={'2 lašišos filė\n250 g smidrų\n1 citrina'}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-line-strong text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Steps */}
          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">{t('editor.field.steps')}</label>
            <textarea
              rows={4}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder={'Įkaitinkite orkaitę iki 200 °C.\nKepkite 15 minučių.'}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-line-strong text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p>{error.message}</p>
                {error.detail && <p className="mt-1 font-mono text-[11px] break-words opacity-80">{error.detail}</p>}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? t('editor.saving') : t('editor.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
