import { useEffect, useState, useRef } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Prayer } from 'adhan';
import type { PrayerTimesResult } from '../lib/types';

// Map AlAdhan API method IDs to our internal IDs
const ALADHAN_METHOD_MAP: Record<string, number> = {
  'aladhan-api': 3,
  'uoif': 12,
  'mosquee-paris': 15, // Tunisian method (18°/18°) closest match
  'muslim-world-league': 1,
  'egyptian': 5,
  'karachi': 2,
  'umm-al-qura': 3,
  'north-america': 8,
  'moonsighting': 10,
};

const LOCAL_METHODS: { id: string; make: () => ReturnType<typeof CalculationMethod.Other> }[] = [
  { id: 'uoif', make: () => { const p = CalculationMethod.Other(); p.fajrAngle = 12; p.ishaAngle = 12; return p; } },
  { id: 'mosquee-paris', make: () => { const p = CalculationMethod.Other(); p.fajrAngle = 18; p.ishaAngle = 18; return p; } },
  { id: 'muslim-world-league', make: () => CalculationMethod.MuslimWorldLeague() },
  { id: 'egyptian', make: () => CalculationMethod.Egyptian() },
  { id: 'karachi', make: () => CalculationMethod.Karachi() },
  { id: 'umm-al-qura', make: () => CalculationMethod.UmmAlQura() },
  { id: 'north-america', make: () => CalculationMethod.NorthAmerica() },
  { id: 'moonsighting', make: () => CalculationMethod.MoonsightingCommittee() },
];

function fmt(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function findNextPrayer(dates: Record<string, Date>): PrayerTimesResult['next'] {
  const now = Date.now();
  const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
  for (const key of order) {
    const d = dates[key];
    if (d && d.getTime() > now) {
      return { key, date: d };
    }
  }
  return null;
}

/** Fetch prayer times from AlAdhan API (free, no key needed) */
async function fetchFromApi(
  coords: { lat: number; lng: number },
  methodId: string,
): Promise<PrayerTimesResult & { dates: Record<string, Date> } | null> {
  const method = ALADHAN_METHOD_MAP[methodId] ?? 3;
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;

  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coords.lat}&longitude=${coords.lng}&method=${method}&school=0`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  if (json.code !== 200 || !json.data?.timings) return null;

  const t = json.data.timings;
  const base = new Date();

  function parseTime(timeStr: string): Date {
    const clean = timeStr.replace(/\s*\([^)]*\)/, '').trim();
    const [h, m] = clean.split(':').map(Number);
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  }

  const dates: Record<string, Date> = {
    fajr: parseTime(t.Fajr),
    sunrise: parseTime(t.Sunrise),
    dhuhr: parseTime(t.Dhuhr),
    asr: parseTime(t.Asr),
    maghrib: parseTime(t.Maghrib),
    isha: parseTime(t.Isha),
  };

  return {
    fajr: fmt(dates.fajr),
    sunrise: fmt(dates.sunrise),
    dhuhr: fmt(dates.dhuhr),
    asr: fmt(dates.asr),
    maghrib: fmt(dates.maghrib),
    isha: fmt(dates.isha),
    next: findNextPrayer(dates),
    dates,
  };
}

/** Local fallback using the adhan library (offline) */
function computeLocal(
  coords: { lat: number; lng: number },
  methodId: string,
): PrayerTimesResult & { dates: Record<string, Date> } | null {
  const method = LOCAL_METHODS.find((m) => m.id === methodId) ?? LOCAL_METHODS[0];
  const params = method.make();
  params.madhab = Madhab.Shafi;
  const pt = new PrayerTimes(new Coordinates(coords.lat, coords.lng), new Date(), params);
  const dates: Record<string, Date> = {
    fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr,
    asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha,
  };
  return {
    fajr: fmt(pt.fajr),
    sunrise: fmt(pt.sunrise),
    dhuhr: fmt(pt.dhuhr),
    asr: fmt(pt.asr),
    maghrib: fmt(pt.maghrib),
    isha: fmt(pt.isha),
    next: findNextPrayer(dates),
    dates,
  };
}

/**
 * Hook that returns prayer times.
 * Uses the AlAdhan API when methodId is 'aladhan-api', otherwise local calculation.
 * API is fetched once and cached; refreshes every 6 hours.
 */
export function usePrayerTimes(
  coords: { lat: number; lng: number } | null,
  methodId: string,
  now?: number,
): PrayerTimesResult & { dates: Record<string, Date> } | null {
  const [apiResult, setApiResult] = useState<PrayerTimesResult & { dates: Record<string, Date> } | null>(null);
  const lastFetch = useRef(0);
  const useApi = methodId === 'aladhan-api';

  // Fetch from API when method is 'aladhan-api'
  useEffect(() => {
    if (!useApi || !coords) return;
    if (Date.now() - lastFetch.current < 6 * 3600_000) return;
    let cancelled = false;
    fetchFromApi(coords, methodId).then((r) => {
      if (!cancelled) {
        setApiResult(r);
        lastFetch.current = Date.now();
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [coords?.lat, coords?.lng, useApi, methodId, now]);

  // For local methods, compute synchronously
  const localResult = !useApi && coords ? computeLocal(coords, methodId) : null;

  return useApi ? apiResult : localResult;
}
