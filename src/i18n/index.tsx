import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { translations } from '@/i18n/translations';
import type { Lang, TranslationKey } from '@/i18n/translations';

export type { Lang, TranslationKey } from './translations';

type TranslateParams = Record<string, string | number>;
export type Translate = (key: TranslationKey, params?: TranslateParams) => string;

const DEFAULT_LANG: Lang = 'lt';

/**
 * Core translation function following `translate-template.ts` convention:
 * interpolates `{{placeholder}}` variables safely.
 */
export function createTranslator(lang: Lang): Translate {
  return (key, params) => {
    let text: string = translations[lang][key] ?? translations.en[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), String(value));
      }
    }
    return text;
  };
}

const I18nContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
}>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: createTranslator(DEFAULT_LANG),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const value = useMemo(() => ({ lang, setLang, t: createTranslator(lang) }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useTranslate = () => useContext(I18nContext);
