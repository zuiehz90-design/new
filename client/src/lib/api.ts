export interface ApiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ModelOption {
  id: string;
  name: string;
  context_length: number | null;
}

/**
 * Appelle POST /api/chat (proxy Express -> OpenRouter) et reconstitue
 * le flux SSE (Server-Sent Events) token par token.
 */
export async function chatStream(opts: {
  messages: ApiChatMessage[];
  model: string;
  onDelta: (text: string) => void;
  signal: AbortSignal;
}): Promise<void> {
  const token = getToken();
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages: opts.messages, model: opts.model }),
    signal: opts.signal,
  });

  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      msg = data.error ?? data.message ?? msg;
    } catch {
      /* corps non JSON */
    }
    throw new Error(msg);
  }

  if (!res.body) throw new Error('Réponse vide du serveur.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string; reasoning?: string; reasoning_details?: Array<{ text?: string }> } }>;
        };
        const delta = json.choices?.[0]?.delta;
        const chunk = delta?.content ?? delta?.reasoning ?? delta?.reasoning_details?.[0]?.text;
        if (typeof chunk === "string" && chunk) opts.onDelta(chunk);
      } catch {
        /* chunk partiel, on ignore */
      }
    }
  }
}

export async function fetchModels(): Promise<ModelOption[]> {
  try {
    const token = getToken();
    const res = await fetchWithTimeout('/api/models', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: ModelOption[] };
    return data.models ?? [];
  } catch {
    return [];
  }
}

export async function fetchHealth(): Promise<{ aiConfigured: boolean; hasUserKey: boolean; model: string } | null> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetchWithTimeout('/api/health', { headers });
    if (!res.ok) return null;
    return (await res.json()) as { aiConfigured: boolean; hasUserKey: boolean; model: string };
  } catch {
    return null;
  }
}

export async function apiGetAchievements<T>(): Promise<T | null> {
  try {
    const token = getToken();
    if (!token) return null;
    const res = await fetchWithTimeout('/api/achievements', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

/* ---------- Comptes, salat check-in & quêtes ---------- */

export interface UserProfile {
  goals?: string[];
  note?: string;
  gender?: 'male' | 'female';
  [key: string]: unknown;
}

export interface User {
  id: number;
  name: string;
  profile: UserProfile;
  createdAt: string;
  /** true si le profil est un fantome temporaire (cree automatiquement). */
  isAnonymous?: boolean;
}

export interface PrayerStatus {
  date: string;
  checked: string[];
  total: number;
  of: number;
  streak: { current: number; best: number };
}

export interface Quest {
  quest_id: string;
  title: string;
  description: string;
  type: string;
  points: number;
  done: number;
  /** Verification requise avant validation (serveur) : null si aucune. */
  verification: { kind: string } | null;
  /** Quiz associe a la quete (serveur) : null si aucun. */
  quiz: { type: string; q: string; options: string[] } | null;
}

export interface QuestsData {
  date: string;
  quests: Quest[];
  score: number;
  lifetime: number;
  completed: number;
}

const TOKEN_KEY = 'nour:token';

// Mobile cache: dynamic import (tree-shaken on web)
let _mobileCache: typeof import('./mobileCache') | null = null;
async function mobileCache() {
  if (!_mobileCache) {
    try { _mobileCache = await import('./mobileCache'); } catch { return null; }
  }
  return _mobileCache;
}
const DEFAULT_API_TIMEOUT_MS = 12_000;
const AUTH_API_TIMEOUT_MS = 60_000;

class ApiRequestError extends Error {
  status?: number;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_API_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  if (init.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener('abort', forwardAbort, { once: true });
  }
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if ((error as DOMException)?.name === 'AbortError') {
      throw new Error('Le serveur met trop de temps à répondre. Réessaie dans quelques secondes.');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    init.signal?.removeEventListener('abort', forwardAbort);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

let _skipCache = false;
/** Call before a GET to bypass the mobile cache (e.g. after a mutation). */
export function skipNextCache(): void { _skipCache = true; }

async function apiFetch<T>(path: string, opts: RequestInit = {}, timeoutMs = DEFAULT_API_TIMEOUT_MS): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Mobile: use cache for GET, invalidate cache on POST/PUT/DELETE
  const isGet = !opts.method || opts.method === 'GET';
  const mc = await mobileCache();

  if (mc && isGet) {
    return mc.cachedGet<T>(path, () => fetchWithTimeout(path, { ...opts, headers }, timeoutMs));
  }

  const res = await fetchWithTimeout(path, { ...opts, headers }, timeoutMs);
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    const error = new ApiRequestError(data.error ?? `Erreur ${res.status}`);
    error.status = res.status;
    throw error;
  }

  // Invalidate cache on mutations
  if (mc && !isGet) {
    mc.invalidatePrefix(path);
  }

  return data as T;
}

export async function apiRegister(name: string, password: string): Promise<{ token: string; user: User }> {
  const res = await apiFetch<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });
  setToken(res.token);
  return res;
}

export async function apiLogin(name: string, password: string): Promise<{ token: string; user: User }> {
  const res = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });
  setToken(res.token);
  return res;
}

/** Cree (ou reutilise) un profil fantome : compte anonyme temporaire. */
export async function apiAnonymous(options?: { persist?: boolean }): Promise<{ token: string; user: User }> {
  const res = await apiFetch<{ token: string; user: User }>('/api/auth/anonymous', {
    method: 'POST',
  }, AUTH_API_TIMEOUT_MS);
  if (options?.persist !== false) setToken(res.token);
  return res;
}

export async function apiLogout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } finally {
    setToken(null);
  }
}

export async function apiMe(): Promise<User | null> {
  if (!getToken()) return null;
  try {
    const res = await apiFetch<{ user: User }>('/api/auth/me', {}, AUTH_API_TIMEOUT_MS);
    return res.user;
  } catch (error) {
    // Une panne ou un réveil lent ne doit pas déconnecter un compte valide.
    if ((error as ApiRequestError).status === 401) setToken(null);
    return null;
  }
}

export async function apiUpdateProfile(patch: { name?: string; profile?: UserProfile }): Promise<User> {
  const res = await apiFetch<{ user: User }>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  return res.user;
}

export function apiPrayers(): Promise<PrayerStatus> {
  return apiFetch<PrayerStatus>('/api/prayers');
}

export function apiCheckPrayer(prayer: string, opts?: { late?: boolean; lateMinutes?: number }): Promise<{ ok: boolean; newBadges?: string[]; penalty?: number }> {
  return apiFetch('/api/prayers/check', { method: 'POST', body: JSON.stringify({ prayer, ...(opts ?? {}) }) });
}

export function apiUncheckPrayer(prayer: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/prayers/uncheck', { method: 'POST', body: JSON.stringify({ prayer }) });
}

export function apiQuests(): Promise<QuestsData> {
  return apiFetch<QuestsData>('/api/quests');
}

export interface SyncMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  offline?: boolean;
}

export interface SyncConversation {
  id: string;
  title: string;
  messages: SyncMessage[];
  createdAt: number;
  updatedAt: number;
}

export async function apiGetConversations(): Promise<SyncConversation[]> {
  const res = await apiFetch<{ conversations: SyncConversation[] }>('/api/conversations');
  return res.conversations ?? [];
}

export async function apiSaveConversations(conversations: SyncConversation[]): Promise<void> {
  await apiFetch('/api/conversations', { method: 'PUT', body: JSON.stringify({ conversations }) });
}

export interface CompleteQuestOpts {
  /** Reponse au quiz de verification (index de la bonne option). */
  answer?: number;
}

export function apiCompleteQuest(questId: string, opts?: CompleteQuestOpts): Promise<{ ok: boolean; done: boolean; points?: number; newBadges?: string[]; newRank?: any; correct?: string; code?: string }> {
  return apiFetch(`/api/quests/${questId}/complete`, { method: 'POST', body: opts ? JSON.stringify(opts) : undefined });
}

export interface QuizResult {
  ok: boolean;
  prophet: string;
  score: number;
  total: number;
  points: number;
  first: boolean;
  best: boolean;
  newBadges?: string[];
  newRank?: any;
}

export function apiCompleteQuiz(prophet: string, score: number, total: number): Promise<QuizResult> {
  return apiFetch('/api/quiz/complete', { method: 'POST', body: JSON.stringify({ prophet, score, total }) });
}

export interface ProphetProgressEntry {
  prophet: string;
  score: number;
  total: number;
  points: number;
  completed: boolean;
  completedAt: string;
}

export async function apiQuizProgress(): Promise<ProphetProgressEntry[]> {
  try {
    const res = await apiFetch<{ progress: ProphetProgressEntry[] }>('/api/quiz/progress');
    return res.progress ?? [];
  } catch {
    return [];
  }
}

export interface RankDistributionEntry {
  id: string; tier: string; division: number | null; name: string;
  min: number; icon: string; color: string; count: number; pct: number;
}

export function apiGetRankDistribution(): Promise<{ ranks: RankDistributionEntry[]; total: number }> {
  return apiFetch('/api/achievements/ranks/distribution');
}
