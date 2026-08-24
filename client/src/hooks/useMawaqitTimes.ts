import { useEffect, useRef, useState } from 'react';
import type { PrayerTimesResult } from '../lib/types';
import { fetchMawaqitTimes } from '../lib/mawaqit';

const ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

function fmt(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function parseTime(timeStr: string | undefined): Date | null {
  if (!timeStr) return null;
  const clean = timeStr.replace(/\s*\([^)]*\)/, '').trim();
  // Format attendu : "HH:MM" (ex. "04:55")
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function findNextPrayer(dates: Record<string, Date>): PrayerTimesResult['next'] {
  const now = Date.now();
  for (const key of ORDER) {
    const d = dates[key];
    if (d && d.getTime() > now) {
      return { key, date: d };
    }
  }
  return null;
}

/**
 * Hook qui récupère les horaires de prière depuis MAWAQIT pour une mosquée.
 * `mosqueId` est l'uuid de la mosquée sélectionnée dans les réglages.
 * Les horaires sont mis en cache 1 heure.
 */
export function useMawaqitTimes(
  mosqueId: string | null,
  now?: number,
): PrayerTimesResult & { dates: Record<string, Date>; mosque: string | null } | null {
  const [result, setResult] = useState<(PrayerTimesResult & { dates: Record<string, Date>; mosque: string | null }) | null>(null);
  const lastFetch = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    if (!mosqueId) {
      setResult(null);
      return;
    }

    const cacheKey = mosqueId;
    // Cache 1 heure
    if (lastFetch.current && lastFetch.current.key === cacheKey && Date.now() - lastFetch.current.at < 3600_000) {
      return;
    }

    let cancelled = false;
    fetchMawaqitTimes(mosqueId).then((times) => {
      if (cancelled || !times) {
        if (!cancelled) setResult(null);
        return;
      }
      const dates: Record<string, Date> = {};
      dates.fajr = parseTime(times.fajr) ?? new Date();
      dates.sunrise = parseTime(times.sunrise) ?? new Date();
      dates.dhuhr = parseTime(times.dohr) ?? new Date();
      dates.asr = parseTime(times.asr) ?? new Date();
      dates.maghrib = parseTime(times.maghreb) ?? new Date();
      dates.isha = parseTime(times.icha) ?? new Date();

      const validDates: Record<string, Date> = {};
      for (const k of Object.keys(dates)) {
        if (dates[k] instanceof Date && !isNaN(dates[k].getTime())) {
          validDates[k] = dates[k];
        }
      }

      if (Object.keys(validDates).length < 5) {
        setResult(null);
        return;
      }

      setResult({
        fajr: fmt(validDates.fajr),
        sunrise: fmt(validDates.sunrise),
        dhuhr: fmt(validDates.dhuhr),
        asr: fmt(validDates.asr),
        maghrib: fmt(validDates.maghrib),
        isha: fmt(validDates.isha),
        next: findNextPrayer(validDates),
        dates: validDates,
        mosque: mosqueId,
      });
      lastFetch.current = { key: cacheKey, at: Date.now() };
    }).catch(() => {
      if (!cancelled) setResult(null);
    });

    return () => { cancelled = true; };
  }, [mosqueId, now]);

  return result;
}
