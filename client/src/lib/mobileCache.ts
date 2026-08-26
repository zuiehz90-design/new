/**
 * Cache client partage : localStorage sur web/desktop, SQLite mobile en extension.
 *
 * La page peut lire instantanément le dernier snapshot connu. Les GET frais sont
 * revalidés en arrière-plan, tandis que les mutations invalident tout le domaine
 * concerné. Les clés sont isolées par compte pour éviter toute fuite entre sessions.
 */

import { isMobile } from './desktop';

const PREFIX = 'nour:cache:v2:';
const DEFAULT_TTL_MS = 5 * 60 * 1000;
export const PRAYER_TTL_MS = 30 * 60 * 1000;
const CACHE_EVENT = 'nour:cache-updated';

interface CacheEntry {
  data: unknown;
  ts: number;
}

export interface CacheUpdateEvent {
  url: string;
  scope: string;
  background: boolean;
}

export interface CachedGetOptions {
  scope?: string;
  force?: boolean;
  staleIfError?: boolean;
  revalidate?: boolean;
  onFresh?: (data: unknown) => void;
}

function browser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/** Hash déterministe : le token ne se retrouve jamais dans la clé localStorage. */
export function cacheScope(scope: string | null | undefined): string {
  const input = scope || 'public';
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${input === 'public' ? 'public' : 'account'}-${(hash >>> 0).toString(36)}`;
}

function key(url: string, scope: string): string {
  return `${PREFIX}${cacheScope(scope)}:${url}`;
}

function readCache(url: string, scope: string): CacheEntry | null {
  if (!browser()) return null;
  try {
    const raw = localStorage.getItem(key(url, scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    return parsed && typeof parsed.ts === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(url: string, scope: string, data: unknown, background: boolean): void {
  if (!browser()) return;
  try {
    localStorage.setItem(key(url, scope), JSON.stringify({ data, ts: Date.now() } satisfies CacheEntry));
    window.dispatchEvent(new CustomEvent<CacheUpdateEvent>(CACHE_EVENT, {
      detail: { url, scope: cacheScope(scope), background },
    }));
  } catch {
    // Un stockage plein ne doit jamais bloquer l'interface.
  }
}

function removeCache(url: string, scope: string): void {
  if (!browser()) return;
  try { localStorage.removeItem(key(url, scope)); } catch { /* ignore */ }
}

export function invalidatePrefix(prefix: string, scope?: string): void {
  if (!browser()) return;
  try {
    const prefixes = scope
      ? [key(prefix, scope)]
      : [`${PREFIX}${cacheScope('public')}:${prefix}`, `${PREFIX}account-`];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const stored = localStorage.key(i);
      if (stored && prefixes.some((candidate) => stored.startsWith(candidate))) keys.push(stored);
    }
    keys.forEach((stored) => localStorage.removeItem(stored));
    window.dispatchEvent(new CustomEvent<CacheUpdateEvent>(CACHE_EVENT, {
      detail: { url: prefix, scope: scope ? cacheScope(scope) : 'all', background: false },
    }));
  } catch {
    // Ignore storage access errors (private browsing / quota).
  }
}

export function invalidatePrefixes(prefixes: string[], scope?: string): void {
  prefixes.forEach((prefix) => invalidatePrefix(prefix, scope));
}

export function clearAllCache(): void {
  if (!browser()) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const stored = localStorage.key(i);
      if (stored?.startsWith(PREFIX)) keys.push(stored);
    }
    keys.forEach((stored) => localStorage.removeItem(stored));
  } catch { /* ignore */ }
}

export function subscribeCacheUpdates(listener: (event: CacheUpdateEvent) => void): () => void {
  if (!browser()) return () => {};
  const onUpdate = (event: Event) => listener((event as CustomEvent<CacheUpdateEvent>).detail);
  window.addEventListener(CACHE_EVENT, onUpdate);
  return () => window.removeEventListener(CACHE_EVENT, onUpdate);
}

async function fetchAndStore<T>(
  url: string,
  fetchFn: () => Promise<Response>,
  scope: string,
  stale: CacheEntry | null,
  staleIfError: boolean,
  background: boolean,
  onFresh?: (data: T) => void,
): Promise<T> {
  try {
    const response = await fetchFn();
    if (!response.ok) {
      const error = new Error(`Erreur ${response.status}`) as Error & { status?: number; retryable?: boolean };
      error.status = response.status;
      error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      throw error;
    }
    const data = (await response.json()) as T;
    writeCache(url, scope, data, background);
    onFresh?.(data);
    return data;
  } catch (error) {
    if (staleIfError && stale) return stale.data as T;
    throw error;
  }
}

/**
 * GET cache-first. Un snapshot frais est rendu immédiatement et revalidé en
 * arrière-plan ; force=true attend la réponse réseau et ignore le cache.
 */
export async function cachedGet<T>(
  url: string,
  fetchFn: () => Promise<Response>,
  ttlMs = DEFAULT_TTL_MS,
  options: CachedGetOptions = {},
): Promise<T> {
  const scope = options.scope ?? 'public';
  const stale = readCache(url, scope);
  const fresh = stale && Date.now() - stale.ts < ttlMs;

  if (!options.force && fresh) {
    if (options.revalidate !== false) {
      void fetchAndStore<T>(url, fetchFn, scope, stale, false, true, options.onFresh).catch(() => {});
    }
    return stale!.data as T;
  }

  return fetchAndStore<T>(url, fetchFn, scope, stale, options.staleIfError !== false, false, options.onFresh);
}

/** Compatibilité pour les appels spécialisés mobiles. */
export async function cachedMutate<T>(
  url: string,
  fetchFn: () => Promise<Response>,
  invalidateUrls: string[] = [],
  scope = 'public',
): Promise<T> {
  const res = await fetchFn();
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const json = (await res.json()) as T;
  removeCache(url, scope);
  invalidatePrefixes(invalidateUrls, scope);
  return json;
}

let initialized = false;

export async function initMobileCache(): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (isMobile) {
    try {
      const { initNativeSqlite } = await import('./capacitor');
      await initNativeSqlite();
      console.log('[mobileCache] Capacitor SQLite ready');
    } catch (error) {
      console.log('[mobileCache] Using localStorage fallback:', (error as Error).message);
    }
  }
}
