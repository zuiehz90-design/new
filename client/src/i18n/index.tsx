import { createContext, useContext, type ReactNode } from 'react';
import { fr } from './fr';
import { en } from './en';
import { ar } from './ar';

export type Lang = 'fr' | 'en' | 'ar';

const dicts: Record<Lang, Record<string, string>> = { fr, en, ar };

interface I18nCtx {
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: Lang;
}

export const I18nContext = createContext<I18nCtx>({
  t: (k: string) => k,
  lang: 'fr',
});

export function useI18n() {
  return useContext(I18nContext);
}

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  function t(key: string, vars?: Record<string, string | number>): string {
    let result = dicts[lang]?.[key] ?? dicts.fr[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        result = result.replace(`{${k}}`, String(v));
      }
    }
    return result;
  }

  return <I18nContext.Provider value={{ t, lang }}>{children}</I18nContext.Provider>;
}
