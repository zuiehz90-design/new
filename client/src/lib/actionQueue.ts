export interface QueuedAction<T = unknown> {
  id: string;
  scope: string;
  kind: string;
  payload: T;
  dedupeKey?: string;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
}

export interface FlushResult<T = unknown> {
  action: QueuedAction;
  ok: boolean;
  retrying?: boolean;
  result?: T;
  error?: unknown;
}

export type ActionHandler<T = any, R = any> = (
  payload: T,
  action: QueuedAction<T>,
) => Promise<R> | R;

interface EnqueueOptions {
  dedupeKey?: string;
}

const PREFIX = 'nour:sync-actions:';
const CHANGE_EVENT = 'nour:sync-change';
const RESULT_EVENT = 'nour:sync-result';
const MAX_ACTIONS = 100;
const MAX_ATTEMPTS = 8;
const BASE_RETRY_MS = 2_000;
const MAX_RETRY_MS = 5 * 60_000;

const handlers = new Map<string, Map<string, ActionHandler>>();
const inFlight = new Map<string, Promise<FlushResult[]>>();
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
let lifecycleStarted = false;

function browser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function storageKey(scope: string): string {
  return PREFIX + scope;
}

function read(scope: string): QueuedAction[] {
  if (!browser()) return [];
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is QueuedAction => Boolean(item && typeof item === 'object' && typeof (item as QueuedAction).id === 'string' && typeof (item as QueuedAction).kind === 'string'));
  } catch {
    return [];
  }
}

function write(scope: string, actions: QueuedAction[]): void {
  if (!browser()) return;
  try {
    if (actions.length === 0) localStorage.removeItem(storageKey(scope));
    else localStorage.setItem(storageKey(scope), JSON.stringify(actions.slice(-MAX_ACTIONS)));
  } catch {
    // A full localStorage must never block the visible UI.
  }
}

function emit(scope: string): void {
  if (!browser()) return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { scope, pending: read(scope).length } }));
}

function emitResult(scope: string, result: FlushResult): void {
  if (!browser()) return;
  window.dispatchEvent(new CustomEvent(RESULT_EVENT, { detail: { scope, ...result } }));
}

function retryable(error: unknown): boolean {
  const value = error as { retryable?: boolean; status?: number } | null;
  if (value?.retryable === false) return false;
  const status = value?.status;
  if (typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 409 && status !== 429) return false;
  return true;
}

function retryDelay(attempts: number): number {
  const exponential = Math.min(MAX_RETRY_MS, BASE_RETRY_MS * 2 ** Math.max(0, attempts - 1));
  return Math.round(exponential * (0.8 + Math.random() * 0.4));
}

function scheduleRetry(scope: string, delay: number): void {
  if (retryTimers.has(scope)) return;
  retryTimers.set(scope, setTimeout(() => {
    retryTimers.delete(scope);
    void flushActionQueue(scope);
  }, delay));
}

export function registerActionHandlers(scope: string, next: Record<string, ActionHandler<any, any>>): () => void {
  const scoped = handlers.get(scope) ?? new Map<string, ActionHandler>();
  for (const [kind, handler] of Object.entries(next)) scoped.set(kind, handler);
  handlers.set(scope, scoped);
  void flushActionQueue(scope);
  return () => {
    const current = handlers.get(scope);
    if (!current) return;
    for (const kind of Object.keys(next)) {
      if (current.get(kind) === next[kind]) current.delete(kind);
    }
    if (current.size === 0) handlers.delete(scope);
  };
}

export function enqueueAction<T>(scope: string, kind: string, payload: T, options: EnqueueOptions = {}): QueuedAction<T> {
  const action: QueuedAction<T> = {
    id: makeId(),
    scope,
    kind,
    payload,
    ...(options.dedupeKey ? { dedupeKey: options.dedupeKey } : {}),
    createdAt: Date.now(),
    attempts: 0,
    nextAttemptAt: 0,
  };
  const actions = read(scope);
  const next = options.dedupeKey
    ? [...actions.filter((item) => !(item.kind === kind && item.dedupeKey === options.dedupeKey)), action]
    : [...actions, action];
  write(scope, next);
  emit(scope);
  queueMicrotask(() => { void flushActionQueue(scope); });
  return action;
}

export function pendingActionCount(scope: string): number {
  return read(scope).length;
}

export function pendingActions(scope: string): QueuedAction[] {
  return read(scope);
}

/** Remove une action déjà en attente quand une nouvelle intention a été confirmée. */
export function removeQueuedAction(scope: string, kind: string, dedupeKey?: string): void {
  const actions = read(scope);
  const next = actions.filter((action) => {
    if (action.kind !== kind) return true;
    if (dedupeKey == null) return false;
    return action.dedupeKey !== dedupeKey;
  });
  if (next.length === actions.length) return;
  write(scope, next);
  emit(scope);
}

export function subscribeActionQueue(listener: (event: { scope: string; pending: number }) => void): () => void {
  if (!browser()) return () => {};
  const onChange = (event: Event) => listener((event as CustomEvent<{ scope: string; pending: number }>).detail);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function subscribeActionResults(listener: (event: { scope: string } & FlushResult) => void): () => void {
  if (!browser()) return () => {};
  const onResult = (event: Event) => listener((event as CustomEvent<{ scope: string } & FlushResult>).detail);
  window.addEventListener(RESULT_EVENT, onResult);
  return () => window.removeEventListener(RESULT_EVENT, onResult);
}

export async function flushActionQueue(scope: string): Promise<FlushResult[]> {
  const existing = inFlight.get(scope);
  if (existing) return existing;
  const promise = flushInternal(scope).finally(() => inFlight.delete(scope));
  inFlight.set(scope, promise);
  return promise;
}

async function flushInternal(scope: string): Promise<FlushResult[]> {
  const scopedHandlers = handlers.get(scope);
  if (!scopedHandlers || scopedHandlers.size === 0) return [];
  const results: FlushResult[] = [];
  let actions = read(scope);
  const now = Date.now();

  for (const action of actions) {
    if (action.nextAttemptAt > now) {
      scheduleRetry(scope, action.nextAttemptAt - now);
      continue;
    }
    const handler = scopedHandlers.get(action.kind);
    if (!handler) continue;

    try {
      const result = await handler(action.payload, action);
      actions = actions.filter((item) => item.id !== action.id);
      write(scope, actions);
      const flushResult: FlushResult = { action, ok: true, result };
      results.push(flushResult);
      emit(scope);
      emitResult(scope, flushResult);
    } catch (error) {
      const nextAttempts = action.attempts + 1;
      if (!retryable(error) || nextAttempts >= MAX_ATTEMPTS) {
        actions = actions.filter((item) => item.id !== action.id);
        write(scope, actions);
        const flushResult: FlushResult = { action, ok: false, error };
        results.push(flushResult);
        emit(scope);
        emitResult(scope, flushResult);
        continue;
      }
      const delay = retryDelay(nextAttempts);
      const updated = { ...action, attempts: nextAttempts, nextAttemptAt: Date.now() + delay };
      actions = actions.map((item) => item.id === action.id ? updated : item);
      write(scope, actions);
      const flushResult: FlushResult = { action: updated, ok: false, retrying: true, error };
      results.push(flushResult);
      emit(scope);
      emitResult(scope, flushResult);
      scheduleRetry(scope, delay);
      break;
    }
  }
  return results;
}

function startLifecycle(): void {
  if (lifecycleStarted || !browser()) return;
  lifecycleStarted = true;
  window.addEventListener('online', () => {
    for (const scope of handlers.keys()) void flushActionQueue(scope);
  });
}

startLifecycle();
