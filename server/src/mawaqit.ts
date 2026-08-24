/**
 * Client HTTP pour l'API publique MAWAQIT (mawaqit.net).
 * - La recherche de mosquées est publique (pas d'auth nécessaire).
 * - Les horaires de prière sont calculés localement avec adhan.js
 *   à partir des coordonnées GPS de la mosquée, car l'API horaires
 *   nécessite un compte qui n'est plus accessible au public.
 */
import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, Madhab } from 'adhan';

export interface MawaqitMosque {
  uuid: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  [key: string]: unknown;
}

export interface CalculatedTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
}

const BASE = 'https://mawaqit.net/api';
const SEARCH_URL = `${BASE}/2.0/mosque/search`;

/** Méthodes de calcul populaires en France */
const METHODS: Record<string, { fajr: number; isha: number; label: string }> = {
  'uoif':    { fajr: 12, isha: 12, label: 'UOIF (12°/12°)' },
  'paris':   { fajr: 15, isha: 15, label: 'Mosquée de Paris (15°/15°)' },
  'mwl':     { fajr: 18, isha: 17, label: 'Muslim World League (18°/17°)' },
  'karachi': { fajr: 18, isha: 18, label: 'Karachi (18°/18°)' },
};

export const DEFAULT_METHOD = 'uoif';

function fmt(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function toDate(dateStr: string): Date {
  // Accepte "YYYY-MM-DD" ou ISO
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Recherche des mosquées par mot-clé (API publique, pas d'auth). */
export async function searchMosques(query: string): Promise<MawaqitMosque[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${SEARCH_URL}?word=${encodeURIComponent(q)}&page=1&itemsPerPage=10`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MAWAQIT search ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as MawaqitMosque[];
}

/** Calcule les horaires de prière à partir des coordonnées GPS. */
export function calculateTimes(
  latitude: number,
  longitude: number,
  dateStr: string = new Date().toISOString().slice(0, 10),
  method: string = DEFAULT_METHOD,
): CalculatedTimes {
  const coords = new Coordinates(latitude, longitude);
  const date = toDate(dateStr);
  const cfg = METHODS[method] ?? METHODS[DEFAULT_METHOD];
  const params = CalculationMethod.Other();
  params.fajrAngle = cfg.fajr;
  params.ishaAngle = cfg.isha;
  params.madhab = Madhab.Shafi;

  const times = new PrayerTimes(coords, date, params);
  const sunnah = new SunnahTimes(times);

  return {
    fajr: fmt(times.fajr),
    sunrise: fmt(times.sunrise),
    dhuhr: fmt(times.dhuhr),
    asr: fmt(times.asr),
    maghrib: fmt(times.maghrib),
    isha: fmt(times.isha),
    date: dateStr,
  };
}

export { METHODS };