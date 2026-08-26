import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { PROPHETS, getFeaturedProphet, type ProphetStory } from '../lib/prophets';
import { getProphetAudio } from '../lib/prophetsAudio';
import { PodcastPlayer } from './PodcastPlayer';
import { useDevotion } from '../hooks/useDevotion';
import { apiCompleteQuiz, apiQuizProgress, type ProphetProgressEntry, type QuizResult } from '../lib/api';

export function ProphetsView() {
  const { t } = useI18n();
  const { refresh } = useDevotion();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ProphetStory | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [quizReward, setQuizReward] = useState<QuizResult | null>(null);
  const [quizSending, setQuizSending] = useState(false);
  const [showPodcast, setShowPodcast] = useState(false);
  const [progress, setProgress] = useState<ProphetProgressEntry[]>([]);

  const refreshProgress = () => {
    apiQuizProgress().then(setProgress).catch(() => {});
  };

  useEffect(() => { refreshProgress(); }, []);

  const startQuiz = (p: ProphetStory) => {
    setSelected(p);
    setQuizActive(true);
    setQuizIdx(0);
    setQuizScore(0);
    setQuizAnswer(null);
    setQuizDone(false);
    setQuizReward(null);
  };

  const answerQuiz = (idx: number) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(idx);
    if (idx === selected!.quiz[quizIdx].correct) setQuizScore((s) => s + 1);
  };

  const nextQuestion = () => {
    if (quizIdx + 1 >= selected!.quiz.length) {
      setQuizDone(true);
      // Envoi au serveur : attribue les points (anti-farm, meilleur score)
      setQuizSending(true);
      apiCompleteQuiz(selected!.name, quizScore, selected!.quiz.length)
        .then((r) => { setQuizReward(r); refreshProgress(); void refresh(); })
        .catch(() => setQuizReward(null))
        .finally(() => setQuizSending(false));
    } else {
      setQuizIdx(quizIdx + 1);
      setQuizAnswer(null);
    }
  };

  if (selected) {
    const audio = getProphetAudio(selected.name);
    return (
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 animate-fade-in">
        <button
          onClick={() => { setSelected(null); setQuizActive(false); setShowPodcast(false); }}
          className="btn-ghost mb-4 text-xs"
        >
          ← {t('prophets.backToList')}
        </button>

        <div className="card mb-4 p-5 border-gold-500/40">
          <div className="font-quran text-3xl text-gold-300" dir="rtl">{selected.nameAr}</div>
          <h2 className="mt-1 text-xl font-bold text-gold-400">{selected.nameFr}</h2>
          <p className="text-xs text-stone-400">{selected.title}</p>
        </div>

        {/* Podcast audio (épisode réel) — toggle */}
        {audio && (
          showPodcast ? (
            <PodcastPlayer audio={audio} />
          ) : (
            <button
              onClick={() => setShowPodcast(true)}
              className="btn-gold mb-4 w-full text-xs"
            >
              🎙️ {t("prophets.listen")} : {audio.title}
            </button>
          )
        )}

        {/* Contexte historique */}
        <div className="card p-4 mb-4 !border-gold-500/20">
          <p className="text-[11px] font-bold text-gold-400/80 uppercase tracking-wide mb-1">{t('prophets.context')}</p>
          <p className="text-xs leading-relaxed text-stone-400 italic">{selected.context}</p>
        </div>

        {/* Histoire en chapitres */}
        <div className="card p-4 mb-4">
          <p className="text-[11px] font-bold text-gold-400/80 uppercase tracking-wide mb-2">{t('prophets.story')}</p>
          <div className="space-y-4">
            {(selected.chapters || []).map((ch, i) => (
              <div key={i} className="rounded-xl border border-gold-500/20 bg-stone-900/40 p-3">
                <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold text-gold-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500/15 text-[10px]">{i + 1}</span>
                  {ch.title}
                </p>
                <p className="text-sm leading-relaxed text-stone-200">{ch.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-stone-500 italic">📖 {selected.reference}</p>
        </div>

        {/* Versets liés — ouverture directe dans le Coran */}
        <div className="mb-4">
          <p className="text-[11px] font-bold text-gold-400/80 uppercase tracking-wide mb-2">{t('prophets.verses')}</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.verses.map((v) => {
              const ref = parseVerseRef(v);
              return (
                <button
                  key={v}
                  onClick={() => ref && navigate('/quran?surah=' + ref.surah + '&verse=' + ref.verse)}
                  className="chip !border-gold-500/40 !bg-gold-500/5 !text-gold-300 text-[11px] transition hover:!border-gold-400 hover:!bg-gold-500/15 active:opacity-70"
                  title={ref ? t('prophets.readInQuran') : undefined}
                >
                  📜 {v} {ref && <span className="ml-0.5 text-gold-400/80">→ {t('prophets.readInQuran')}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Leçons */}
        <div className="mb-4">
          <p className="text-[11px] font-bold text-gold-400/80 uppercase tracking-wide mb-2">{t('prophets.lessons')}</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.lessons.map((l) => (
              <span key={l} className="chip !border-emerald-500/50 !text-emerald-300 text-[11px]">✨ {l}</span>
            ))}
          </div>
        </div>

        {/* Leçon à appliquer aujourd'hui */}
        {selected.practice && (
          <div className="card mb-4 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-stone-900/40 p-4">
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide mb-2">🎯 {t('prophets.practice')}</p>
            <p className="text-sm leading-relaxed text-stone-200">{selected.practice}</p>
          </div>
        )}

        {/* Poser une question à l'IA sur ce prophète */}
        <button
          onClick={() => navigate('/chat?ask=' + encodeURIComponent(selected.nameFr))}
          className="btn-ghost mb-4 w-full border-gold-500/40 text-xs"
        >
          💬 {t('prophets.askAI')}
        </button>

        {quizActive ? (
          <div className="card p-4 border-gold-500/30">
            {quizDone ? (
              <div className="text-center">
                <p className="text-2xl mb-2">{quizScore}/{selected.quiz.length}</p>
                <p className="text-sm text-stone-300">
                  {quizScore === selected.quiz.length ? '🎉 Parfait !' : '📖 Continue à apprendre !'}
                </p>
                {quizSending && <p className="mt-2 text-xs text-stone-500">⏳ Attribution des points…</p>}
                {!quizSending && quizReward && quizReward.points > 0 && (
                  <p className="mt-2 inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    🏆 +{quizReward.points} points
                    {quizReward.best ? ' (nouveau record !)' : ''}
                  </p>
                )}
                {!quizSending && quizReward && quizReward.points === 0 && (
                  <p className="mt-2 text-xs text-stone-500">
                    {quizReward.first ? '' : 'Déjà récompensé — améliore ton score pour gagner plus de points.'}
                  </p>
                )}
                {!quizSending && quizReward && quizReward.newBadges && quizReward.newBadges.length > 0 && (
                  <p className="mt-2 text-xs text-gold-300">🏅 Badge débloqué !</p>
                )}
                {!quizSending && quizReward && quizReward.newRank && (
                  <p className="mt-2 text-xs text-gold-300">⬆️ Montée de rang : {quizReward.newRank.name}</p>
                )}
                <button onClick={() => { setQuizActive(false); setQuizDone(false); setQuizReward(null); }} className="btn-gold mt-3 text-xs">
                  {t('prophets.backToList')}
                </button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-xs text-gold-400">{t('prophets.quiz')} {quizIdx + 1}/{selected.quiz.length}</p>
                <p className="mb-3 text-sm font-semibold text-stone-100">{selected.quiz[quizIdx].question}</p>
                <div className="space-y-2">
                  {selected.quiz[quizIdx].options.map((opt, i) => {
                    let cls = 'chip w-full text-left cursor-pointer';
                    if (quizAnswer !== null) {
                      if (i === selected.quiz[quizIdx].correct) cls += ' !border-emerald-500 !bg-emerald-500/20 !text-emerald-300';
                      else if (i === quizAnswer) cls += ' !border-red-500 !bg-red-500/20 !text-red-300';
                    }
                    return <button key={i} className={cls} onClick={() => answerQuiz(i)}>{opt}</button>;
                  })}
                </div>
                {quizAnswer !== null && (
                  <button onClick={nextQuestion} className="btn-gold mt-3 w-full text-xs">
                    {quizIdx + 1 >= selected.quiz.length ? t('prophets.finish') : t('prophets.next')}
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <button onClick={() => startQuiz(selected)} className="btn-gold w-full text-xs">
            🧠 {t('prophets.quiz')}
          </button>
        )}
      </div>
    );
  }

  const progressFor = (name: string) => progress.find((pr) => pr.prophet === name);

  const completedCount = PROPHETS.filter((p) => progressFor(p.name)?.completed).length;
  const totalStories = PROPHETS.length;
  const globalPct = Math.round((completedCount / totalStories) * 100);
  const badgeTiers = [
    { label: '🥉 3', threshold: 3, color: 'text-amber-600' },
    { label: '🥈 6', threshold: 6, color: 'text-stone-400' },
    { label: '🥇 12', threshold: 12, color: 'text-gold-400' },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 animate-fade-in">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-gold-400">{t('prophets.title')}</h2>
        <p className="mt-1 text-xs text-stone-400">{t('prophets.subtitle')}</p>
      </div>

      {/* Défi : prophète de la semaine */}
      {(() => {
        const featured = getFeaturedProphet();
        const fpr = progressFor(featured.prophet.name);
        const fdone = fpr?.completed;
        return (
          <div className="card mb-4 overflow-hidden border-gold-500/50 bg-gradient-to-br from-gold-500/15 via-stone-900/60 to-emerald-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500/20 text-xl">📖</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold-300">{t('prophets.weeklyTitle')}</p>
                <p className="truncate text-sm font-bold text-stone-100">
                  <span className="font-quran text-base text-gold-300" dir="rtl">{featured.prophet.nameAr}</span>{' '}
                  {featured.prophet.nameFr}
                </p>
                <p className="text-[10px] text-stone-400">
                  {fdone ? '✅ ' + t('prophets.weeklyDone') : t('prophets.weeklyDaysLeft') + ' : ' + featured.daysLeft}
                </p>
              </div>
              <button onClick={() => setSelected(featured.prophet)}
                className={'btn-gold shrink-0 px-3 py-2 text-[11px] ' + (fdone ? '!bg-emerald-600/80' : '')}>
                {fdone ? t('prophets.weeklyReview') : t('prophets.weeklyRead')}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Progression globale : barre + badge Connaisseur historique */}
      <div className="card mb-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gold-400">📜 {t('prophets.progressTitle')}</p>
          <p className="text-xs font-semibold text-stone-300">{completedCount}/{totalStories}</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-800">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-gold-500 transition-all duration-500"
            style={{ width: globalPct + '%' }} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-stone-500">{t('prophets.badgeTitle')}</span>
          {badgeTiers.map((b) => (
            <span key={b.threshold} className={
              'chip text-[10px] ' + (completedCount >= b.threshold
                ? '!border-gold-500/60 !text-gold-300'
                : '!border-stone-700 !text-stone-500 opacity-60')
            }>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {PROPHETS.map((p) => {
          const pr = progressFor(p.name);
          const done = pr?.completed;
          const pct = done ? 100 : 0;
          return (
            <button key={p.name} onClick={() => setSelected(p)}
              className="card card-clickable w-full p-4 text-left transition hover:border-gold-500/50">
              <div className="flex items-center gap-3">
                <div className="font-quran text-2xl text-gold-300 shrink-0" dir="rtl">{p.nameAr}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-stone-100">{p.nameFr}</div>
                    {done && <span className="text-xs">✅</span>}
                  </div>
                  <div className="text-[11px] text-stone-400 truncate">{p.title}</div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
                    <div className={'h-full rounded-full transition-all duration-500 ' + (done ? 'bg-emerald-500' : 'bg-stone-700')}
                      style={{ width: pct + '%' }} />
                  </div>
                </div>
                <span className="text-xs text-stone-500">{done ? '✅' : '🧠'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


/** Parse « Coran 6:76-79 » → { surah: 6, verse: 76 } (premier verset de l'intervalle). */
function parseVerseRef(ref: string): { surah: number; verse: number } | null {
  const m = ref.match(/Coran\s+(\d{1,3}):(\d{1,3})(?:-\d{1,3})?/);
  if (!m) return null;
  const surah = Number(m[1]);
  const verse = Number(m[2]);
  if (surah < 1 || surah > 114 || verse < 1) return null;
  return { surah, verse };
}
