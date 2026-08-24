import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useGeolocation } from './useGeolocation';
import { computePrayers, PRAYER_KEYS, type PrayerKey } from '../lib/prayer';

/**
 * Notifications de prière : vérifie périodiquement si l'heure d'une prière
 * vient d'être atteinte et émet une notification navigateur (si autorisé).
 */
export function usePrayerNotifications() {
  const { settings } = useSettings();
  const { coords } = useGeolocation();
  const lastFired = useRef<Record<string, string>>({}); // key -> date ISO du dernier déclenchement

  // Vérifier si la pause est active
  const isPaused = settings.prayerPauseUntil && settings.prayerPauseUntil > Date.now();

  useEffect(() => {
    if (!settings.prayerNotifications || !coords || typeof Notification === 'undefined' || isPaused) return;

    const check = () => {
      try {
        const pt = computePrayers(coords, settings.prayerMethod);
        const now = new Date();
        for (const key of PRAYER_KEYS) {
          if (key === 'sunrise') continue; // pas de notification pour le lever du soleil
          const prayerTime = pt[key];
          if (!prayerTime) continue;
          const diff = prayerTime.getTime() - now.getTime();
          // Déclenche si on est dans la minute précédant la prière ou dans les 2 min après
          if (diff >= -60_000 && diff <= 120_000) {
            const today = now.toISOString().slice(0, 10);
            const lastKey = `${today}-${key}`;
            if (lastFired.current[lastKey]) continue; // déjà notifié aujourd'hui
            lastFired.current[lastKey] = now.toISOString();
            const label = key as PrayerKey;
            const title = label.charAt(0).toUpperCase() + label.slice(1);
            const time = prayerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            new Notification(`🕌 ${title} — ${time}`, {
              body: 'C\u2019est l\u2019heure de la prière.',
              icon: '/icon.svg',
            });
          }
        }
      } catch {
        /* calcul impossible, on ignore */
      }
    };

    // Vérifier immédiatement puis toutes les 30 secondes
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [settings.prayerNotifications, settings.prayerMethod, coords, isPaused]);
}
