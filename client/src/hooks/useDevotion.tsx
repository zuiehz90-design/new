import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  apiCheckPrayer,
  apiCompleteQuest,
  apiGetAchievements,
  apiPrayers,
  apiQuests,
  apiUncheckPrayer,
  type PrayerStatus,
  type QuestsData,
} from '../lib/api';
import { notifyEvent } from '../lib/notifications';

const TIER_NAMES: Record<string, string> = { bronze: 'Bronze', silver: 'Argent', gold: 'Or' };
const TIER_ICONS: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };
const FAMILY_NAMES: Record<string, string> = { salat: 'Salat', five: 'Les 5 piliers', streak: 'Série', quests: 'Quêtes', rank: 'Rangs' };

/** Nom affiché d'un badge de la forme « famille_niveau » (ex. streak_silver → Série — Argent). */
function describeBadge(id: string): { name: string; icon: string } {
  const idx = id.lastIndexOf('_');
  if (idx === -1) return { name: id, icon: '🎉' };
  const family = id.slice(0, idx);
  const level = id.slice(idx + 1);
  return {
    name: (FAMILY_NAMES[family] ?? family) + ' — ' + (TIER_NAMES[level] ?? level),
    icon: TIER_ICONS[level] ?? '🎉',
  };
}

export interface RankInfo {
  id: string;
  tier: string;
  division: number | null;
  name: string;
  min: number;
  icon: string;
  color: string;
}

export interface RankProgress {
  current: number;
  next: number | null;
  pct: number;
  pointsInto: number;
  pointsNeeded: number;
  maxed: boolean;
}

export interface Achievements {
  rank: RankInfo;
  ranks: RankInfo[];
  rankProgress: RankProgress;
  badges: string[];
  families: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    current: number;
    tiers: Array<{ level: 'bronze' | 'silver' | 'gold'; threshold: number; earned: boolean }>;
  }>;
  nextRank: string;
  nextRankPoints: number | null;
}

export interface DevotionStore {
  prayers: PrayerStatus | null;
  quests: QuestsData | null;
  achievements: Achievements | null;
  togglePrayer: (prayer: string, opts?: { late?: boolean; lateMinutes?: number }) => Promise<void>;
  toggleQuest: (questId: string, opts?: { answer?: number }) => Promise<Record<string, unknown> | null>;
}

const DevotionContext = createContext<DevotionStore | null>(null);

export function DevotionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const [prayers, setPrayers] = useState<PrayerStatus | null>(null);
  const [quests, setQuests] = useState<QuestsData | null>(null);
  const [achievements, setAchievements] = useState<Achievements | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setPrayers(null);
      setQuests(null);
      setAchievements(null);
      return;
    }
    const [p, q, a] = await Promise.allSettled([apiPrayers(), apiQuests(), apiGetAchievements<Achievements>()]);
    if (p.status === 'fulfilled') setPrayers(p.value);
    if (q.status === 'fulfilled') setQuests(q.value);
    if (a.status === 'fulfilled' && a.value) setAchievements(a.value);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  /** Toasts rang/badges renvoyés par le serveur après une action. */
  const applyServerMeta = useCallback((result: { newBadges?: string[]; newRank?: RankInfo } | null | undefined) => {
    if (!result) return;
    if (result.newRank) {
      showToast(result.newRank.icon, result.newRank.name, 'Rang augmenté !', 'bg-gold-500');
      notifyEvent({ type: 'rank', title: `${result.newRank.icon} ${result.newRank.name}`, body: 'Tu viens de monter de rang !', clickUrl: '/quests' });
    }
    for (const badge of result.newBadges ?? []) {
      const info = describeBadge(badge);
      showToast(info.icon, info.name, 'Badge débloqué !', 'bg-amber-400');
      notifyEvent({ type: 'badge', title: `${info.icon} ${info.name}`, body: 'Nouveau badge débloqué !', clickUrl: '/quests' });
    }
  }, [showToast]);

  const togglePrayer = useCallback(async (prayer: string, opts?: { late?: boolean; lateMinutes?: number }) => {
    if (!user || !prayers) return;
    const wasChecked = prayers.checked.includes(prayer);
    const previous = prayers;
    const nextChecked = wasChecked ? prayers.checked.filter((value) => value !== prayer) : [...prayers.checked, prayer];
    setPrayers({ ...prayers, checked: nextChecked, total: nextChecked.length });
    try { navigator.vibrate?.(12); } catch { /* haptique non disponible */ }
    try {
      const res = wasChecked ? await apiUncheckPrayer(prayer) : await apiCheckPrayer(prayer, opts);
      applyServerMeta(res);
      if (!wasChecked && !res.newRank && !(res.newBadges && res.newBadges.length > 0)) {
        const penalty = res.penalty ?? 0;
        if (opts?.late && penalty < 0) showToast('⏰', 'Prière en retard', `${penalty} pts`, 'bg-amber-500');
        else showToast('✅', 'Salat check-in', '+10 pts', 'bg-emerald-500');
      }
      await load();
    } catch {
      setPrayers(previous);
    }
  }, [user, prayers, applyServerMeta, load, showToast]);

  const toggleQuest = useCallback(async (questId: string, opts?: { answer?: number }) => {
    if (!user || !quests) return null;
    const current = quests.quests.find((quest) => quest.quest_id === questId);
    if (!current || current.done === 1) return { ok: true, done: true };
    const previous = quests;
    setQuests({ ...quests, quests: quests.quests.map((quest) => quest.quest_id === questId ? { ...quest, done: 1 } : quest) });
    try {
      const res = await apiCompleteQuest(questId, opts);
      if (!res.ok) {
        setQuests(previous);
        return res as unknown as Record<string, unknown>;
      }
      applyServerMeta(res);
      if (!res.newRank) showToast('⚔️', 'Quête complétée', '+' + (res.points ?? current.points) + ' pts', 'bg-gold-500');
      await load();
      return res as unknown as Record<string, unknown>;
    } catch {
      setQuests(previous);
      return null;
    }
  }, [user, quests, applyServerMeta, load, showToast]);

  const value = useMemo<DevotionStore>(() => ({
    prayers,
    quests,
    achievements,
    togglePrayer,
    toggleQuest,
  }), [prayers, quests, achievements, togglePrayer, toggleQuest]);

  return <DevotionContext.Provider value={value}>{children}</DevotionContext.Provider>;
}

export function useDevotion(): DevotionStore {
  const context = useContext(DevotionContext);
  if (!context) throw new Error('useDevotion doit être utilisé dans DevotionProvider');
  return context;
}
