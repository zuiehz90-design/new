# Fichiers modifiés / créés — Optimisations Nour

> Ce document répertorie tous les fichiers impactés par les optimisations de performance,
> résilience et observabilité. À fusionner (merge) avec le projet cible.

---

## Fichiers MODIFIÉS (13 fichiers existants)

| # | Fichier | Type | Lignes +/- |
|---|---------|------|------------|
| 1 | `server/src/app.ts` | Backend | +14 / -4 |
| 2 | `server/src/routes/chat.ts` | Backend | +101 / -12 |
| 3 | `server/src/routes/health.ts` | Backend | +23 / -6 |
| 4 | `server/src/services/openrouter.ts` | Backend | +82 / -4 |
| 5 | `server/src/prompt.ts` | Backend | +7 / -10 |
| 6 | `server/src/middleware/rateLimit.ts` | Backend | +22 / -3 |
| 7 | `server/src/sync.ts` | Backend | +3 / -3 |
| 8 | `client/public/sw.js` | Frontend | +79 / -33 |
| 9 | `client/vite.config.ts` | Frontend | +17 / -0 |
| 10 | `client/src/App.tsx` | Frontend | +8 / -0 |
| 11 | `client/src/main.tsx` | Frontend | +4 / -1 |
| 12 | `package.json` | Config | +5 / -1 |
| 13 | `.env.example` | Config | +5 / -0 |

---

## Fichiers CRÉÉS (7 fichiers nouveaux)

| # | Fichier | Type | Description |
|---|---------|------|-------------|
| 1 | `server/src/services/aiCache.ts` | Backend | Cache MD5 des réponses IA (TTL 1h, 500 entrées) |
| 2 | `server/src/services/circuitBreaker.ts` | Backend | Circuit breaker (5 erreurs → OPEN 60s) |
| 3 | `server/src/routes/admin.ts` | Backend | Endpoint admin (status + reset circuit breaker) |
| 4 | `server/src/services/aiCache.test.ts` | Test | 8 tests unitaires pour le cache IA |
| 5 | `server/src/services/circuitBreaker.test.ts` | Test | 5 tests unitaires pour le circuit breaker |
| 6 | `client/src/hooks/usePrefetch.ts` | Frontend | Prefetch intelligent via requestIdleCallback |
| 7 | `client/src/lib/sentry.ts` | Frontend | Sentry lazy init (production only) |

---

## Dépendances ajoutées (dans package.json)

| Paquet | Type | Usage |
|--------|------|-------|
| `compression` | runtime | Compression gzip des réponses Express |
| `@types/compression` | dev | Types TypeScript pour compression |
| `@sentry/react` | runtime | Error tracking côté client (plan gratuit) |

---

## Variables d'environnement ajoutées

```bash
# .env.example
VITE_SENTRY_DSN=  # Optionnel — Sentry DSN pour error tracking
```

---

## Résumé d'impact

| Catégorie | Avant | Après | Gain |
|-----------|-------|-------|------|
| Cache IA | Aucun | <1ms pour questions fréquentes | **~2000ms → 0ms** |
| Tokens par réponse | ~1500 max | ~1000 max | **-33%** |
| Taille réseau | Sans gzip | gzip level 6 | **-60%** |
| Intervalle sync Neon | 30s push / 2min pull | 5min push / 10min pull | **-90% requêtes DB** |
| SW timeout | 1500ms | 800ms | **-47% attente** |
| Circuit breaker | Aucun | 5 erreurs → coupe 60s | **Pas de cascade** |
| Fallback modèles | Aucun | Llama → Mistral → Gemma | **Dispo continue** |
