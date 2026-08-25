import { Router } from 'express';
import { config } from '../config.js';
import { getUserApiKey } from './setup.js';
import { authMiddleware } from './auth.js';
import { SYSTEM_PROMPT } from '../prompt.js';
import { moderateContent } from '../services/moderation.js';
import { streamChat, FALLBACK_MODELS, type ChatMessage } from '../services/openrouter.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { makeCacheKey, getCached, setCached } from '../services/aiCache.js';
import { canCall, recordSuccess, recordFailure } from '../services/circuitBreaker.js';

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

  // ── Vérification du cache ──
  const cacheKey = makeCacheKey(body);
  if (cacheKey) {
    const cached = getCached(cacheKey);
    if (cached) {
      // Simuler le streaming SSE avec la réponse cachée
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.setHeader('X-Cache', 'HIT');
      res.flushHeaders?.();

      // Découper la réponse en chunks pour simuler le streaming
      const chunkSize = 40;
      for (let i = 0; i < cached.response.length; i += chunkSize) {
        const chunk = cached.response.slice(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
      console.log(JSON.stringify({
        t: new Date().toISOString(), m: 'POST /api/chat', cache: 'HIT',
        model: cached.model, latency: 0,
      }));
      return;
    }
  }

  // ── Vérification du circuit breaker ──
  if (!canCall()) {
    res.status(503).json({
      error: "Le service IA est temporairement indisponible. Réessayez dans quelques secondes.",
      circuitBreaker: 'OPEN',
    });
    return;
  }

  const start = Date.now();
  const abort = new AbortController();
  res.on('close', () => abort.abort());

  let upstream: Response;
  let usedModel = chosenModel;
  let usedFallback = false;

  try {
    upstream = await streamChat({ model: chosenModel, messages: body, apiKey, signal: abort.signal });
  } catch (err) {
    recordFailure();
    res.status(502).json({ error: "Impossible de joindre OpenRouter. Vérifiez votre connexion." });
    return;
  }

  // ── Fallback automatique si le modèle principal échoue ──
  if ((upstream.status === 429 || upstream.status === 402 || upstream.status === 503) && !usedFallback) {
    for (const fbModel of FALLBACK_MODELS) {
      try {
        console.log(JSON.stringify({
          t: new Date().toISOString(), level: 'warn',
          msg: `Fallback: ${usedModel} → ${fbModel} (HTTP ${upstream.status})`,
        }));
        upstream = await streamChat({ model: fbModel, messages: body, apiKey, signal: abort.signal });
        if (upstream.ok) {
          usedModel = fbModel;
          usedFallback = true;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  if (!upstream.ok) {
    recordFailure();
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

  recordSuccess();

  if (!upstream.body) {
    res.status(502).json({ error: "Réponse vide de la part de l'IA." });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (usedFallback) res.setHeader('X-Model-Used', usedModel);
  res.flushHeaders?.();

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  let tokenCount = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      // Accumuler la réponse complète pour le cache
      for (const line of text.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
            usage?: { total_tokens?: number };
          };
          const chunk = json.choices?.[0]?.delta?.content;
          if (chunk) fullResponse += chunk;
          if (json.usage?.total_tokens) tokenCount = json.usage.total_tokens;
        } catch { /* chunk partiel */ }
      }
      res.write(value);
    }
    res.end();

    const elapsed = Date.now() - start;
    console.log(JSON.stringify({
      t: new Date().toISOString(), m: 'POST /api/chat',
      model: usedModel, latency: elapsed, tokens: tokenCount,
      cache: 'MISS', fallback: usedFallback,
    }));

    // Mettre en cache si la réponse est significative
    if (fullResponse.length > 20 && cacheKey) {
      setCached(cacheKey, fullResponse, usedModel, tokenCount);
    }
  } catch {
    if (!res.writableEnded) res.end();
  }
});
