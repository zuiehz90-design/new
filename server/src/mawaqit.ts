/**
 * Client MAWAQIT — réplique exacte de l'API mrsofiane/mawaqit-api (MIT).
 *
 * Approche : on scrape https://mawaqit.net/fr/{masjid_id} et on extrait
 * le JSON `confData` qui contient les horaires OFFICIELS publiés par la
 * mosquée (times[5] + shuruq). C'est la source la plus précise possible :
 * ce sont les heures réelles affichées à la mosquée, pas un calcul.
 */
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

export interface MawaqitPrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  /** Nom de la mosquée source. */
  mosque: string;
  timezone: string;
  hijri: string;
}

const SEARCH_URL = 'https://mawaqit.net/api/2.0/mosque/search';

/** Cache mémoire : horaires par slug (TTL 1h). */
const timesCache = new Map<string, { data: MawaqitPrayerTimes; at: number }>();
const TTL_MS = 60 * 60 * 1000;

/**
 * Recherche des mosquées par mot-clé (API publique, aucune auth requise).
 * La réponse contient déjà les horaires du jour (times[6]).
 */
export async function searchMosques(query: string): Promise<MawaqitMosque[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${SEARCH_URL}?word=${encodeURIComponent(q)}&page=1&itemsPerPage=10`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Recherche MAWAQIT ${res.status}: ${text.slice(0, 200)}`);
  }
  const list = (await res.json()) as MawaqitMosque[];
  return list.map((m) => ({
    ...m,
    address: m.address ?? (m as Record<string, unknown>).localisation as string ?? '',
  }));
}

/**
 * Scrape la page publique d'une mosquée et extrait le JSON `confData`.
 * Réplique exacte du regex Python de mrsofiane/mawaqit-api :
 *   (?:var|let)\s+confData\s*=\s*(.*?);
 */
async function fetchConfData(masjidId: string): Promise<Record<string, unknown>> {
  const url = `https://mawaqit.net/fr/${encodeURIComponent(masjidId)}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'text/html', 'User-Agent': 'Nour/1.0' },
  });
  if (res.status === 404) throw new Error(`Mosquée "${masjidId}" introuvable.`);
  if (!res.ok) throw new Error(`MAWAQIT ${res.status} (${masjidId}).`);

  const html = await res.text();
  const re = /(?:var|let)\s+confData\s*=\s*(.*?);/s;
  const match = html.match(re);
  if (!match) throw new Error(`Impossible d'extraire les horaires de "${masjidId}".`);

  let confData: Record<string, unknown>;
  try {
    confData = JSON.parse(match[1]);
  } catch {
    throw new Error(`JSON confData invalide pour "${masjidId}".`);
  }
  return confData;
}

/**
 * Horaires officiels du jour pour une mosquée (scrapés, pas calculés).
 * times = [fajr, dhuhr, asr, maghrib, isha], shuruq = lever du soleil.
 */
export async function getPrayerTimes(masjidId: string): Promise<MawaqitPrayerTimes> {
  const cached = timesCache.get(masjidId);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  const confData = await fetchConfData(masjidId);
  const times = confData.times as string[] | undefined;
  const shuruq = (confData.shuruq as string) ?? '';

  if (!Array.isArray(times) || times.length < 5) {
    throw new Error(`Horaires indisponibles pour "${masjidId}".`);
  }

  const [fajr, dhuhr, asr, maghrib, isha] = times;
  const today = new Date().toISOString().slice(0, 10);
  const result: MawaqitPrayerTimes = {
    fajr,
    sunrise: shuruq || '--:--',
    dhuhr,
    asr,
    maghrib,
    isha,
    date: today,
    mosque: (confData.name as string) ?? masjidId,
    timezone: (confData.timezone as string) ?? 'Europe/Paris',
    hijri: (confData.hijriDate as string) ?? '',
  };

  timesCache.set(masjidId, { data: result, at: Date.now() });
  return result;
}
