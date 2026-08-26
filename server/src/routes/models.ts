import { Router } from 'express';
import { getResolvedApiKey } from './setup.js';
import { authMiddleware } from './auth.js';
import { listModels } from '../services/openrouter.js';

export const modelsRouter = Router();

const cache = new Map<number, { at: number; data: unknown }>();

modelsRouter.get('/', authMiddleware, async (req: any, res) => {
  const userId = Number(req.user?.id);
  const apiKey = getResolvedApiKey(userId);
  if (!apiKey) {
    res.json({
      configured: false,
      models: [
        { id: 'openrouter/free', name: 'Free Models Router (automatique)', context_length: 128000 },
      ],
    });
    return;
  }

  const cached = cache.get(userId);
  if (cached && Date.now() - cached.at < 10 * 60_000) {
    res.json(cached.data);
    return;
  }

  try {
    const all = await listModels(apiKey);
    const free = all
      .filter((model) => model.id.endsWith(':free'))
      .map((model) => ({ id: model.id, name: model.name, context_length: model.context_length ?? null }));
    const data = {
      configured: true,
      models: [
        { id: 'openrouter/free', name: 'Free Models Router (automatique)', context_length: 128000 },
        ...free,
      ],
    };
    cache.set(userId, { at: Date.now(), data });
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: `Impossible de lister les modèles : ${String(error)}` });
  }
});
