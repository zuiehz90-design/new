import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMosqueTimes, type PrayerTimes } from '../lib/mawaqit';
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

  const mosqueId = settings.mawaqitMosqueId;

  const fetchTimes = useCallback(async () => {
    if (!mosqueId) {
      setTimes(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getMosqueTimes(mosqueId);
      setTimes(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [mosqueId]);

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
      const str = times[key];
      if (!str) continue;
      const [h, m] = str.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) continue;
      out[key] = new Date(`${today}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
    }
    return out;
  }, [times]);

  const next = useMemo(() => {
    if (!times || !dates) return null;
    const now = new Date();
    for (const key of ORDER) {
      const d = dates[key];
      if (d && d.getTime() > now.getTime()) {
        return { key, date: d, time: times[key] };
      }
    }
    // Toutes passées → Fajr de demain
    const d = new Date(dates.fajr ?? now);
    d.setDate(d.getDate() + 1);
    return { key: 'fajr', date: d, time: times.fajr };
  }, [times, dates]);

  return { times, dates, next, loading, error, refresh: fetchTimes };
}
