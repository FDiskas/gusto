import type React from 'react';
import {
  Globe,
} from 'lucide-react';
import { useTranslate } from '@/i18n';

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang, t } = useTranslate();
  return (
    <button
      onClick={() => setLang(lang === 'lt' ? 'en' : 'lt')}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-[#E4E1D6] text-xs font-semibold text-[#2E3831] hover:bg-[#F1EFE7] transition-colors cursor-pointer"
      aria-label={t('header.switchLanguage')}
    >
      <Globe className="w-3.5 h-3.5 text-[#3E6B48]" />
      <span>{lang.toUpperCase()}</span>
    </button>
  );
};
