import { Router } from 'express';
import { config } from '../config.js';
import { getResolvedApiKey } from './setup.js';
import { authMiddleware } from './auth.js';
import { SYSTEM_PROMPT } from '../prompt.js';
import { moderateContent } from '../services/moderation.js';
import { streamChat, type ChatMessage } from '../services/openrouter.js';
import { rateLimit } from '../middleware/rateLimit.js';

const THINKING_PATTERNS = /\b(okay|let me|i need to|i should|the user|user just said|user asked|first,|maybe|to answer|to structure|guidelines|l'utilisateur|l'objectif|je dois fournir|je vais structurer|je vais fournir|pour répondre|pour repondre|afin de|pour éviter|pour eviter|comme un agent|il est important)\b/i;

function stripThinking(text: string): string {
  const paragraphs = text.split(/\n{2,}/);
  let start = 0;
  while (start < paragraphs.length && THINKING_PATTERNS.test(paragraphs[start])) start++;
  return paragraphs.slice(start).filter((paragraph) => !THINKING_PATTERNS.test(paragraph)).join('\n\n');
}

export const chatRouter = Router();

chatRouter.post('/', rateLimit(15, 60_000), authMiddleware, async (req, res) => {
  const userId = (req as any).user?.id;
  const apiKey = userId ? getResolvedApiKey(userId) : null;
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
  // Contexte léger : 8 derniers messages seulement, 2500 caractères max chacun.
  // Moins de tokens envoyés = premier token reçu plus vite (latence réduite).
  for (const m of messages.slice(-8)) {
    if (!m || typeof m.content !== 'string') continue;
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    const problem = moderateContent(m.content);
    if (problem) {
      res.status(400).json({ error: problem });
      return;
    }
    clean.push({ role: m.role, content: m.content.slice(0, 2500) });
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
            : status === 404
              ? 'Le mod�le IA s�lectionn� n�est plus disponible gratuitement. Rechargez l�application pour utiliser le nouveau mod�le par d�faut.'
              : 'Erreur OpenRouter (' + status + ').';
    res.status(502).json({ error: message });
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
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const event of events) {
        const line = event.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }
        try {
          const data = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string; [key: string]: unknown } }> };
          const delta = data.choices?.[0]?.delta;
          if (delta?.content) delta.content = stripThinking(delta.content);
          res.write('data: ' + JSON.stringify(data) + '\n\n');
        } catch {
          res.write(event + '\n\n');
        }
      }
    }
    res.end();
  } catch {
    if (!res.writableEnded) res.end();
  }
});
