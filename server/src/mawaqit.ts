/**
 * Client HTTP pour l'API officielle MAWAQIT (mawaqit.net).
 * Authentification par Basic Auth (email/mot de passe) → token JWT.
 * Le token est mis en cache en mémoire, rafraîchi automatiquement en cas de 401.
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
  hijri: string;
  date: string;
  fajr: string;
  sunrise: string;
  dohr: string;
  asr: string;
  maghreb: string;
  icha: string;
  [key: string]: unknown;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface MosqueInfo {
  uuid: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  [key: string]: unknown;
}

interface SearchResult {
  uuid: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  [key: string]: unknown;
}

const BASE = 'https://mawaqit.net/api';
const V2 = '2.0';
const V3 = '3.0';
const LOGIN_URL = `${BASE}/${V2}/me`;
const SEARCH_URL = `${BASE}/${V2}/mosque/search`;
const PRAYER_TIMES_URL = (uuid: string) => `${BASE}/${V2}/mosque/${uuid}/prayer-times`;
const MOSQUE_INFO_URL = (uuid: string) => `${BASE}/${V3}/mosque/${uuid}/info`;

let tokenCache: TokenCache | null = null;

function getAuthHeader(): string {
  const username = process.env.MAWAQIT_USERNAME;
  const password = process.env.MAWAQIT_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'MAWAQIT_USERNAME et MAWAQIT_PASSWORD doivent être définis dans les variables d\'environnement.\n' +
      'Créez un compte gratuit sur https://mawaqit.net/fr/register'
    );
  }

  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

async function httpGet<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MAWAQIT ${res.status} ${url}: ${text}`);
  }
  return (await res.json()) as T;
}

async function httpPost<T>(url: string, headers: Record<string, string>, body?: string): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MAWAQIT ${res.status} ${url}: ${text}`);
  }
  return (await res.json()) as T;
}

/**
 * Authentifie auprès de l'API MAWAQIT et obtient un token.
 * Le token est mis en cache en mémoire (valide environ 24h).
 */
async function getToken(): Promise<string> {
  const now = Date.now();
  // Rafraîchir 1 heure avant expiration
  if (tokenCache && tokenCache.expiresAt > now + 3600_000) {
    return tokenCache.token;
  }

  const auth = getAuthHeader();
  const data = await httpPost<{ apiAccessToken: string }>(
    LOGIN_URL,
    { 'Authorization': auth, 'Content-Type': 'application/json' },
  );

  const token = data.apiAccessToken;
  if (!token) throw new Error('MAWAQIT: le token n\'a pas été retourné. Vérifiez vos identifiants.');

  // Durée approximative : 24h
  tokenCache = { token, expiresAt: now + 23 * 3600_000 };
  console.log('[mawaqit] Token obtenu');
  return token;
}

async function mawaqitGet<T>(url: string): Promise<T> {
  const token = await getToken();
  try {
    return await httpGet<T>(url, {
      'Authorization': token,
      'Api-Access-Token': token,
      'Content-Type': 'application/json',
    });
  } catch (err) {
    // Si 401, le token est expiré → on invalide le cache et on réessaie une fois
    if ((err as Error).message.includes('401')) {
      tokenCache = null;
      const newToken = await getToken();
      return await httpGet<T>(url, {
        'Authorization': newToken,
        'Api-Access-Token': newToken,
        'Content-Type': 'application/json',
      });
    }
    throw err;
  }
}

/**
 * Recherche des mosquées par mot-clé.
 */
export async function searchMosques(query: string): Promise<MawaqitMosque[]> {
  if (!query.trim() || query.trim().length < 2) return [];
  const url = `${SEARCH_URL}?word=${encodeURIComponent(query.trim())}&page=1&itemsPerPage=10`;
  return await mawaqitGet<SearchResult[]>(url);
}

/**
 * Récupère les informations d'une mosquée.
 */
export async function getMosqueInfo(uuid: string): Promise<MosqueInfo> {
  const url = MOSQUE_INFO_URL(uuid);
  return await mawaqitGet<MosqueInfo>(url);
}

/**
 * Récupère les horaires de prière du jour pour une mosquée.
 */
export async function getPrayerTimes(uuid: string): Promise<MawaqitPrayerTimes> {
  const url = PRAYER_TIMES_URL(uuid);
  const data = await mawaqitGet<MawaqitPrayerTimes>(url);
  return data;
}