import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Settings } from '../lib/types';

export const DEFAULT_SETTINGS: Settings = {
  lang: 'fr',
  theme: 'dark',
  model: 'openrouter/free',
  prayerMethod: 'aladhan-api',
  reciter: 'Alafasy_128kbps',
  translation: 'fr',
  prayerNotifications: false,
  prayerPauseUntil: null,
};

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

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('light', settings.theme === 'light');
    html.lang = settings.lang;
  }, [settings.theme, settings.lang]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
