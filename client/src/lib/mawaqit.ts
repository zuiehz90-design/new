/**
 * Client MAWAQIT côté frontend : recherche de mosquée et horaires de prière.
 * Toutes les requêtes passent par le backend Nour (proxy), jamais directement
 * vers mawaqit.net — le token reste côté serveur.
 */

export interface MawaqitMosque {
  uuid: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  [key: string]: unknown;
}

export interface MawaqitPrayerTimes {
  hijri?: string;
  date?: string;
  fajr: string;
  sunrise: string;
  dohr: string;
  asr: string;
  maghreb: string;
  icha: string;
  [key: string]: unknown;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('nour:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Recherche des mosquées par mot-clé (via le backend Nour). */
export async function searchMawaqitMosques(query: string): Promise<MawaqitMosque[]> {
  if (!query.trim() || query.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/mawaqit/search?q=${encodeURIComponent(query.trim())}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { mosques: MawaqitMosque[] };
    return data.mosques ?? [];
  } catch {
    return [];
  }
}

/** Récupère les horaires de prière du jour pour une mosquée. */
export async function fetchMawaqitTimes(uuid: string): Promise<MawaqitPrayerTimes | null> {
  if (!uuid) return null;
  try {
    const res = await fetch(`/api/mawaqit/mosque/${encodeURIComponent(uuid)}/times`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { times: MawaqitPrayerTimes };
    return data.times ?? null;
  } catch {
    return null;
  }
}
