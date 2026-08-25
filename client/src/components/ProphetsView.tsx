import { useState } from 'react';
import { useI18n } from '../i18n';
import { PROPHETS, type ProphetStory } from '../lib/prophets';
import { useNarration } from '../lib/useNarration';

export function ProphetsView() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<ProphetStory | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const narration = useNarration();

  const startQuiz = (p: ProphetStory) => {
    setSelected(p);
    setQuizActive(true);
    setQuizIdx(0);
    setQuizScore(0);
    setQuizAnswer(null);
    setQuizDone(false);
  };

  const answerQuiz = (idx: number) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(idx);
    if (idx === selected!.quiz[quizIdx].correct) setQuizScore((s) => s + 1);
  };

  const nextQuestion = () => {
    if (quizIdx + 1 >= selected!.quiz.length) {
      setQuizDone(true);
    } else {
      setQuizIdx(quizIdx + 1);
      setQuizAnswer(null);
    }
  };

  if (selected) {
    const paragraphs = selected.story.split('\n\n').filter(Boolean);
    const isActive = narration.playing || narration.paused;
    return (
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 animate-fade-in">
        <button
          onClick={() => { narration.stop(); setSelected(null); setQuizActive(false); }}
          className="btn-ghost mb-4 text-xs"
        >
          ← {t('prophets.backToList')}
        </button>

        <div className="card mb-4 p-5 border-gold-500/40">
          <div className="font-quran text-3xl text-gold-300" dir="rtl">{selected.nameAr}</div>
          <h2 className="mt-1 text-xl font-bold text-gold-400">{selected.nameFr}</h2>
          <p className="text-xs text-stone-400">{selected.title}</p>
        </div>

        {/* Barre de narration audio */}
        {narration.supported && (
          <div className="card mb-4 p-4 !border-emerald-500/40">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => (narration.playing && !narration.paused ? narration.pause() : narration.playing ? narration.resume() : narration.play(selected.story))}
                className="btn-gold flex-shrink-0 !px-4 !py-2 text-xs"
              >
                {narration.playing && !narration.paused ? '⏸' : narration.paused ? '▶' : '▶️'} {t('prophets.narrate')}
              </button>
              {isActive && (
                <button onClick={narration.stop} className="btn-ghost text-xs">
                  ⏹ {t('prophets.stop')}
                </button>
              )}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[10px] text-stone-500">{t('prophets.speed')}</span>
                {narration.rates.map((r) => (
                  <button
                    key={r}
                    onClick={() => narration.changeRate(r)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                      narration.rate === r
                        ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/60'
                        : 'bg-white/5 text-stone-400 hover:bg-white/10'
                    }`}
                  >
                    {r}×
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[10px] text-stone-500">
              {narration.playing && !narration.paused
                ? <span className="animate-pulse text-emerald-400">🔊 {t('prophets.playing')}</span>
                : narration.paused
                  ? <span className="text-gold-400">⏸ {t('prophets.resume')}</span>
                  : '🎧 ' + t('prophets.narrateHint')}
            </p>
          </div>
        )}

        {/* Contexte historique */}
        <div className="card p-4 mb-4 !border-gold-500/20">
          <p className="text-[11px] font-bold text-gold-400/80 uppercase tracking-wide mb-1">{t('prophets.context')}</p>
          <p className="text-xs leading-relaxed text-stone-400 italic">{selected.context}</p>
        </div>

        {/* Histoire */}
        <div className="card p-4 mb-4">
          <p className="text-[11px] font-bold text-gold-400/80 uppercase tracking-wide mb-2">{t('prophets.story')}</p>
          <div className="space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-stone-200">{p}</p>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-stone-500 italic">📖 {selected.reference}</p>
        </div>

        {/* Versets */}
        <div className="mb-4">
          <p className="text-[11px] font-bold text-gold-400/80 uppercase tracking-wide mb-2">{t('prophets.verses')}</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.verses.map((v) => (
              <span key={v} className="chip !border-gold-500/40 !text-gold-300 text-[11px]">📜 {v}</span>
            ))}
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

        {quizActive ? (
          <div className="card p-4 border-gold-500/30">
            {quizDone ? (
              <div className="text-center">
                <p className="text-2xl mb-2">{quizScore}/{selected.quiz.length}</p>
                <p className="text-sm text-stone-300">
                  {quizScore === selected.quiz.length ? '🎉 Parfait !' : '📖 Continue à apprendre !'}
                </p>
                <button onClick={() => { setQuizActive(false); setQuizDone(false); }} className="btn-gold mt-3 text-xs">
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

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 animate-fade-in">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-gold-400">{t('prophets.title')}</h2>
        <p className="mt-1 text-xs text-stone-400">{t('prophets.subtitle')}</p>
      </div>
      <div className="space-y-2">
        {PROPHETS.map((p) => (
          <button key={p.name} onClick={() => setSelected(p)}
            className="card card-clickable w-full p-4 text-left transition hover:border-gold-500/50">
            <div className="flex items-center gap-3">
              <div className="font-quran text-2xl text-gold-300 shrink-0" dir="rtl">{p.nameAr}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-stone-100">{p.nameFr}</div>
                <div className="text-[11px] text-stone-400 truncate">{p.title}</div>
              </div>
              <span className="text-xs text-stone-500">🧠</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
