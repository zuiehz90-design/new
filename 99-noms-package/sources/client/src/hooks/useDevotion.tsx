import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  apiChallenges,
  apiCheckPrayer,
  apiClaimChallenge,
  apiCompleteQuest,
  apiGetAchievements,
  apiPrayers,
  apiQuests,
  apiReportChallengeProgress,
  apiUncheckPrayer,
  type ApiFetchOptions,
  type ChallengesData,
  type PrayerStatus,
  type Quest,
  type QuestsData,
} from '../lib/api';
import {
  enqueueAction,
  flushActionQueue,
  pendingActionCount,
  registerActionHandlers,
  subscribeActionQueue,
  subscribeActionResults,
  type QueuedAction,
} from '../lib/actionQueue';
import { notifyEvent } from '../lib/notifications';

const TIER_NAMES: Record<string, string> = { bronze: 'Bronze', silver: 'Argent', gold: 'Or' };
const TIER_ICONS: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };
const FAMILY_NAMES: Record<string, string> = {
  salat: 'Salat',
  five: 'Les 5 piliers',
  streak: 'Série',
  quests: 'Quêtes',
  rank: 'Rangs',
  stories: 'Connaisseur historique',
  quran: 'Coran',
  dhikr: 'Dhikr',
  quiz: 'Quiz parfaits',
};

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

export type DevotionSyncState = 'idle' | 'refreshing' | 'pending' | 'offline' | 'error';

export interface DevotionStore {
  prayers: PrayerStatus | null;
  quests: QuestsData | null;
  achievements: Achievements | null;
  challenges: ChallengesData | null;
  busy: boolean;
  syncState: DevotionSyncState;
  lastSyncAt: number | null;
  pendingCount: number;
  refresh: (options?: { force?: boolean; silent?: boolean }) => Promise<void>;
  reload: () => Promise<void>;
  togglePrayer: (prayer: string, opts?: { late?: boolean; lateMinutes?: number }) => Promise<void>;
  toggleQuest: (questId: string, opts?: { answer?: number }) => Promise<Record<string, unknown> | null>;
  claimChallenge: (challengeId: string) => Promise<Record<string, unknown> | null>;
  reportChallengeProgress: (challengeId: string) => Promise<void>;
}

const DevotionContext = createContext<DevotionStore | null>(null);

function isRetryable(error: unknown): boolean {
  const value = error as { status?: number; retryable?: boolean } | null;
  if (value?.retryable === false) return false;
  return !(typeof value?.status === 'number' && value.status >= 400 && value.status < 500 && value.status !== 408 && value.status !== 409 && value.status !== 429);
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine;
}

export function DevotionProvider({ children }: { children: ReactNode }) {
  const { user, scope } = useAuth();
  const { show: showToast } = useToast();
  const [prayers, setPrayers] = useState<PrayerStatus | null>(null);
  const [quests, setQuests] = useState<QuestsData | null>(null);
  const [achievements, setAchievements] = useState<Achievements | null>(null);
  const [challenges, setChallenges] = useState<ChallengesData | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncState, setSyncState] = useState<DevotionSyncState>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const generationRef = useRef(0);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const latestRef = useRef({ prayers, quests, achievements, challenges });
  const scopeRef = useRef(scope);

  useEffect(() => { latestRef.current = { prayers, quests, achievements, challenges }; }, [prayers, quests, achievements, challenges]);
  useEffect(() => { scopeRef.current = scope; }, [scope]);

  const updatePending = useCallback(() => {
    setPendingCount(pendingActionCount(scopeRef.current));
  }, []);

  const refresh = useCallback(async (options: { force?: boolean; silent?: boolean } = {}): Promise<void> => {
    if (!user) {
      setPrayers(null);
      setQuests(null);
      setAchievements(null);
      setChallenges(null);
      setPendingCount(0);
      setSyncState('idle');
      return;
    }
    // Une requête forcée doit toujours repasser par le réseau : si un refresh
    // silencieux est en cours, on enchaîne le fetch forcé une fois celui-ci terminé.
    if (refreshInFlight.current) {
      if (options.force) {
        return refreshInFlight.current.then(() => refresh(options));
      }
      return refreshInFlight.current;
    }
    const generation = ++generationRef.current;
    const wasOffline = !isOnline();
    if (!options.silent) setBusy(true);
    if (!wasOffline) setSyncState(options.silent ? 'pending' : 'refreshing');

    const fetchOptions: ApiFetchOptions = {
      force: options.force,
      staleIfError: true,
      revalidate: false,
    };
    const promise = (async () => {
      const results = await Promise.allSettled([
        apiPrayers(fetchOptions),
        apiQuests(fetchOptions),
        apiGetAchievements<Achievements>(fetchOptions),
        apiChallenges(fetchOptions),
      ]);
      if (generation !== generationRef.current) return;
      let succeeded = false;
      const prayerResult = results[0];
      const questResult = results[1];
      const achievementResult = results[2];
      const challengeResult = results[3];
      if (prayerResult.status === 'fulfilled') { setPrayers(prayerResult.value); succeeded = true; }
      if (questResult.status === 'fulfilled') { setQuests(questResult.value); succeeded = true; }
      if (achievementResult.status === 'fulfilled' && achievementResult.value) { setAchievements(achievementResult.value); succeeded = true; }
      if (challengeResult.status === 'fulfilled' && challengeResult.value) { setChallenges(challengeResult.value); succeeded = true; }
      if (succeeded) setLastSyncAt(Date.now());
      setSyncState(succeeded ? (pendingActionCount(scope) > 0 ? 'pending' : 'idle') : (wasOffline ? 'offline' : 'error'));
      updatePending();
    })().catch(() => {
      if (generation === generationRef.current) setSyncState(wasOffline ? 'offline' : 'error');
    }).finally(() => {
      if (!options.silent) setBusy(false);
      refreshInFlight.current = null;
    });
    refreshInFlight.current = promise;
    return promise;
  }, [user, scope, updatePending]);

  const applyServerMeta = useCallback((result: { newBadges?: string[]; newRank?: RankInfo } | null) => {
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

  const handleQueuedFailure = useCallback((event: { scope: string; action: QueuedAction; ok: boolean; retrying?: boolean; error?: unknown }) => {
    if (event.scope !== scope || event.ok || event.retrying) return;
    const payload = event.action.payload as { previous?: { prayers?: PrayerStatus | null; quests?: QuestsData | null } };
    if (payload.previous?.prayers != null) setPrayers(payload.previous.prayers);
    if (payload.previous?.quests != null) setQuests(payload.previous.quests);
    setSyncState('error');
    showToast('⚠️', 'Synchronisation impossible', 'Ton action a été annulée. Réessaie quand la connexion revient.', 'bg-red-500');
  }, [scope, showToast]);

  useEffect(() => {
    if (!user) {
      setPrayers(null);
      setQuests(null);
      setAchievements(null);
      setChallenges(null);
      setPendingCount(0);
      return;
    }
    void refresh({ force: true });
  }, [user?.id, scope, refresh]);

  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh({ force: true, silent: true });
    }, 15_000);
    const onFocus = () => { if (document.visibilityState === 'visible') void refresh({ force: true, silent: true }); };
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh({ force: true, silent: true }); };
    const onOnline = () => { setSyncState('pending'); void flushActionQueue(scope).then(() => refresh({ force: true, silent: true })); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, [user, scope, refresh]);

  useEffect(() => {
    if (!user) return;
    const onQueue = ({ scope: eventScope, pending }: { scope: string; pending: number }) => {
      if (eventScope !== scope) return;
      setPendingCount(pending);
      setSyncState(pending > 0 ? 'pending' : 'idle');
    };
    const unsubscribeQueue = subscribeActionQueue(onQueue);
    const unsubscribeResults = subscribeActionResults((event) => {
      if (event.scope !== scope) return;
      if (!event.ok) {
        handleQueuedFailure(event);
        return;
      }
      applyServerMeta((event.result ?? null) as { newBadges?: string[]; newRank?: RankInfo } | null);
      void refresh({ force: true, silent: true });
    });
    updatePending();
    return () => { unsubscribeQueue(); unsubscribeResults(); };
  }, [user, scope, handleQueuedFailure, applyServerMeta, refresh, updatePending]);

  const registerHandlers = useCallback(() => {
    if (!user) return () => {};
    return registerActionHandlers(scope, {
      prayer: async (payload: { prayer: string; checked: boolean; late?: boolean; lateMinutes?: number; mutationId: string }) => {
        if (payload.checked) {
          return apiCheckPrayer(payload.prayer, {
            late: payload.late,
            lateMinutes: payload.lateMinutes,
            mutationId: payload.mutationId,
          });
        }
        return apiUncheckPrayer(payload.prayer, payload.mutationId);
      },
      quest: async (payload: { questId: string; answer?: number; mutationId: string }) => {
        const result = await apiCompleteQuest(payload.questId, { answer: payload.answer, done: true, mutationId: payload.mutationId });
        if (!result.ok) {
          const error = Object.assign(new Error(result.code ?? 'Action refusée par le serveur.'), {
            retryable: false,
            result,
          });
          throw error;
        }
        return result;
      },
    });
  }, [user, scope]);

  useEffect(() => registerHandlers(), [registerHandlers]);

  const togglePrayer = useCallback(async (prayer: string, opts?: { late?: boolean; lateMinutes?: number }) => {
    if (!user || !prayers || !quests) return;
    const wasChecked = prayers.checked.includes(prayer);
    const previousPrayers = prayers;
    const previousQuests = quests;
    const nextChecked = wasChecked ? prayers.checked.filter((value) => value !== prayer) : [...prayers.checked, prayer];
    const delta = wasChecked ? -10 : 10;
    setPrayers({ ...prayers, checked: nextChecked, total: nextChecked.length });
    setQuests({ ...quests, score: quests.score + delta, lifetime: quests.lifetime + delta });
    try { navigator.vibrate?.(12); } catch { /* unsupported */ }
    const mutationId = `${scope}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const payload = { prayer, checked: !wasChecked, late: opts?.late, lateMinutes: opts?.lateMinutes, mutationId, previous: { prayers: previousPrayers, quests: previousQuests } };
    try {
      const result = wasChecked ? await apiUncheckPrayer(prayer, mutationId) : await apiCheckPrayer(prayer, { ...opts, mutationId });
      applyServerMeta('newBadges' in result || 'newRank' in result ? result as { newBadges?: string[]; newRank?: RankInfo } : null);
      setSyncState('idle');
      updatePending();
      void refresh({ force: true, silent: true });
    } catch (error) {
      if (!isRetryable(error)) {
        setPrayers(previousPrayers);
        setQuests(previousQuests);
        setSyncState('error');
        throw error;
      }
      enqueueAction(scope, 'prayer', payload, { dedupeKey: `prayer:${prayer}` });
      setPendingCount(pendingActionCount(scope));
      setSyncState(isOnline() ? 'pending' : 'offline');
    }
  }, [user, prayers, quests, scope, applyServerMeta, updatePending, refresh]);

  const claimChallenge = useCallback(async (challengeId: string): Promise<Record<string, unknown> | null> => {
    if (!user) return null;
    try {
      const result = await apiClaimChallenge(challengeId);
      if (!result.ok) return result as unknown as Record<string, unknown>;
      applyServerMeta(result);
      setSyncState('idle');
      updatePending();
      void refresh({ force: true, silent: true });
      showToast('⚔️', 'Défi relevé !', '+' + (result.points ?? 0) + ' pts', 'bg-gold-500');
      return result as unknown as Record<string, unknown>;
    } catch {
      showToast('⚠️', 'Récompense indisponible', 'Vérifie ta connexion puis réessaie.', 'bg-red-500');
      return null;
    }
  }, [user, applyServerMeta, updatePending, refresh, showToast]);

  const reportChallengeProgress = useCallback(async (challengeId: string) => {
    if (!user) return;
    // Mise à jour optimiste : la barre bouge immédiatement, le serveur confirme ensuite.
    setChallenges((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        challenges: prev.challenges.map((c) =>
          c.challenge_id === challengeId && !c.claimed
            ? { ...c, progress: Math.min(c.progress + 1, c.target), completed: c.progress + 1 >= c.target }
            : c
        ),
      };
    });
    try {
      await apiReportChallengeProgress(challengeId);
    } catch {
      /* hors ligne ou défi absent : la barre sera resynchronisée au prochain refresh */
    }
  }, [user]);

  const toggleQuest = useCallback(async (questId: string, opts?: { answer?: number }) => {
    if (!user || !quests) return null;
    const current = quests.quests.find((quest) => quest.quest_id === questId);
    if (!current || current.done === 1) return { ok: true, done: true };
    const previous = quests;
    const nextQuests: Quest[] = quests.quests.map((quest) => quest.quest_id === questId ? { ...quest, done: 1 } : quest);
    const nextCompleted = quests.completed + 1;
    const nextScore = quests.score + current.points;
    const nextLifetime = quests.lifetime + current.points;
    setQuests({ ...quests, quests: nextQuests, completed: nextCompleted, score: nextScore, lifetime: nextLifetime });
    const mutationId = `${scope}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const payload = { questId, answer: opts?.answer, mutationId, previous };
    try {
      const result = await apiCompleteQuest(questId, { ...opts, done: true, mutationId });
      if (!result.ok) {
        setQuests(previous);
        return result as unknown as Record<string, unknown>;
      }
      applyServerMeta(result);
      setSyncState('idle');
      updatePending();
      void refresh({ force: true, silent: true });
      showToast('⚔️', 'Quête complétée', '+' + (result.points ?? current.points) + ' pts', 'bg-gold-500');
      return result as unknown as Record<string, unknown>;
    } catch (error) {
      if (!isRetryable(error)) {
        setQuests(previous);
        throw error;
      }
      enqueueAction(scope, 'quest', payload, { dedupeKey: `quest:${questId}` });
      setPendingCount(pendingActionCount(scope));
      setSyncState(isOnline() ? 'pending' : 'offline');
      showToast('⏳', 'Quête enregistrée localement', 'Les points seront confirmés dès la reconnexion.', 'bg-amber-500');
      return { ok: true, done: true, points: current.points, queued: true };
    }
  }, [user, quests, scope, applyServerMeta, updatePending, refresh, showToast]);

  const value = useMemo<DevotionStore>(() => ({
    prayers,
    quests,
    achievements,
    challenges,
    busy,
    syncState,
    lastSyncAt,
    pendingCount,
    refresh,
    reload: () => refresh({ force: true }),
    togglePrayer,
    toggleQuest,
    claimChallenge,
    reportChallengeProgress,
  }), [prayers, quests, achievements, challenges, busy, syncState, lastSyncAt, pendingCount, refresh, togglePrayer, toggleQuest, claimChallenge, reportChallengeProgress]);

  return <DevotionContext.Provider value={value}>{children}</DevotionContext.Provider>;
}

export function useDevotion(): DevotionStore {
  const context = useContext(DevotionContext);
  if (!context) throw new Error('useDevotion doit être utilisé dans DevotionProvider');
  return context;
}
