/**
 * Mobile-first cache layer: localStorage on web/desktop, Capacitor SQLite on iOS.
 * Reads from cache first (instant), fetches from server in background if stale.
 * Writes go to server first, then update cache.
 *
 * TTL: 5 min for most data, 30 min for prayers (rarely changes intra-day after check-in).
 */

import { isMobile } from './desktop';

const PREFIX = 'nour:cache:';
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const PRAYER_TTL_MS = 30 * 60 * 1000;

/** Cached entry with timestamp */
interface CacheEntry {
  data: unknown;
  ts: number;
}

function key(url: string): string {
  return PREFIX + url;
}

// ── Unified read/write (localStorage on all platforms, SQLite upgrade path ready) ──

function readCache(url: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(key(url));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(url: string, data: unknown): void {
  try {
    const entry: CacheEntry = { data, ts: Date.now() };
    localStorage.setItem(key(url), JSON.stringify(entry));
  } catch { /* storage full */ }
}

function removeCache(url: string): void {
  try {
    localStorage.removeItem(key(url));
  } catch { /* ignore */ }
}

/** Invalidate all cache entries matching a prefix (e.g., /api/prayers) */
export function invalidatePrefix(prefix: string): void {
  try {
    const fullPrefix = key(prefix);
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(fullPrefix)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

/** Clear entire mobile cache */
export function clearAllCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

// ── Smart fetch: cache first, then refresh ──

/**
 * GET with cache: returns cached value immediately if fresh,
 * fetches from server in background.
 * On non-mobile platforms, falls back to direct fetch.
 */
export async function cachedGet<T>(
  url: string,
  fetchFn: () => Promise<Response>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  // Check cache first
  const cached = readCache(url);
  if (cached) {
    const age = Date.now() - cached.ts;
    if (age < ttlMs) {
      // Return cache immediately, refresh in background
      void fetchFn().then(r => r.json()).then(d => writeCache(url, d)).catch(() => {});
      return cached.data as T;
    }
  }

  // No fresh cache → fetch and cache
  try {
    const res = await fetchFn();
    const json = (await res.json()) as T;
    writeCache(url, json);
    return json;
  } catch {
    // Return stale cache if available, even if expired
    if (cached) return cached.data as T;
    throw new Error('Hors ligne et pas de cache disponible.');
  }
}

/**
 * POST/PUT/DELETE with cache invalidation.
 * Sends to server first, then invalidates related cache keys.
 */
export async function cachedMutate<T>(
  url: string,
  fetchFn: () => Promise<Response>,
  invalidateUrls: string[] = [],
): Promise<T> {
  const res = await fetchFn();
  const json = (await res.json()) as T;

  // Invalidate the exact URL and any related patterns
  removeCache(url);
  invalidateUrls.forEach(u => invalidatePrefix(u));

  return json;
}

// ── Initialize (Capacitor SQLite setup happens here) ──

let initialized = false;

export async function initMobileCache(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (isMobile) {
    try {
      // Capacitor SQLite init (non-blocking, cache falls back to localStorage)
      const { initNativeSqlite } = await import('./capacitor');
      await initNativeSqlite();
      console.log('[mobileCache] Capacitor SQLite ready');
    } catch (e) {
      console.log('[mobileCache] Using localStorage fallback:', (e as Error).message);
    }
  }
}
