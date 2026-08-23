import { Router } from 'express';
import { config } from '../config.js';
import { getUserApiKey } from './setup.js';
import { authMiddleware } from './auth.js';
import { SYSTEM_PROMPT } from '../prompt.js';
import { moderateContent } from '../services/moderation.js';
import { streamChat, type ChatMessage } from '../services/openrouter.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const chatRouter = Router();

chatRouter.post('/', rateLimit(15, 60_000), authMiddleware, async (req, res) => {
  const userId = (req as any).user?.id;
  const apiKey = userId ? getUserApiKey(userId) : null;
  if (!apiKey) {
    res.status(503).json({
      error: "Configurez votre clé API OpenRouter dans les réglages pour utiliser le chat IA.",
    });
    return;
  }

  const { messages, model } = (req.body ?? {}) as {
    messages?: Array<{ role?: string; content?: unknown }>;
    model?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Aucun message fourni.' });
    return;
  }

  const clean: ChatMessage[] = [];
  for (const m of messages.slice(-12)) {
    if (!m || typeof m.content !== 'string') continue;
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    const problem = moderateContent(m.content);
    if (problem) {
      res.status(400).json({ error: problem });
      return;
    }
    clean.push({ role: m.role, content: m.content.slice(0, 4000) });
  }

  if (clean.length === 0) {
    res.status(400).json({ error: 'Aucun message valide.' });
    return;
  }

  const body: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...clean];
  const chosenModel = typeof model === 'string' && model ? model : config.openRouterModel;

  const abort = new AbortController();
  res.on('close', () => abort.abort());

  let upstream: Response;
  try {
    upstream = await streamChat({ model: chosenModel, messages: body, apiKey, signal: abort.signal });
  } catch (err) {
    res.status(502).json({ error: "Impossible de joindre OpenRouter. Vérifiez votre connexion." });
    return;
  }

  if (!upstream.ok) {
    let detail = '';
    try {
      detail = (await upstream.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    const status = upstream.status;
    const message =
      status === 401
        ? 'Clé OpenRouter invalide.'
        : status === 402
          ? 'Crédit OpenRouter insuffisant. Les modèles :free restent disponibles.'
          : status === 429
            ? 'Limite de requêtes OpenRouter atteinte. Réessayez dans un instant.'
            : 'Erreur OpenRouter (' + status + ').';
    res.status(502).json({ error: (message + ' ' + detail).trim() });
    return;
  }

  if (!upstream.body) {
    res.status(502).json({ error: "Réponse vide de la part de l'IA." });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch {
    if (!res.writableEnded) res.end();
  }
});
