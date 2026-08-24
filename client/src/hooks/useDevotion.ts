import { useCallback, useEffect, useState } from 'react';
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

export function useDevotion() {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const [prayers, setPrayers] = useState<PrayerStatus | null>(null);
  const [quests, setQuests] = useState<QuestsData | null>(null);
  const [achievements, setAchievements] = useState<Achievements | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setPrayers(null);
      setQuests(null);
      setAchievements(null);
      return;
    }
    setBusy(true);
    try {
      // Les trois blocs sont indépendants : ne pas attendre prières/quêtes
      // avant de demander les badges et le rang.
      const achievementsRequest = apiGetAchievements<Achievements>();
      // Chaque bloc s'affiche dès qu'il est disponible ; les quêtes IA lentes
      // ne doivent pas retenir les prières et les badges déjà calculés.
      const prayerRequest = apiPrayers().then((value) => setPrayers(value)).catch(() => undefined);
      const questRequest = apiQuests().then((value) => setQuests(value)).catch(() => undefined);
      const achievementRequest = achievementsRequest.then((value) => {
        if (value) setAchievements(value);
      });
      await Promise.all([prayerRequest, questRequest, achievementRequest]);
    } finally {
      setBusy(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const togglePrayer = useCallback(async (prayer: string, opts?: { late?: boolean; lateMinutes?: number }) => {
    if (!user || !prayers) return;
    // Feedback haptique (Android/Chrome) : petite pulsation tactile au toucher
    try {
      navigator.vibrate?.(12);
    } catch { /* haptique non disponible */ }
    const checked = prayers.checked.includes(prayer);
    try {
      let res: any;
      if (checked) res = await apiUncheckPrayer(prayer);
      else res = await apiCheckPrayer(prayer, opts);
      await load();
      // Toast de promotion de rang (façon jeu vidéo)
      const newRank = res?.newRank as RankInfo | undefined;
      if (newRank) {
        showToast(newRank.icon, newRank.name, 'Rang augmenté !', 'bg-gold-500');
      }
      // Show toasts for new badges
      const newBadges: string[] = res?.newBadges ?? [];
      if (newBadges.length > 0) {
        newBadges.forEach(b => {
          const info = describeBadge(b);
          showToast(info.icon, info.name, 'Badge débloqué !', 'bg-amber-400');
        });
      } else if (!checked && !newRank) {
        const penalty = res?.penalty ?? 0;
        if (opts?.late && penalty < 0) {
          showToast('⏰', 'Prière en retard', `${penalty} pts`, 'bg-amber-500');
        } else {
          showToast('✅', 'Salat check-in', '+10 pts', 'bg-emerald-500');
        }
      }
    } catch { /* ignore */ }
  }, [user, prayers, load, showToast]);

  /** Complete une quete ; retourne la reponse du serveur (verification incluse). */
  const toggleQuest = useCallback(async (questId: string, opts?: { answer?: number }) => {
    if (!user) return null;
    try {
      const res = (await apiCompleteQuest(questId, opts)) as any;
      // Verification refusee (priere non cochee, quiz faux) : on laisse l'UI gerer
      if (res && res.ok === false) return res;
      await load();
      const newRank = res?.newRank as RankInfo | undefined;
      if (newRank) {
        showToast(newRank.icon, newRank.name, 'Rang augmenté !', 'bg-gold-500');
      }
      const newBadges: string[] = res?.newBadges ?? [];
      if (newBadges.length > 0) {
        newBadges.forEach(b => {
          const info = describeBadge(b);
          showToast(info.icon, info.name, 'Badge débloqué !', 'bg-amber-400');
        });
      } else if (!newRank) {
        showToast('⚔️', 'Quête complétée', '+' + (res?.points ?? '?') + ' pts', 'bg-gold-500');
      }
      return res;
    } catch { return null; }
  }, [user, load, showToast]);

  return { prayers, quests, achievements, busy, togglePrayer, toggleQuest, reload: load };
}
