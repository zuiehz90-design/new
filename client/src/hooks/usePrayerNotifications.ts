import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { push, requestPermission } from '../lib/notifications';
import { getMosqueTimes } from '../lib/mawaqit';
import { PRAYER_KEYS } from '../lib/prayer';

function parseTime(timeStr: string | undefined): Date | null {
  if (!timeStr) return null;
  const clean = timeStr.replace(/\s*\([^)]\)/, '').trim();
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const d = new Date();
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d;
}

const PRAYER_LABEL: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

/**
 * Notifications de prière :
 *   - Rappel 10 minutes avant chaque prière
 *   - Notification à l'heure de la prière
 * Chaque type ne se déclenche qu'une fois par jour et par prière.
 * Les horaires sont calculés localement à partir de la mosquée configurée.
 */
export function usePrayerNotifications() {
  const { settings } = useSettings();
  const lastFired = useRef<Record<string, string>>({});

  const isPaused = settings.prayerPauseUntil && settings.prayerPauseUntil > Date.now();
  const mosqueId = settings.mawaqitMosqueId;
  const focusMode = settings.focusMode === true;

  useEffect(() => {
    if (!settings.prayerNotifications || !mosqueId || typeof Notification === 'undefined' || isPaused || focusMode) return;

    let cancelled = false;
    let permissionRequested = false;

    const check = async () => {
      if (cancelled) return;
      try {
        if (!permissionRequested) {
          permissionRequested = true;
          void requestPermission();
        }
        const times = await getMosqueTimes(mosqueId);
        if (!times) return;
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        for (const key of PRAYER_KEYS) {
          await new Promise(r => setTimeout(r, 0)); // yield pour async notify
          if (key === 'sunrise') continue;
          const prayerTime = parseTime((times as Record<string, string>)[key]);
          if (!prayerTime) continue;
          const diff = prayerTime.getTime() - now.getTime();
          const label = PRAYER_LABEL[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
          const time = prayerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          // Rappel 10 min avant
          const preDiff = prayerTime.getTime() - 10 * 60_000 - now.getTime();
          if (preDiff >= -60_000 && preDiff <= 120_000) {
            const preKey = `${today}-${key}-pre`;
            if (!lastFired.current[preKey]) {
              lastFired.current[preKey] = now.toISOString();
              void push({
                type: 'prayer',
                title: `🕌 ${label} dans 10 minutes`,
                body: "Prépare-toi : l'heure de la prière approche.",
                clickUrl: '/prayer',
              });
            }
          }

          // À l'heure
          if (diff >= -60_000 && diff <= 120_000) {
            const timeKey = `${today}-${key}-time`;
            if (!lastFired.current[timeKey]) {
              lastFired.current[timeKey] = now.toISOString();
              void push({
                type: 'prayer',
                title: `🕌 ${label} — ${time}`,
                body: "C'est l'heure de la prière.",
                clickUrl: '/prayer',
              });
            }
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
  }, [settings.prayerNotifications, mosqueId, isPaused, focusMode]);
}
