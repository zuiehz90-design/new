# Guide de fusion — Explication détaillée des modifications

> Ce document explique **exactement** ce qui a été modifié dans chaque fichier,
> **pourquoi**, et **comment l'intégrer** dans un autre projet similaire.

---

## Sommaire rapide

1. [Compression gzip (server/src/app.ts)](#1-compression-gzip)
2. [Logging JSON structuré (server/src/app.ts)](#2-logging-json)
3. [Route admin (server/src/routes/admin.ts)](#3-route-admin)
4. [Cache IA côté serveur (server/src/services/aiCache.ts)](#4-cache-ia)
5. [Circuit breaker (server/src/services/circuitBreaker.ts)](#5-circuit-breaker)
6. [Retry exponentiel + fallback modèles (server/src/services/openrouter.ts)](#6-retry-fallback)
7. [Prompt optimisé (server/src/prompt.ts)](#7-prompt-optimise)
8. [Intégration cache + breaker + fallback (server/src/routes/chat.ts)](#8-integration-chat)
9. [Endpoint métriques (server/src/routes/health.ts)](#9-endpoint-metriques)
10. [Nettoyage rate limiter (server/src/middleware/rateLimit.ts)](#10-rate-limiter)
11. [Sync Neon optimisé (server/src/sync.ts)](#11-sync-neon)
12. [Service Worker v7 (client/public/sw.js)](#12-service-worker)
13. [Code splitting Vite (client/vite.config.ts)](#13-code-splitting)
14. [Prefetch intelligent (client/src/hooks/usePrefetch.ts)](#14-prefetch)
15. [Intégration prefetch dans navigation (client/src/App.tsx)](#15-app-prefetch)
16. [Sentry error tracking (client/src/lib/sentry.ts)](#16-sentry)
17. [Init Sentry dans main.tsx (client/src/main.tsx)](#17-main-sentry)

---

## 1. Compression gzip {#1-compression-gzip}

**Fichier** : `server/src/app.ts`

**Ce qui a changé** :
- Ajout de `import compression from 'compression'`
- Ajout du middleware `app.use(compression({ threshold: 1024, level: 6 }))` AVANT les routes

**Pourquoi** : Réduit la taille des réponses JSON de ~60%. Un payload de 10KB devient ~4KB.

**Pour fusionner** :
```bash
npm install compression @types/compression
```
Puis ajouter dans votre `app.ts` :
```typescript
import compression from 'compression';
// Après le CORS, avant les routes :
app.use(compression({ threshold: 1024, level: 6 }));
```

**Impact** : Aucun risque. Le header `Accept-Encoding: gzip` est envoyé automatiquement par les navigateurs.

---

## 2. Logging JSON structuré {#2-logging-json}

**Fichier** : `server/src/app.ts`

**Ce qui a changé** :
- Le middleware de logging maintenant écrit du JSON structuré au lieu de texte brut
- Ajout de la latence par requête (ms) et du status code
- Le handler d'erreur log aussi du JSON

**Avant** :
```
2024-01-15T10:30:00.000Z GET /api/chat
[ERROR] some error message
```

**Après** :
```json
{"t":"2024-01-15T10:30:00.000Z","m":"GET /api/chat","ms":42,"s":200}
{"t":"2024-01-15T10:30:00.000Z","level":"error","msg":"some error message"}
```

**Pourquoi** : Les logs JSON sont exploitables par des outils (Render Logs, Datadog, etc.).

**Pour fusionner** : Remplacer le bloc `app.use((req, _res, next) => { ... })` dans app.ts par :
```typescript
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      console.log(JSON.stringify({ t: new Date().toISOString(), m: `${req.method} ${req.url}`, ms, s: res.statusCode }));
    });
  }
  next();
});
```

---

## 3. Route admin {#3-route-admin}

**Fichier** : `server/src/routes/admin.ts` (NOUVEAU)

**Contenu** : Deux endpoints protégés par auth :
- `GET /api/admin/status` — État complet : cache, circuit breaker, sync, mémoire, uptime
- `POST /api/admin/circuit-breaker/reset` — Reset manuel du circuit breaker

**Pour fusionner** :
1. Copier le fichier `server/src/routes/admin.ts`
2. Dans `app.ts`, ajouter :
```typescript
import { adminRouter } from './routes/admin.js';
// Après les autres routes :
app.use('/api/admin', adminRouter);
```

**Sécurité** : Ces endpoints sont protégés par `authMiddleware`. Seul un utilisateur connecté peut y accéder. En production, ajouter un flag `is_admin` dans la table users.

---

## 4. Cache IA côté serveur {#4-cache-ia}

**Fichier** : `server/src/services/aiCache.ts` (NOUVEAU)

**Comment ça marche** :
1. Quand un utilisateur pose une question, le dernier message est normalisé (minuscules, accents retirés, espaces compressés)
2. Un hash MD5 (tronqué à 16 chars) est généré comme clé de cache
3. Seules les conversations courtes (≤3 messages user, ≤6 messages total) sont cachées
4. Les messages de 5 à 300 caractères sont cachables (les trop courts/longs sont trop génériques/spécifiques)
5. TTL : 1 heure. Limite : 500 entrées (nettoyage des 20% plus anciens quand plein)
6. Nettoyage automatique toutes les 5 minutes des entrées expirées

**Exported API** :
```typescript
makeCacheKey(messages) → string | null  // Génère la clé ou null si non cachable
getCached(key) → CacheEntry | null      // HIT ou MISS
setCached(key, response, model, tokens) // Stocke la réponse
getCacheStats() → { size, hits, misses, hitRate }
```

**Pour fusionner** : Copier le fichier tel quel. Aucune dépendance externe (utilise `node:crypto`).

---

## 5. Circuit breaker {#5-circuit-breaker}

**Fichier** : `server/src/services/circuitBreaker.ts` (NOUVEAU)

**Automate à 3 états** :
```
CLOSED ──(5 erreurs)──→ OPEN ──(60s timeout)──→ HALF_OPEN
   ↑                                                │
   └──────────(succès)──────────────────────────────┘
                                                         │
   HALF_OPEN ──(échec)──→ OPEN
```

**Exported API** :
```typescript
canCall() → boolean          // Autorise l'appel ?
recordSuccess()              // Appeler après un appel réussi
recordFailure()              // Appeler après un appel échoué
getStatus() → { state, failures, trips, openSince }
reset()                      // Reset manuel
```

**Pour fusionner** : Copier le fichier tel quel. Zéro dépendance externe.

---

## 6. Retry exponentiel + fallback modèles {#6-retry-fallback}

**Fichier** : `server/src/services/openrouter.ts`

**Ce qui a changé** :
- Ajout de `fetchWithRetry()` : wrapper de fetch avec 3 tentatives max
- Délai exponentiel : 1s → 2s → 4s + jitter aléatoire (évite le thundering herd)
- Retry automatique sur HTTP 429 (rate limit) et 5xx (erreur serveur)
- Ajout de `FALLBACK_MODELS` : liste de modèles gratuits par ordre de préférence
- `max_tokens` réduit de 1500 → 1000
- Ajout de `extractTokensUsed()` pour lire les headers de réponse

**Pour fusionner** :
1. Copier les constantes `FALLBACK_MODELS`, `retryDelay()`, `fetchWithRetry()`
2. Remplacer `fetch()` par `fetchWithRetry()` dans `streamChat()` et `listModels()`
3. Réduire `max_tokens` de 1500 à 1000

**Ordre de fallback** :
1. `meta-llama/llama-3.1-8b-instruct:free` (meilleure qualité)
2. `mistralai/mistral-7b-instruct:free` (bonne alternative)
3. `google/gemma-2-9b-it:free` (dernier recours)

---

## 7. Prompt optimisé {#7-prompt-optimise}

**Fichier** : `server/src/prompt.ts`

**Ce qui a changé** : Le system prompt a été réécrit pour être plus concis :
- Avant : ~400 mots, 8 règles détaillées
- Après : ~150 mots, 7 règles courtes + instruction "SOIS CONCIS : 100-200 mots"

**Impact** : Réduction de ~60% des tokens système envoyés à chaque appel.

**Pour fusionner** : Remplacer la valeur de `SYSTEM_PROMPT` par la nouvelle version.
Adapter la règle 7 ("SOIS CONCIS") selon le ton souhaité.

---

## 8. Intégration chat {#8-integration-chat}

**Fichier** : `server/src/routes/chat.ts`

**Ce qui a changé** (ordre d'exécution dans le handler POST `/api/chat`) :
1. **Cache HIT** : Si la question est en cache → réponse simulée en streaming (<1ms), header `X-Cache: HIT`
2. **Circuit breaker** : Si ouvert → réponse 503 immédiate sans appel à OpenRouter
3. **Appel IA** : `streamChat()` avec retry automatique
4. **Fallback** : Si 429/402/503 → essaie chaque modèle de `FALLBACK_MODELS` jusqu'à succès
5. **Cache MISS** : Après streaming complet, stocke la réponse si elle fait > 20 caractères
6. **Logging** : Chaque requête logue : modèle, latence, tokens, cache hit/miss, fallback

**Pour fusionner** :
1. Copier les imports : `aiCache`, `circuitBreaker`, `FALLBACK_MODELS`
2. Ajouter le bloc cache HIT au début du handler
3. Ajouter le bloc circuit breaker après le cache
4. Ajouter le bloc fallback après le premier `streamChat()`
5. Ajouter l'accumulation de `fullResponse` dans la boucle de streaming
6. Ajouter le `setCached()` à la fin
7. Ajouter les `console.log(JSON.stringify(...))` structurés

---

## 9. Endpoint métriques {#9-endpoint-metriques}

**Fichier** : `server/src/routes/health.ts`

**Ce qui a changé** :
- Ajout de `GET /api/health/metrics` : métriques agrégées (uptime, mémoire, cache, circuit breaker, sync, version Node)
- Ajout de `uptime` dans le health check existant

**Pour fusionner** :
1. Ajouter les imports : `getCacheStats` depuis `aiCache.js`, `getCircuitBreakerStatus` depuis `circuitBreaker.js`
2. Ajouter l'endpoint `/metrics` :
```typescript
healthRouter.get('/metrics', (_req, res) => {
  res.json({
    uptime: Math.round(process.uptime()),
    memory: { rss: ..., heapUsed: ... },
    cache: getCacheStats(),
    circuitBreaker: getCircuitBreakerStatus(),
    sync: getSyncStatus(),
    node: process.version,
  });
});
```

---

## 10. Rate limiter {#10-rate-limiter}

**Fichier** : `server/src/middleware/rateLimit.ts`

**Ce qui a changé** :
- Ajout de nettoyage automatique : toutes les 60s, les IPs inactives (> 5min) sont supprimées
- Ajout de `getRateLimitStats()` : retourne le nombre d'IPs trackées

**Pourquoi** : Évite la fuite mémoire sur serveurs à longue durée de vie.

**Pour fusionner** : Ajouter le bloc `setInterval` et `getRateLimitStats()` à la fin du fichier.

---

## 11. Sync Neon optimisé {#11-sync-neon}

**Fichier** : `server/src/sync.ts`

**Ce qui a changé** :
- `PUSH_INTERVAL` : 30s → 5min (réduit de 90%)
- `PULL_INTERVAL` : 2min → 10min (réduit de 92%)
- Ajout d'un flag `dirty` : le push ne s'exécute que si des données ont changé
- `dirty = false` après chaque push réussi

**Pourquoi** : Neon gratuit a des limites de connexions. Ces intervals réduisent la charge de ~90%.

**Pour fusionner** :
1. Remplacer les constantes d'intervalle
2. Ajouter `let dirty = false;` avec les autres variables
3. Ajouter un setter `dirty = true` dans les fonctions qui modifient des données (ex: `markRead()`, `logPrayer()`)
4. Ajouter `dirty = false;` après le push réussi

---

## 12. Service Worker v7 {#12-service-worker}

**Fichier** : `client/public/sw.js`

**Ce qui a changé** :
- Version bump : v6 → v7
- Timeout réseau réduit : 1500ms → 800ms (affichage plus rapide)
- Ajout de `fetchWithTimeout()` : course réseau/cache avec timeout
- Navigation : stale-while-revalidate accéléré (cache immédiat + réseau en arrière-plan)
- Assets statiques : stale-while-revalidate au lieu de network-first
- Ajout du listener `message` pour `SKIP_WAITING` (activation instantanée du nouveau SW)
- Commentaires structurés par section

**Pourquoi** : Le SW v6 attendait 1500ms avant de servir le cache. Avec le cold start Render (20-50s), l'utilisateur voyait un écran blanc. Le v7 sert le cache en <800ms.

**Pour fusionner** : Remplacer tout le fichier `client/public/sw.js` par la nouvelle version.

---

## 13. Code splitting Vite {#13-code-splitting}

**Fichier** : `client/vite.config.ts`

**Ce qui a changé** :
- Ajout de `rollupOptions.output.manualChunks` pour séparer :
  - `react-vendor` : react, react-dom, react-router-dom (~162KB)
  - `markdown` : react-markdown, remark-gfm (~157KB)
- Ajout de `cssCodeSplit: true`
- Ajout de `chunkSizeWarningLimit: 200`
- Ajout de `optimizeDeps.include` pour le pré-bundling

**Pourquoi** : Les chunks séparés permettent la mise en cache partielle. Si seuls les composants changent, les vendor chunks restent identiques → le navigateur les sert depuis le cache.

**Pour fusionner** : Ajouter les blocs `rollupOptions`, `cssCodeSplit`, et `optimizeDeps` dans le `defineConfig`.

---

## 14. Prefetch intelligent {#14-prefetch}

**Fichier** : `client/src/hooks/usePrefetch.ts` (NOUVEAU)

**Comment ça marche** :
1. Au survol d'un lien de navigation (onMouseEnter), lance un prefetch après debounce de 100ms
2. Utilise `requestIdleCallback` pour ne pas impacter le rendu principal
3. Ne prefetch qu'une seule fois par chemin (Set `prefetched`)
4. Pré-fetch définis : `/prayer` → `apiPrayers()`, `/quests` → `apiQuests()`

**Pour fusionner** :
1. Copier le fichier `usePrefetch.ts`
2. Adapter les `prefetchers` selon les routes de votre projet

---

## 15. Intégration prefetch dans App {#15-app-prefetch}

**Fichier** : `client/src/App.tsx`

**Ce qui a changé** :
- Import de `usePrefetch` depuis `./hooks/usePrefetch`
- Destructuration : `const { schedulePrefetch, cancelPrefetch } = usePrefetch()`
- Ajout de `onMouseEnter={() => schedulePrefetch(item.to)}` et `onMouseLeave={cancelPrefetch}` sur chaque lien de navigation (desktop et mobile)

**Pour fusionner** :
1. Ajouter l'import
2. Appeler `usePrefetch()` dans le composant `Shell()`
3. Ajouter les handlers sur vos composants de navigation

---

## 16. Sentry error tracking {#16-sentry}

**Fichier** : `client/src/lib/sentry.ts` (NOUVEAU)

**Comment ça marche** :
- Lazy import de `@sentry/react` uniquement en production
- Si `VITE_SENTRY_DSN` n'est pas défini, rien ne se passe
- `tracesSampleRate: 0.1` (10% des transactions, dans le plan gratuit de 100k/mois)
- Filtre les erreurs réseau (CORS, offline) qui sont non pertinentes

**Pour fusionner** :
```bash
npm install @sentry/react
```
Copier le fichier `sentry.ts`, puis initialiser dans `main.tsx`.

---

## 17. Init Sentry dans main.tsx {#17-main-sentry}

**Fichier** : `client/src/main.tsx`

**Ce qui a changé** :
```typescript
import { initSentry } from './lib/sentry';
initSentry(); // Après les imports, avant ReactDOM.createRoot
```

**Pour fusionner** : Ajouter ces 2 lignes dans votre `main.tsx`.

---

## Checklist de fusion

Pour intégrer ces optimisations dans un autre projet :

### Backend (serveur)
- [ ] `npm install compression @types/compression`
- [ ] Copier `aiCache.ts`, `circuitBreaker.ts`
- [ ] Copier `admin.ts`
- [ ] Modifier `app.ts` (compression + logging + route admin)
- [ ] Modifier `chat.ts` (cache + breaker + fallback + logging)
- [ ] Modifier `openrouter.ts` (retry + fallback + max_tokens)
- [ ] Modifier `prompt.ts` (prompt optimisé)
- [ ] Modifier `health.ts` (endpoint metrics)
- [ ] Modifier `rateLimit.ts` (cleanup)
- [ ] Modifier `sync.ts` (intervals + dirty flag)

### Frontend (client)
- [ ] Copier `usePrefetch.ts`, `sentry.ts`
- [ ] Modifier `sw.js` (v7)
- [ ] Modifier `vite.config.ts` (code splitting)
- [ ] Modifier `App.tsx` (prefetch handlers)
- [ ] Modifier `main.tsx` (init Sentry)

### Tests
- [ ] `npm install` (pour les nouvelles dépendances)
- [ ] Copier `aiCache.test.ts`, `circuitBreaker.test.ts`
- [ ] `npm test` — vérifier que tous les tests passent
- [ ] `npm run typecheck` — vérifier qu'il n'y a pas d'erreurs TypeScript

### Configuration
- [ ] Ajouter `VITE_SENTRY_DSN=` dans `.env.example` et les env vars Render
- [ ] Configurer UptimeRobot sur `/api/ping` (toutes les 5 min)
