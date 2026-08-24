import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPrayerTimes, type PrayerTimes } from '../lib/mawaqit';
import { useSettings } from '../context/SettingsContext';

export interface MawaqitTimesResult {
  times: PrayerTimes | null;
  /** Objets Date pour chaque prière (même jour). */
  dates: Record<string, Date> | null;
  /** Prochaine prière à venir. */
  next: { key: string; date: Date; time: string } | null;
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

  const lat = settings.mawaqitLatitude ?? 48.8566;
  const lon = settings.mawaqitLongitude ?? 2.3522;
  const method = settings.prayerMethod ?? 'uoif';

  const fetchTimes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPrayerTimes(lat, lon, method);
      setTimes(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [lat, lon, method]);

  useEffect(() => {
    fetchTimes();
    const interval = setInterval(fetchTimes, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTimes]);

  const dates = useMemo(() => {
    if (!times) return null;
    const today = new Date().toISOString().slice(0, 10);
    const out: Record<string, Date> = {};
    for (const key of ORDER) {
      const str = (times as Record<string, string>)[key];
      if (!str) continue;
      const [h, m] = str.split(':').map(Number);
      const d = new Date(`${today}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      out[key] = d;
    }
    return out;
  }, [times]);

  const next = useMemo(() => {
    if (!times || !dates) return null;
    const now = new Date();
    for (const key of ORDER) {
      const d = dates[key];
      if (d && d.getTime() > now.getTime()) {
        return { key, date: d, time: (times as Record<string, string>)[key] };
      }
    }
    // Toutes passées → Fajr de demain
    const d = new Date(dates.fajr);
    d.setDate(d.getDate() + 1);
    return { key: 'fajr', date: d, time: (times as Record<string, string>).fajr };
  }, [times, dates]);

  return { times, dates, next, loading, error, refresh: fetchTimes };
}