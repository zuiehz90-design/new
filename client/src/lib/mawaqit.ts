/** Client MAWAQIT — appels au proxy backend Nour. */
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

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  mosque: string;
  timezone: string;
  hijri: string;
  [key: string]: string;
}

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`/api/${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((body as { error?: string }).error ?? `Erreur ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function searchMosques(query: string): Promise<MawaqitMosque[]> {
  if (!query || query.length < 2) return [];
  const data = await api<{ mosques: MawaqitMosque[] }>(`mawaqit/search?q=${encodeURIComponent(query)}`);
  return data.mosques ?? [];
}

export async function getMosqueTimes(masjidId: string): Promise<PrayerTimes> {
  const data = await api<{ times: PrayerTimes }>(
    `mawaqit/mosque/${encodeURIComponent(masjidId)}/times`,
  );
  return data.times;
}
