import { Globe } from 'lucide-react';
import { useTranslate } from '@/i18n';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useTranslate();
  return (
    <button
      onClick={() => setLang(lang === 'lt' ? 'en' : 'lt')}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-line text-xs font-semibold text-ink hover:bg-surface-muted transition-colors cursor-pointer"
      aria-label={t('header.switchLanguage')}
    >
      <Globe className="w-3.5 h-3.5 text-brand" />
      <span>{lang.toUpperCase()}</span>
    </button>
  );
}
