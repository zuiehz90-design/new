/**
 * Gestionnaire de notifications unifié pour Nour (desktop + web + mobile).
 * Chaque notification est :
 *   1. Loggée dans l'historique (centre de notifications, cloche 🔔)
 *   2. Affichée en toast in-app (via l'événement global `nour:toast`)
 *   3. Envoyée en notification native (Electron / navigateur / Capacitor)
 *   4. Optionnellement accompagnée d'un son doux
 *
 * Les préférences (types activés + son) sont stockées dans localStorage.
 */
import { notify as nativeNotify } from './desktop';

export type NotificationType =
  | 'prayer'
  | 'quest'
  | 'badge'
  | 'rank'
  | 'dailyVerse'
  | 'dhikr'
  | 'sleep'
  | 'streak'
  | 'story'
  | 'special';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  icon: string;
  title: string;
  body: string;
  clickUrl?: string;
  createdAt: number;
  read: boolean;
}

export interface NotificationPrefs {
  prayer: boolean;
  quest: boolean;
  badge: boolean;
  rank: boolean;
  dailyVerse: boolean;
  dhikr: boolean;
  sleep: boolean;
  streak: boolean;
  story: boolean;
  special: boolean;
  sound: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  prayer: true,
  quest: true,
  badge: true,
  rank: true,
  dailyVerse: true,
  dhikr: true,
  sleep: true,
  streak: true,
  story: true,
  special: true,
  sound: false,
};

const TYPE_ICONS: Record<NotificationType, string> = {
  prayer: '🕌',
  quest: '⚔️',
  badge: '🏅',
  rank: '🏆',
  dailyVerse: '📖',
  dhikr: '📿',
  sleep: '🌙',
  streak: '🔥',
  story: '📖',
  special: '🌙',
};

const HISTORY_KEY = 'nour:notification-history';
const PREFS_KEY = 'nour:notification-prefs';
const MAX_HISTORY = 50;

// ── Historique ──

type Listener = () => void;
const listeners = new Set<Listener>();

/** S'abonne aux changements d'historique (badge non-lus). Retourne un unsubscribe. */
export function subscribeNotifications(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function emit(): void {
  listeners.forEach((fn) => { try { fn(); } catch {} });
}

export function getHistory(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as NotificationItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items: NotificationItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch { /* stockage plein */ }
  emit();
}

export function unreadCount(): number {
  return getHistory().filter((n) => !n.read).length;
}

export function markAllRead(): void {
  saveHistory(getHistory().map((n) => ({ ...n, read: true })));
}

export function markRead(id: string): void {
  saveHistory(getHistory().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function clearHistory(): void {
  saveHistory([]);
}

export function removeNotification(id: string): void {
  saveHistory(getHistory().filter((n) => n.id !== id));
}

// ── Préférences ──

export function getPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_NOTIFICATION_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) } : DEFAULT_NOTIFICATION_PREFS;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function setPrefs(p: Partial<NotificationPrefs>): void {
  const next = { ...getPrefs(), ...p };
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch {}
  emit();
}

// ── Permission ──

export function permissionState(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function requestPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
}

// ── Son ──

let _audioCtx: AudioContext | null = null;

function playChime(): void {
  try {
    if (!getPrefs().sound) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    _audioCtx = _audioCtx ?? new AC();
    const ctx = _audioCtx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — accord doux
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  } catch { /* audio indisponible */ }
}

// ── API principale ──

export async function push(opts: {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  clickUrl?: string;
  /** true = historique + toast seulement, pas de notification native. */
  silent?: boolean;
}): Promise<void> {
  const prefs = getPrefs();
  if (!prefs[opts.type]) return; // type désactivé

  const item: NotificationItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: opts.type,
    icon: opts.icon ?? TYPE_ICONS[opts.type],
    title: opts.title,
    body: opts.body,
    clickUrl: opts.clickUrl,
    createdAt: Date.now(),
    read: false,
  };

  // 1. Historique (toujours)
  saveHistory([item, ...getHistory()]);

  // 2. Toast in-app (toujours, si le ToastProvider est monté)
  window.dispatchEvent(new CustomEvent('nour:toast', {
    detail: { icon: item.icon, title: item.title, subtitle: item.body, color: 'bg-gold-500' },
  }));

  // 3. Notification native + son (sauf si silencieux)
  if (!opts.silent) {
    try {
      await nativeNotify({ title: item.title, body: item.body, clickUrl: item.clickUrl });
    } catch { /* natif indisponible */ }
    playChime();
  }
}

/** Notification rapide pour un événement métier (badge, rang, streak). */
export function notifyEvent(opts: {
  type: NotificationType;
  title: string;
  body: string;
  clickUrl?: string;
}): void {
  void push(opts);
}
