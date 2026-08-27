import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_MODEL, FREE_ROUTER_MODEL } from '../lib/modelDefaults';
import type { Settings } from '../lib/types';

export const DEFAULT_SETTINGS: Settings = {
  lang: 'fr',
  theme: 'dark',
  // Modèle par défaut : instruct rapide et non-raisonneur (pas le routeur
  // aléatoire openrouter/free qui peut choisir des reasoning models).
  model: DEFAULT_MODEL,
  mawaqitMosqueId: null,
  mawaqitMosqueName: null,
  reciter: 'Alafasy_128kbps',
  translation: 'fr',
  prayerNotifications: false,
  prayerPauseUntil: null,
  focusMode: false,
};

/**
 * Migration douce : les utilisateurs ayant l'ancien défaut « openrouter/free »
 * (routeur aléatoire → reasoning models anglais) basculent sur le modèle
 * instruct par défaut, sauf s'ils l'ont choisi explicitement… on ne peut pas
 * distinguer, donc on migre : le routeur reste disponible dans les réglages.
 */
export function migrateModel(model: string): string {
  return model === FREE_ROUTER_MODEL ? DEFAULT_MODEL : model;
}

interface Ctx {
  settings: Settings;
  setSettings: (s: Settings | ((prev: Settings) => Settings)) => void;
}

const SettingsContext = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  setSettings: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>('nour:settings', DEFAULT_SETTINGS);

  // Migration : remplace l'ancien défaut « openrouter/free » par le modèle
  // instruct rapide (une seule fois, au montage).
  useEffect(() => {
    setSettings((prev) => {
      const next = { ...prev, model: migrateModel(prev.model) };
      return next.model === prev.model ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('light', settings.theme === 'light');
    html.classList.toggle('focus-mode', settings.focusMode === true);
    html.lang = settings.lang;
  }, [settings.theme, settings.focusMode, settings.lang]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
