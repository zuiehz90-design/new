import { Router } from 'express';
import { config } from '../config.js';
import { getUserApiKey } from './setup.js';
import { getSessionUser } from '../auth.js';

export const healthRouter = Router();

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
