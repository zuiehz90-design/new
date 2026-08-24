import { useState } from 'react';
import { useI18n } from '../i18n';
import { PROPHETS, type ProphetStory } from '../lib/prophets';

export function ProphetsView() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<ProphetStory | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);

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
    return (
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 animate-fade-in">
        <button onClick={() => { setSelected(null); setQuizActive(false); }} className="btn-ghost mb-4 text-xs">
          ← {t('quran.back')}
        </button>
        <div className="card mb-4 p-5 border-gold-500/40">
          <div className="font-quran text-3xl text-gold-300" dir="rtl">{selected.nameAr}</div>
          <h2 className="mt-1 text-xl font-bold text-gold-400">{selected.nameFr}</h2>
          <p className="text-xs text-stone-400">{selected.title}</p>
        </div>
        <div className="card p-4 mb-4">
          <p className="text-sm leading-relaxed text-stone-200 whitespace-pre-line">{selected.story}</p>
          <p className="mt-3 text-[11px] text-stone-500 italic">{selected.reference}</p>
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {selected.lessons.map((l) => (
            <span key={l} className="chip !border-emerald-500/50 !text-emerald-300 text-[11px]">✨ {l}</span>
          ))}
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
                  {t('quran.back')}
                </button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-xs text-gold-400">Question {quizIdx + 1}/{selected.quiz.length}</p>
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
                    {quizIdx + 1 >= selected.quiz.length ? 'Voir le score' : 'Question suivante →'}
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <button onClick={() => startQuiz(selected)} className="btn-gold w-full text-xs">
            🧠 Tester ses connaissances
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
