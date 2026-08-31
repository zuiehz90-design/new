import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMosqueTimes, type PrayerTimes } from '../lib/mawaqit';

/** Cache local des horaires (par mosquée + date) : l'accueil s'affiche
 *  instantanément même pendant le réveil lent du serveur. */
function timesCacheKey(mosqueId: string): string {
  // 使用本地日期而非UTC：避免午夜后缓存key仍指向昨天的数据
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `nour:mawaqit:${mosqueId}:${today}`;
}
function readTimesCache(key: string): PrayerTimes | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as PrayerTimes;
    return data && typeof data.fajr === 'string' && typeof data.isha === 'string' ? data : null;
  } catch {
    return null;
  }
}
function writeTimesCache(key: string, times: PrayerTimes): void {
  try {
    localStorage.setItem(key, JSON.stringify(times));
  } catch {
    /* quota dépassé : on ignore */
  }
}
import type { PrayerKey } from '../lib/prayer';
import { useSettings } from '../context/SettingsContext';

export interface MawaqitTimesResult {
  times: PrayerTimes | null;
  /** Objets Date pour chaque prière (même jour). */
  dates: Record<string, Date> | null;
  /** Prochaine prière à venir. */
  next: { key: PrayerKey; date: Date; time: string } | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export function useMawaqitTimes(): MawaqitTimesResult {
  const { settings } = useSettings();
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mosqueId = settings.mawaqitMosqueId;

  const fetchTimes = useCallback(async () => {
    if (!mosqueId) {
      setTimes(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const cacheKey = timesCacheKey(mosqueId);
    const cached = readTimesCache(cacheKey);
    if (cached) {
      // Snapshot du jour : rendu immédiat, revalidation en arrière-plan
      setTimes(cached);
      setLoading(false);
    }
    try {
      const result = await getMosqueTimes(mosqueId);
      setTimes(result);
      writeTimesCache(cacheKey, result);
    } catch (err) {
      if (!cached) setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [mosqueId]);

  useEffect(() => {
    fetchTimes();
    const interval = setInterval(fetchTimes, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTimes]);

  // Rollover minuit : quand la date locale change, les horaires affiches
  // appartiennent encore a la veille. Un tick leger re-fetch des que le jour
  // local change, sans recharger toute la page.
  const [localDay, setLocalDay] = useState(() => new Date().toDateString());
  useEffect(() => {
    const tick = setInterval(() => {
      const day = new Date().toDateString();
      setLocalDay((prev) => (prev === day ? prev : day));
    }, 30_000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    fetchTimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDay]);

  const dates = useMemo(() => {
    if (!times) return null;
    const today = times.date || new Date().toISOString().slice(0, 10);
    const out: Record<string, Date> = {};
    for (const key of ORDER) {
      const str = times[key];
      if (!str) continue;
      const [h, m] = str.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) continue;
      out[key] = new Date(`${today}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    }
    return out;
  }, [times]);

  const next = useMemo<MawaqitTimesResult['next']>(() => {
    if (!times || !dates) return null;
    const now = new Date();
    for (const key of ORDER) {
      const d = dates[key];
      if (d && d.getTime() > now.getTime()) {
        return { key, date: d, time: times[key] };
      }
    }
    // Toutes passées → Fajr de demain
    // 使用本地日期构造明天的Fajr，避免UTC偏移导致的日期错误
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const [fh, fm] = (times.fajr || '05:00').split(':').map(Number);
    const fajrTomorrow = new Date(`${tomorrowStr}T${String(fh).padStart(2, '0')}:${String(fm).padStart(2, '0')}:00`);
    return { key: 'fajr', date: fajrTomorrow, time: times.fajr };
  }, [times, dates]);

  return { times, dates, next, loading, error, refresh: fetchTimes };
}
