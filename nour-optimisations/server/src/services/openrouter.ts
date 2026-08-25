
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Modèles gratuits de fallback (dans l'ordre de préférence) */
export const FALLBACK_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
] as const;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/** Délai avec jitter : évite le thundering herd */
function retryDelay(attempt: number): number {
  const exponential = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 500;
  return exponential + jitter;
}

/** Wrapper fetch avec retry exponentiel sur erreurs transitoires */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init);

      // Retry sur 429 (rate limit) et 5xx (erreur serveur)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries) {
          const delay = retryDelay(attempt);
          console.log(JSON.stringify({
            t: new Date().toISOString(),
            level: 'warn',
            msg: `OpenRouter ${response.status} — retry ${attempt + 1}/${retries} dans ${Math.round(delay)}ms`,
          }));
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }

      return response;
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        const delay = retryDelay(attempt);
        console.log(JSON.stringify({
          t: new Date().toISOString(),
          level: 'warn',
          msg: `OpenRouter network error — retry ${attempt + 1}/${retries} dans ${Math.round(delay)}ms`,
        }));
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError ?? new Error('OpenRouter: toutes les tentatives ont échoué');
}

export async function streamChat(opts: {
  model: string;
  messages: ChatMessage[];
  apiKey: string;
  signal?: AbortSignal;
}): Promise<Response> {
  return fetchWithRetry(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
      'HTTP-Referer': 'https://github.com/nour-islamic-chat',
      'X-OpenRouter-Title': 'Nour - Chat Islamique',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: 0.3,
      max_tokens: 1000, // Réduit de 1500 → 1000 (réponses plus concises)
      stream: true,
    }),
    signal: opts.signal,
  });
}

export interface ModelInfo {
  id: string;
  name: string;
  context_length?: number | null;
}

export async function listModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetchWithRetry('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenRouter models: ${res.status}`);
  const data = (await res.json()) as { data: ModelInfo[] };
  return data.data;
}

/**
 * Extrait le nombre de tokens utilisés depuis les headers de réponse OpenRouter.
 * Retourne 0 si non disponible.
 */
export function extractTokensUsed(response: Response): number {
  const usage = response.headers.get('x-openrouter-usage');
  if (!usage) return 0;
  try {
    const parsed = JSON.parse(usage) as { total_tokens?: number };
    return parsed.total_tokens ?? 0;
  } catch {
    return 0;
  }
}
