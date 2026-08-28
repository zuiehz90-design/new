import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useDevotion } from '../hooks/useDevotion';
import { useNameAudio } from '../hooks/useNameAudio';
import { storageKey } from '../lib/storageScope';
import { NAMES_99, type Name99 } from '../lib/names99';
import { NameOfTheDay } from './NameOfTheDay';
import { NameQuranLinks } from './NameQuranLinks';
import {
  applyRating,
  dueNameIndexes,
  isDue as isDueSrs,
  isMastered as isMasteredSrs,
  masteredCount,
  nextReviewLabel,
  seenCount,
  type NamesSrsStore,
  type ReviewRating,
} from '../lib/spacedRepetition';

const LEGACY_READ_KEY = 'nour:names-read';
const LEGACY_MIGRATED_KEY = 'nour:names-srs-migrated';

function daySeed(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

/** Charge l'état SRS du compte courant, en migrant l'ancien marqueur « lu ». */
function loadStore(scope: string): NamesSrsStore {
  const key = storageKey(scope, 'namesSrs');
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as NamesSrsStore;
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch { /* store corrompu → repartir de zéro */ }

  const store: NamesSrsStore = {};
  try {
    if (!localStorage.getItem(LEGACY_MIGRATED_KEY)) {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_READ_KEY) || '[]') as number[];
      if (Array.isArray(legacy)) {
        for (const idx of legacy) {
          if (typeof idx === 'number' && idx >= 0 && idx < NAMES_99.length) {
            // Les noms déjà « connus » entrent dans la file au palier 1, à revoir dès aujourd'hui.
            store[idx] = { level: 1, dueAt: Date.now(), reviews: 1, lapses: 0 };
          }
        }
      }
      localStorage.setItem(LEGACY_MIGRATED_KEY, '1');
    }
  } catch { /* migration ignorée */ }
  return store;
}

function saveStore(scope: string, store: NamesSrsStore): void {
  try {
    localStorage.setItem(storageKey(scope, 'namesSrs'), JSON.stringify(store));
  } catch { /* quota : silencieux */ }
}

export function NamesView() {
  const { t } = useI18n();
  const { scope } = useAuth();
  const { challenges, reportChallengeProgress } = useDevotion();
  const audio = useNameAudio();
  const [view, setView] = useState<'grid' | 'card'>('grid');
  const [store, setStore] = useState<NamesSrsStore>(() => loadStore(scope));
  const [queueIdx, setQueueIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  // Mode libre : quand la file est vide, l'utilisateur peut tirer un nom au hasard.
  const [freeMode, setFreeMode] = useState(false);
  const [freeIdx, setFreeIdx] = useState<number | null>(null);

  useEffect(() => {
    setStore(loadStore(scope));
    setQueueIdx(0);
    setFlipped(false);
    setFeedback(null);
    setFreeMode(false);
    setFreeIdx(null);
  }, [scope]);

  const persist = useCallback((next: NamesSrsStore) => {
    setStore(next);
    saveStore(scope, next);
  }, [scope]);

  const due = useMemo(() => dueNameIndexes(store, NAMES_99.length), [store]);
  const mastered = useMemo(() => masteredCount(store, NAMES_99.length), [store]);
  const seen = useMemo(() => seenCount(store, NAMES_99.length), [store]);

  // Nom affiché dans la carte : soit le prochain dû, soit un nom libre.
  const activeIdx: number | null = freeMode
    ? freeIdx
    : (due.length > 0 && queueIdx < due.length ? due[queueIdx] : null);
  const active: Name99 | null = activeIdx === null ? null : NAMES_99[activeIdx];

  const rate = useCallback((rating: ReviewRating) => {
    if (activeIdx === null) return;
    const updated = applyRating(store[activeIdx], rating);
    const nextStore = { ...store, [activeIdx]: updated };
    persist(nextStore);
    setFlipped(false);
    setFeedback(nextReviewLabel(updated.level));
    if (freeMode) {
      setFreeIdx((daySeed() + Math.floor(Math.random() * NAMES_99.length)) % NAMES_99.length);
    }
    // NOTE : le nom noté quitte toujours la file des noms dus (sa prochaine
    // révision est repoussée), donc `due` se réindexe : on ne doit PAS
    // incrémenter `queueIdx`, sinon on sauterait un nom à chaque notation.
    // Défi hebdomadaire « Apprends N noms » : chaque notation compte.
    // Fire-and-forget : la page reste prioritaire, la barre se met à jour en fond.
    const namesChallenge = challenges?.challenges.find((c) => c.type === 'names' && !c.claimed);
    if (namesChallenge) void reportChallengeProgress(namesChallenge.challenge_id);
  }, [activeIdx, store, freeMode, persist, challenges, reportChallengeProgress]);

  const startFree = useCallback(() => {
    setFreeMode(true);
    setFreeIdx((daySeed() + Math.floor(Math.random() * NAMES_99.length)) % NAMES_99.length);
    setFlipped(false);
    setFeedback(null);
  }, []);

  const reset = useCallback(() => {
    persist({});
    setQueueIdx(0);
    setFlipped(false);
    setFeedback(null);
    setFreeMode(false);
    setFreeIdx(null);
  }, [persist]);

  const remainingDue = freeMode ? 0 : Math.max(0, due.length - queueIdx);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 animate-fade-in">
      {/* Nom du jour — mis en avant chaque jour en haut de l'onglet 99 Noms */}
      <NameOfTheDay showLink={false} />
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-gold-400">{t('names99.title')}</h2>
        <p className="mt-1 text-xs text-stone-400">{t('names99.subtitle')}</p>

        {/* Suivi SRS */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="card p-2">
            <p className="text-base font-bold text-amber-300">{remainingDue}</p>
            <p className="text-[10px] text-stone-400">{t('names99.reviewDue')}</p>
          </div>
          <div className="card p-2">
            <p className="text-base font-bold text-gold-400">{seen}/{NAMES_99.length}</p>
            <p className="text-[10px] text-stone-400">{t('names99.learning')}</p>
          </div>
          <div className="card p-2">
            <p className="text-base font-bold text-emerald-400">{mastered}</p>
            <p className="text-[10px] text-stone-400">{t('names99.mastered')}</p>
          </div>
        </div>

        <div className="mt-3 flex justify-center gap-1">
          <button onClick={() => setView('grid')} className={`chip text-xs ${view === 'grid' ? '!border-gold-500/70 !text-gold-300' : ''}`}>📋 {t('names99.allNames')}</button>
          <button onClick={() => { setView('card'); setFlipped(false); setFeedback(null); }} className={`chip text-xs ${view === 'card' ? '!border-gold-500/70 !text-gold-300' : ''}`}>🃏 {t('names99.review')}</button>
        </div>
      </div>

      {view === 'card' ? (
        active ? (
          <div className="space-y-4">
            <button onClick={() => setFlipped(!flipped)}
              className="card w-full min-h-[200px] p-6 text-center transition-all cursor-pointer border-gold-500/30 hover:border-gold-500/60"
              style={{ perspective: '600px' }}>
              {!flipped ? (
                <>
                  <p className="font-quran text-5xl text-gold-300" dir="rtl">{active.arabic}</p>
                  <p className="mt-2 text-sm text-stone-300">{active.transliteration}</p>
                  <p className="mt-3 text-[10px] text-stone-500">{t('names99.flip')}</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-gold-400">{active.translation}</p>
                  <p className="mt-2 text-sm text-stone-300">{active.description}</p>
                </>
              )}
            </button>

            {/* Prononciation : lecture + répétition en boucle */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => audio.play(active.audio)}
                className={`chip text-xs py-2 ${audio.playing ? '!border-gold-500/70 !text-gold-300' : ''}`}
                title={t('names99.audioPlay')}
              >
                {audio.playing ? '⏹' : '🔊'} {t('names99.audioPlay')}
              </button>
              <button
                onClick={audio.toggleLoop}
                className={`chip text-xs py-2 ${audio.looping ? '!border-gold-500/70 !text-gold-300' : ''}`}
                title={t('names99.audioLoop')}
              >
                🔁 {t('names99.audioLoop')}
              </button>
            </div>

            {/* Versets liés dans le Coran */}
            <NameQuranLinks nameIndex={activeIdx as number} arabicName={active.arabic} />

            {flipped ? (
              <>
                {/* Notation : le cœur de la répétition espacée */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => rate('again')} className="chip !border-red-500/50 !text-red-300 text-xs py-2">😅 {t('names99.rateAgain')}</button>
                  <button onClick={() => rate('good')} className="chip !border-emerald-500/50 !text-emerald-300 text-xs py-2">✅ {t('names99.rateGood')}</button>
                  <button onClick={() => rate('easy')} className="chip !border-gold-500/50 !text-gold-300 text-xs py-2">🚀 {t('names99.rateEasy')}</button>
                </div>
                {feedback && (
                  <p className="text-center text-xs text-gold-300 animate-fade-in">
                    {t('names99.reviewIn')} <strong>{feedback}</strong>
                  </p>
                )}
              </>
            ) : (
              <div className="flex justify-center gap-2">
                <button onClick={() => setFlipped(true)} className="btn-gold text-xs">{t('names99.flip')} 🔄</button>
                <button onClick={() => { setFlipped(true); }} className="chip text-xs">👁 {t('names99.meaning')}</button>
              </div>
            )}
          </div>
        ) : (
          /* File terminée : état de réussite + mode libre */
          <div className="card p-8 text-center border-gold-500/30">
            <p className="text-4xl">🎉</p>
            <h3 className="mt-3 text-lg font-bold text-gold-300">{t('names99.reviewDone')}</h3>
            <p className="mt-2 text-xs text-stone-400">{t('names99.reviewDoneHint')}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={startFree} className="btn-ghost text-xs">{t('names99.practice')} 🎲</button>
              <button onClick={reset} className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-300">{t('names99.reset')}</button>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {NAMES_99.map((n, i) => {
            const s = store[i];
            const isMastered = isMasteredSrs(s);
            const isDue = isDueSrs(s);
            const isLearning = s && s.reviews > 0 && !isMastered;
            return (
              <div key={i} className={`card p-3 text-center transition-all relative ${isMastered ? 'border-emerald-500/40 bg-emerald-500/5' : isDue ? 'border-amber-500/40' : 'hover:border-gold-500/50'}`}>
                <button onClick={() => audio.play(n.audio)}
                  className="absolute right-1.5 top-1.5 text-sm opacity-60 hover:opacity-100 transition-opacity"
                  title={t('names99.audioPlay')}>
                  🔊
                </button>
                <button onClick={() => { setView('card'); setQueueIdx(0); setFlipped(false); setFeedback(null); setFreeMode(false); }}
                  className="block w-full">
                  <p className="font-quran text-2xl text-gold-300" dir="rtl">{n.arabic}</p>
                  <p className="mt-1 text-[11px] text-stone-300">{n.transliteration}</p>
                  <p className="text-[10px] text-stone-500">{n.translation}</p>
                  <span className="text-[10px]">
                    {isMastered && <span className="text-emerald-400">✓ {t('names99.mastered')}</span>}
                    {isLearning && !isMastered && <span className="text-amber-400">🔁 {nextReviewLabel(s.level)}</span>}
                    {isDue && !isLearning && <span className="text-amber-300">• {t('names99.reviewDue')}</span>}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
