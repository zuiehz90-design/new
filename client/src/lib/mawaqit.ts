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
  [key: string]: string;
}

export interface MethodInfo {
  id: string;
  label: string;
}

let methodsCache: { methods: MethodInfo[]; default: string } | null = null;

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

export async function getPrayerTimes(
  lat: number,
  lon: number,
  method: string = 'uoif',
  date?: string,
): Promise<PrayerTimes> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), method });
  if (date) params.set('date', date);
  const data = await api<{ times: PrayerTimes }>(`mawaqit/times?${params.toString()}`);
  return data.times;
}

export async function listMethods(): Promise<{ methods: MethodInfo[]; default: string }> {
  if (!methodsCache) {
    methodsCache = await api<{ methods: MethodInfo[]; default: string }>('mawaqit/methods');
  }
  return methodsCache!;
}