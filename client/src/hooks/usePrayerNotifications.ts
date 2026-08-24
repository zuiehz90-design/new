import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getMosqueTimes } from '../lib/mawaqit';
import { PRAYER_KEYS, type PrayerKey } from '../lib/prayer';

function parseTime(timeStr: string | undefined): Date | null {
  if (!timeStr) return null;
  const clean = timeStr.replace(/\s*\([^)]*\)/, '').trim();
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const d = new Date();
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d;
}

/**
 * Notifications de prière : vérifie périodiquement si l'heure d'une prière
 * vient d'être atteinte et émet une notification navigateur (si autorisé).
 * Les horaires sont calculés localement à partir des coordonnées de la mosquée.
 */
export function usePrayerNotifications() {
  const { settings } = useSettings();
  const lastFired = useRef<Record<string, string>>({});

  const isPaused = settings.prayerPauseUntil && settings.prayerPauseUntil > Date.now();
  const mosqueId = settings.mawaqitMosqueId;

  useEffect(() => {
    if (!settings.prayerNotifications || !mosqueId || typeof Notification === 'undefined' || isPaused) return;

    let cancelled = false;

    const check = async () => {
      if (cancelled) return;
      try {
        const times = await getMosqueTimes(mosqueId);
        if (!times) return;
        const now = new Date();
        for (const key of PRAYER_KEYS) {
          if (key === 'sunrise') continue;
          const prayerTime = parseTime((times as Record<string, string>)[key]);
          if (!prayerTime) continue;
          const diff = prayerTime.getTime() - now.getTime();
          if (diff >= -60_000 && diff <= 120_000) {
            const today = now.toISOString().slice(0, 10);
            const lastKey = `${today}-${key}`;
            if (lastFired.current[lastKey]) continue;
            lastFired.current[lastKey] = now.toISOString();
            const title = key.charAt(0).toUpperCase() + key.slice(1);
            const time = prayerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            new Notification(`🕌 ${title} — ${time}`, {
              body: 'C\u2019est l\u2019heure de la prière.',
              icon: '/icon.svg',
            });
          }
        }
      } catch {
        /* ignore */
      }
    };

    check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [settings.prayerNotifications, mosqueId, isPaused]);
}