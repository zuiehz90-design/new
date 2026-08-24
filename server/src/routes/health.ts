import { Router } from 'express';
import { config } from '../config.js';
import { getUserApiKey } from './setup.js';
import { getSessionUser } from '../auth.js';
import { getSyncStatus } from '../sync.js';

export const healthRouter = Router();

/**
 * Endpoint ultra-léger pour les moniteurs de disponibilité (UptimeRobot, cron-job.org, etc.).
 * Aucune connexion DB, aucune vérification d'auth → répond en < 5ms.
 */
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
  });
});
