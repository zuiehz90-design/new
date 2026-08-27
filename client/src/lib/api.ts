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
 * Certains modèles de raisonnement écrivent leur réflexion interne en anglais
 * (« Okay, the user just said... », « Let me recall... ») avant la vraie
 * réponse, même avec reasoning.exclude. Ce filtre détecte ce préambule et le
 * coupe : on ne garde que la réponse réelle.
 */
const THINKING_HINTS =
  /\b(okay|alright|let me|i need to|i should|i will|i'll|i can|i think|i'm|the user|user just said|user asked|let's|to be|check if|remember|to be safe|so maybe|to answer|actually|hmm|first,|wait,|maybe|to avoid|to keep|to make|to cover|to structure|recall|guidelines|instruction)\b/i;

function isThinkingSegment(text: string): boolean {
  return THINKING_HINTS.test(text);
}

/**
 * Coupe le préambule de raisonnement d'un début de réponse.
 * Découpe en paragraphes : tant qu'un paragraphe ressemble à du raisonnement
 * interne, on l'ignore ; dès qu'un paragraphe « réponse » apparaît, on renvoie
 * le texte à partir de ce point.
 * Retourne null si TOUT le texte ressemble à du raisonnement (cas où il faut
 * continuer d'accumuler avant de trancher), et le texte intact s'il ne
 * ressemble pas à du raisonnement.
 */
export function stripThinkingPreamble(text: string): string | null {
  if (!text) return text;
  const paragraphs = text.split(/\n{2,}/);
  for (let i = 0; i < paragraphs.length; i++) {
    if (!isThinkingSegment(paragraphs[i])) {
      return paragraphs.slice(i).join('\n\n');
    }
  }
  // Tout ressemble à du raisonnement : on ne peut pas encore trancher.
  return null;
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
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (!res.body) throw new Error('Réponse vide du serveur.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  // Préambule non encore affiché (avant détection du début de la vraie réponse).
  let pending = '';
  let started = false;

  const flush = () => {
    if (!pending) return;
    if (!started) {
      // Premier contenu : retire un éventuel préambule de raisonnement.
      const cleaned = stripThinkingPreamble(pending);
      if (cleaned !== null && cleaned.trim()) {
        started = true;
        opts.onDelta(cleaned);
        pending = '';
      }
      // Si null : tout ressemble à du raisonnement → on continue d'accumuler.
    } else {
      opts.onDelta(pending);
      pending = '';
    }
  };

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
        // On n'affiche que le contenu final : le raisonnement interne du modèle
        // (delta.reasoning) ne doit jamais être montré à l'utilisateur.
        const content = delta?.content || '';
        if (content) {
          pending += content;
          // On accumule un peu (ou jusqu'à un saut de paragraphe) avant de
          // trancher sur l'éventuel préambule de raisonnement.
          if (pending.length >= 200 || pending.includes('\n\n')) flush();
        }
      } catch {
        /* chunk partiel, on ignore */
      }
    }
  }

  // Fin du flux : libère le contenu restant. Si le préambule n'a jamais pu
  // être tranché (tout semblait être du raisonnement), on affiche quand même
  // le contenu pour ne jamais rien perdre.
  if (!started && pending.trim()) {
    opts.onDelta(pending);
  } else {
    flush();
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

export async function apiGetAchievements<T>(options: ApiFetchOptions = {}): Promise<T | null> {
  if (!getToken()) return null;
  try {
    return await apiFetch<T>('/api/achievements', {}, DEFAULT_API_TIMEOUT_MS, options);
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
const UID_KEY = 'nour:uid';

/** Identifiant utilisateur mémorisé : permet de rendre l'app immédiatement
 *  au bon scope pendant le réveil de Render (sans attendre le réseau). */
export function getCachedUid(): number | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(UID_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setCachedUid(uid: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(UID_KEY, String(uid));
}

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

export function isRetryableApiError(error: unknown): boolean {
  const value = error as { retryable?: boolean; status?: number } | null;
  if (value?.retryable === false) return false;
  const status = value?.status;
  return !(typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 409 && status !== 429);
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

export interface ApiFetchOptions {
  force?: boolean;
  staleIfError?: boolean;
  revalidate?: boolean;
  onFresh?: (data: unknown) => void;
}

function cacheDomains(path: string): string[] {
  const base = path.split('?')[0];
  if (base.startsWith('/api/quests')) return ['/api/quests', '/api/achievements'];
  if (base.startsWith('/api/challenges')) {
    // Le claim attribue des points (rang) : la carte de rang doit se rafraîchir tout de suite.
    return base.endsWith('/claim') ? ['/api/challenges', '/api/achievements'] : ['/api/challenges'];
  }
  if (base.startsWith('/api/prayers/check') || base.startsWith('/api/prayers/uncheck')) return ['/api/prayers', '/api/quests', '/api/achievements'];
  if (base.startsWith('/api/prayers')) return ['/api/prayers'];
  if (base.startsWith('/api/achievements')) return ['/api/achievements'];
  if (base.startsWith('/api/profile')) return ['/api/profile', '/api/auth'];
  if (base.startsWith('/api/quiz')) return ['/api/quiz', '/api/achievements'];
  if (base.startsWith('/api/conversations')) return ['/api/conversations'];
  return [base];
}

async function apiFetch<T>(path: string, opts: RequestInit = {}, timeoutMs = DEFAULT_API_TIMEOUT_MS, cacheOptions: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Cache partagé : le token sert seulement d'identité de cache et n'est jamais
  // écrit en clair dans la clé localStorage (mobileCache le hache).
  const isGet = !opts.method || opts.method === 'GET';
  const mc = await mobileCache();
  const scope = token ?? 'public';

  if (mc && isGet) {
    return mc.cachedGet<T>(path, () => fetchWithTimeout(path, { ...opts, headers }, timeoutMs), undefined, {
      scope,
      force: cacheOptions.force,
      staleIfError: cacheOptions.staleIfError,
      revalidate: cacheOptions.revalidate,
      onFresh: cacheOptions.onFresh,
    });
  }

  const res = await fetchWithTimeout(path, { ...opts, headers }, timeoutMs);
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    const error = new ApiRequestError(data.error ?? `Erreur ${res.status}`);
    error.status = res.status;
    throw error;
  }

  // Invalidate all related GET domains after a successful mutation.
  if (mc && !isGet) {
    mc.invalidatePrefixes(cacheDomains(path), scope);
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
    const res = await apiFetch<{ user: User }>('/api/auth/me', {}, AUTH_API_TIMEOUT_MS, { force: true, staleIfError: false, revalidate: false });
    return res.user;
  } catch (error) {
    // Une panne ou un réveil lent ne doit pas déconnecter un compte valide.
    if ((error as ApiRequestError).status === 401) setToken(null);
    return null;
  }
}

/** Enregistre la clé API OpenRouter sur le compte (jamais stockée côté client). */
export async function apiSaveApiKey(key: string): Promise<void> {
  await apiFetch('/api/setup/setup-key', { method: 'POST', body: JSON.stringify({ key: key.trim() }) });
}

export async function apiUpdateProfile(patch: { name?: string; profile?: UserProfile }, mutationId?: string): Promise<User> {
  const res = await apiFetch<{ user: User }>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ ...patch, ...(mutationId ? { mutationId } : {}) }),
  });
  return res.user;
}

export function apiPrayers(options: ApiFetchOptions = {}): Promise<PrayerStatus> {
  return apiFetch<PrayerStatus>('/api/prayers', {}, DEFAULT_API_TIMEOUT_MS, options);
}

export function apiCheckPrayer(prayer: string, opts?: { late?: boolean; lateMinutes?: number }): Promise<{ ok: boolean; newBadges?: string[]; newRank?: any; penalty?: number }> {
  return apiFetch('/api/prayers/check', { method: 'POST', body: JSON.stringify({ prayer, ...(opts ?? {}) }) });
}

export function apiUncheckPrayer(prayer: string): Promise<{ ok: boolean; newBadges?: string[]; newRank?: any; penalty?: number }> {
  return apiFetch('/api/prayers/uncheck', { method: 'POST', body: JSON.stringify({ prayer }) });
}

export function apiQuests(options: ApiFetchOptions = {}): Promise<QuestsData> {
  return apiFetch<QuestsData>('/api/quests', {}, DEFAULT_API_TIMEOUT_MS, options);
}

export interface WeeklyChallenge {
  challenge_id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  points: number;
  progress: number;
  claimed: boolean;
  completed: boolean;
}

export interface ChallengesData {
  week_start: string;
  challenges: WeeklyChallenge[];
}

export function apiChallenges(options: ApiFetchOptions = {}): Promise<ChallengesData> {
  return apiFetch<ChallengesData>('/api/challenges', {}, DEFAULT_API_TIMEOUT_MS, options);
}

export interface ClaimChallengeResult {
  ok: boolean;
  claimed: boolean;
  points: number;
  newBadges?: string[];
  newRank?: any;
  code?: string;
}

export function apiClaimChallenge(challengeId: string): Promise<ClaimChallengeResult> {
  return apiFetch(`/api/challenges/${challengeId}/claim`, { method: 'POST' });
}

export function apiReportChallengeProgress(challengeId: string): Promise<{
  ok: boolean;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}> {
  return apiFetch(`/api/challenges/${challengeId}/progress`, { method: 'POST' });
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
  /** Valeur explicite : un retry ne doit jamais basculer une quête dans l'autre sens. */
  done?: boolean;
}

export interface CompleteQuestResult {
  ok: boolean;
  done: boolean;
  points?: number;
  newBadges?: string[];
  newRank?: any;
  correct?: string;
  code?: string;
}

export function apiCompleteQuest(questId: string, opts?: CompleteQuestOpts): Promise<CompleteQuestResult> {
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
