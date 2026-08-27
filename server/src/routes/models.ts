import { Router } from 'express';
import { getResolvedApiKey } from './setup.js';
import { authMiddleware } from './auth.js';
import { listModels } from '../services/openrouter.js';
import { DEFAULT_MODEL, DEFAULT_MODEL_LABEL, FREE_ROUTER_MODEL } from '../modelDefaults.js';

export const modelsRouter = Router();

const cache = new Map<number, { at: number; data: unknown }>();

/**
 * Indices qu'un modèle est un « reasoning model » (écrit sa réflexion interne
 * avant la réponse). Ces modèles restent disponibles, mais marqués et classés
 * en bas de liste pour ne pas être choisis par défaut.
 */
export function isReasoningModel(id: string): boolean {
  return /\b(r1|r1[-_ ]?distill|thinking|reasoner|deepseek-v\d|qwen3?(?:-|_)?\d.*(?:think|reason)|gemini.*(?:think|reason)|o[134]|claude.*(?:think|sonnet-4)|gpt-?o[134]|mini.*think|max-?thinking)\b/i.test(id);
}

/** Nom court et lisible d'un modèle : garde les 2-3 derniers segments. */
export function shortName(id: string, fullName: string): string {
  const segments = id.split('/').filter(Boolean);
  const short = segments.slice(-2).join('/').replace(/:free$/, '');
  return fullName && fullName.length < 70 ? fullName : short;
}

/** Classe les modèles : défaut d'abord, non-raisonneurs, raisonneurs, routeur. */
export function sortModels<T extends { id: string; reasoning?: boolean }>(models: T[]): T[] {
  return [...models].sort((a, b) => {
    const aReason = a.reasoning === true;
    const bReason = b.reasoning === true;
    if (aReason !== bReason) return aReason ? 1 : -1;
    return (a.id ?? '').localeCompare(b.id ?? '');
  });
}

modelsRouter.get('/', authMiddleware, async (req: any, res) => {
  const userId = Number(req.user?.id);
  const apiKey = getResolvedApiKey(userId);

  // Hors clé : on propose quand même le modèle par défaut (utilisable via la
  // clé serveur globale si configurée) + le routeur automatique.
  const fallbackList = [
    { id: DEFAULT_MODEL, name: DEFAULT_MODEL_LABEL, context_length: 131072 },
    { id: FREE_ROUTER_MODEL, name: 'Routeur automatique (modèles gratuits aléatoires)', context_length: 128000 },
  ];
  if (!apiKey) {
    res.json({ configured: false, models: fallbackList });
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
      .filter((model) => model.id.endsWith(':free') && model.id !== FREE_ROUTER_MODEL)
      .map((model) => ({
        id: model.id,
        name: model.name,
        context_length: model.context_length ?? null,
        reasoning: isReasoningModel(model.id),
      }));

    // Tri : non-raisonneurs d'abord, raisonneurs ensuite.
    const sorted = sortModels(free);

    const models = [
      { id: DEFAULT_MODEL, name: DEFAULT_MODEL_LABEL, context_length: 131072 },
      ...sorted.map((m) => ({
        id: m.id,
        name: (m.reasoning ? '🧠 ' : '⚡ ') + shortName(m.id, m.name) + (m.reasoning ? ' (raisonnement)' : ''),
        context_length: m.context_length,
      })),
      { id: FREE_ROUTER_MODEL, name: 'Routeur automatique (modèles gratuits aléatoires)', context_length: 128000 },
    ];

    const data = { configured: true, models };
    cache.set(userId, { at: Date.now(), data });
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: `Impossible de lister les modèles : ${String(error)}` });
  }
});
