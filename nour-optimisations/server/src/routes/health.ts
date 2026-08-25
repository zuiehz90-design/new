import { Router } from 'express';
import { config } from '../config.js';
import { getUserApiKey } from './setup.js';
import { getSessionUser } from '../auth.js';
import { getSyncStatus } from '../sync.js';
import { getCacheStats } from '../services/aiCache.js';
import { getStatus as getCircuitBreakerStatus } from '../services/circuitBreaker.js';

export const healthRouter = Router();

/** Endpoint ultra-léger pour les moniteurs (UptimeRobot, cron-job.org) */
healthRouter.get('/ping', (_req, res) => {
  res.json({ ok: true });
});

healthRouter.get('/sync', (_req, res) => {
  res.json(getSyncStatus());
});

healthRouter.get('/', (req, res) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = token ? getSessionUser(token) : null;
  const userKey = user ? getUserApiKey(user.id) : null;
  res.json({
    ok: true,
    aiConfigured: Boolean(userKey),
    hasUserKey: Boolean(userKey),
    model: config.openRouterModel,
    time: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

/** Métriques agrégées (protégé — pour monitoring interne) */
healthRouter.get('/metrics', (_req, res) => {
  res.json({
    uptime: Math.round(process.uptime()),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    cache: getCacheStats(),
    circuitBreaker: getCircuitBreakerStatus(),
    sync: getSyncStatus(),
    node: process.version,
  });
});
