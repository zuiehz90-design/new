/**
 * Cache de réponses IA côté serveur.
 * 
 * Stratégie : hash du dernier message utilisateur (normalisé) → réponse.
 * Pour les questions fréquentes (piliers, prières, ramadan, etc.),
 * la réponse est servie en <1ms sans aucun appel à OpenRouter.
 * 
 * TTL configurable (défaut : 1h). Limite en mémoire : 500 entrées max.
 */

import { createHash } from 'node:crypto';

interface CacheEntry {
  response: string;
  model: string;
  tokens: number;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const MAX_ENTRIES = 500;
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 heure

let cacheHits = 0;
let cacheMisses = 0;

/** Normalise un texte pour le hashing : minuscule, espaces multiples → 1, trim */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500); // limiter la clé
}

/** Génère une clé de cache basée sur le dernier message utilisateur */
export function makeCacheKey(messages: Array<{ role: string; content: string }>): string | null {
  // On ne met en cache QUE les conversations courtes (1-3 messages)
  // Les conversations longues sont trop spécifiques pour être cacheables
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) return null;
  if (userMessages.length > 3) return null;
  if (messages.length > 6) return null; // system + max 5 messages

  const lastUser = userMessages[userMessages.length - 1];
  if (!lastUser.content || lastUser.content.length < 5) return null;
  if (lastUser.content.length > 300) return null; // trop long = probablement spécifique

  const key = normalize(lastUser.content);
  if (key.length < 3) return null;
  return createHash('md5').update(key).digest('hex').slice(0, 16);
}

/** Récupère une réponse du cache. Retourne null si miss. */
export function getCached(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) {
    cacheMisses++;
    return null;
  }
  if (Date.now() - entry.ts > DEFAULT_TTL_MS) {
    cache.delete(key);
    cacheMisses++;
    return null;
  }
  cacheHits++;
  return entry;
}

/** Stocke une réponse dans le cache */
export function setCached(key: string, response: string, model: string, tokens: number): void {
  // Éviter de surcharger le cache
  if (cache.size >= MAX_ENTRIES) {
    // Supprimer les 20% les plus anciens
    const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    const toDelete = Math.ceil(MAX_ENTRIES * 0.2);
    for (let i = 0; i < toDelete && i < entries.length; i++) {
      cache.delete(entries[i][0]);
    }
  }

  cache.set(key, { response, model, tokens, ts: Date.now() });
}

/** Statistiques du cache */
export function getCacheStats() {
  return {
    size: cache.size,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: cacheHits + cacheMisses > 0
      ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100)
      : 0,
  };
}

/** Nettoyage périodique des entrées expirées */
const _cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.ts > DEFAULT_TTL_MS) cache.delete(key);
  }
}, 5 * 60 * 1000); // toutes les 5 min
// Ne pas empêcher le process de quitter (utile pour les tests)
if (typeof _cleanupTimer === 'object' && 'unref' in _cleanupTimer) {
  _cleanupTimer.unref();
}
