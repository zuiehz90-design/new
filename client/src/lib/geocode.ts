/* Géocodage gratuit via OpenStreetMap Nominatim — aucune clé API requise. */

export interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

interface NominatimItem {
  lat: string;
  lon: string;
  display_name?: string;
  name?: string;
}

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'fr,en;q=0.8,*;q=0.5' },
  });
  if (!res.ok) throw new Error('Geocode HTTP ' + res.status);
  return (await res.json()) as T;
}

/** Recherche une ville ou un code postal -> liste de coordonnées (max 5). */
export async function searchCity(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = NOMINATIM + '/search?format=jsonv2&limit=5&q=' + encodeURIComponent(q);
  const data = await json<NominatimItem[]>(url);
  return data.map((r) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    name: r.display_name ?? r.name ?? r.lat + ', ' + r.lon,
  }));
}

/** Nom court d'un lieu : "Paris, Île-de-France, France" -> "Paris, Île-de-France". */
export function shortPlaceName(full: string): string {
  return full
    .split(',')
    .slice(0, 2)
    .map((p) => p.trim())
    .filter(Boolean)
    .join(', ');
}

/** Géocodage inverse : coordonnées -> nom de lieu (ou null si indisponible). */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = NOMINATIM + '/reverse?format=jsonv2&zoom=10&lat=' + lat + '&lon=' + lng;
    const data = await json<{ display_name?: string; name?: string }>(url);
    const full = data.display_name ?? data.name;
    return full ? shortPlaceName(full) : null;
  } catch {
    return null;
  }
}

/** Traduit un code d'erreur de géolocalisation en clé i18n. */
export function geoErrorKey(code: number): string {
  switch (code) {
    case 1:
      return 'prayer.geoDenied';
    case 3:
      return 'prayer.geoTimeout';
    case 2:
    default:
      return 'prayer.geoUnavailable';
  }
}
