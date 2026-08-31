
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function streamChat(opts: {
  model: string;
  messages: ChatMessage[];
  apiKey: string;
  signal?: AbortSignal;
}): Promise<Response> {
  return fetch(OPENROUTER_URL, {
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
      // Plafond généreux : 900 tronquait les réponses détaillées en pleine
      // phrase (finish_reason=length, invisible car le flux se termine
      // proprement). Le streaming affiche les tokens dès le début, donc un
      // plafond haut ne coûte que le cas où le modèle écrit vraiment long.
      max_tokens: 3000,
      stream: true,
      // Ne jamais renvoyer le raisonnement interne du modèle : il ne doit pas
      // être affiché à l'utilisateur et consomme des tokens inutilement.
      // Désactiver le raisonnement accélère aussi le premier token.
      // NB : include_reasoning est un alias déprécié de reasoning.exclude —
      // on envoie les deux pour couvrir tous les modèles.
      include_reasoning: false,
      reasoning: { exclude: true },
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
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenRouter models: ${res.status}`);
  const data = (await res.json()) as { data: ModelInfo[] };
  return data.data;
}
