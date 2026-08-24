import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../i18n';
import { notify } from '../lib/desktop';
import {
  QUIZ_QUESTIONS,
  QUIZ_CATEGORIES,
  QUIZ_BADGES,
  pickQuestions,
  saveQuizResult,
  getQuizStats,
  type QuizCategory,
  type QuizQuestion,
} from '../lib/quizData';

export function QuizView() {
  const { t, lang } = useI18n();
  const [phase, setPhase] = useState<'home' | 'playing' | 'result'>('home');
  const [category, setCategory] = useState<QuizCategory | 'mixed'>('mixed');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [stats, setStats] = useState(() => getQuizStats());

  const startQuiz = (cat: QuizCategory | 'mixed') => {
    const picked = pickQuestions(cat, 5);
    setCategory(cat);
    setQuestions(picked);
    setCurrentIdx(0);
    setSelected(null);
    setScore(0);
    setShowExplanation(false);
    setPhase('playing');
  };

  const answer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    if (idx === questions[currentIdx].correct) {
      setScore((s) => s + 1);
    }
  };

  const next = () => {
    if (currentIdx + 1 >= questions.length) {
      const perfect = score === questions.length;
      saveQuizResult({
        date: new Date().toISOString(),
        category,
        score,
        total: questions.length,
        perfect,
      });
      setStats(getQuizStats());
      setPhase('result');
      if (perfect) notify({ title: '💯 Quiz sans faute !', body: `${score}/${questions.length} — Masha\'Allah !` });
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  const progress = ((currentIdx + (showExplanation ? 1 : 0)) / questions.length) * 100;
  const current = questions[currentIdx];

  // Home screen
  if (phase === 'home') {
    return (
      <div className="mx-auto max-w-lg px-4 pb-8 pt-6 animate-fade-in">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-gold-400">{t('quiz.title')}</h2>
          <p className="mt-1 text-xs text-stone-400">{t('quiz.subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="card p-2">
            <p className="text-lg font-bold text-gold-300">{stats.total}</p>
            <p className="text-[10px] text-stone-400">{t('quiz.totalQuiz')}</p>
          </div>
          <div className="card p-2">
            <p className="text-lg font-bold text-emerald-300">{stats.perfect}</p>
            <p className="text-[10px] text-stone-400">{t('quiz.perfectQuiz')}</p>
          </div>
          <div className="card p-2">
            <p className="text-lg font-bold text-sky-300">{stats.bestStreak}🔥</p>
            <p className="text-[10px] text-stone-400">{t('quiz.streak')}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-gold-400">{t('quiz.badges')}</p>
          <div className="flex flex-wrap gap-1.5">
            {QUIZ_BADGES.map((b) => {
              const earned = stats.badges.includes(b.id);
              return (
                <span
                  key={b.id}
                  className={`chip text-xs ${earned ? '!border-gold-500/60 !text-gold-300' : 'opacity-40'}`}
                  title={b.label}
                >
                  {b.icon} {b.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Weekly score */}
        <div className="card mb-4 p-3 border-emerald-500/20 text-center">
          <p className="text-xs text-stone-400">{t('quiz.weeklyScore')}</p>
          <p className="text-xl font-bold text-emerald-300">{stats.weeklyScore} {t('quiz.points')}</p>
        </div>

        {/* Category selection */}
        <p className="mb-2 text-center text-xs text-stone-400">{t('quiz.chooseCategory')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => startQuiz('mixed')}
            className="card card-clickable p-4 text-center transition hover:border-gold-500/50"
          >
            <span className="text-3xl block mb-1">🎲</span>
            <span className="text-sm font-semibold text-gold-300">{t('quiz.mixed')}</span>
          </button>
          {(Object.keys(QUIZ_CATEGORIES) as QuizCategory[]).map((cat) => {
            const meta = QUIZ_CATEGORIES[cat];
            const count = QUIZ_QUESTIONS.filter((q) => q.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => startQuiz(cat)}
                className="card card-clickable p-4 text-center transition hover:border-gold-500/40"
              >
                <span className="text-3xl block mb-1">{meta.icon}</span>
                <span className="text-sm font-semibold text-stone-200">
                  {lang === 'ar' ? meta.ar : lang === 'en' ? meta.en : meta.fr}
                </span>
                <span className="block text-[10px] text-stone-500">{count} {t('quiz.questions')}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Playing
  if (phase === 'playing' && current) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-8 pt-6 animate-fade-in">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-stone-400">
            <span>{t('quiz.question')} {currentIdx + 1}/{questions.length}</span>
            <span className="text-gold-400">{t('quiz.score')}: {score}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-800">
            <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Category badge */}
        <div className="mb-3 flex justify-center">
          <span className="chip text-xs !border-emerald-500/40 !text-emerald-300">
            {QUIZ_CATEGORIES[current.category].icon} {lang === 'ar' ? QUIZ_CATEGORIES[current.category].ar : lang === 'en' ? QUIZ_CATEGORIES[current.category].en : QUIZ_CATEGORIES[current.category].fr}
          </span>
        </div>

        {/* Question */}
        <div className="card mb-4 p-5">
          <p className="text-base font-semibold text-stone-100 leading-relaxed">{current.question}</p>
          {current.questionAr && (
            <p className="mt-2 font-quran text-lg text-gold-300 text-right" dir="rtl">{current.questionAr}</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
          {current.options.map((opt, i) => {
            let cls = 'chip w-full text-left cursor-pointer';
            if (selected !== null) {
              if (i === current.correct) {
                cls += ' !border-emerald-500 !bg-emerald-500/15 !text-emerald-300';
              } else if (i === selected) {
                cls += ' !border-red-500 !bg-red-500/15 !text-red-300';
              } else {
                cls += ' opacity-50';
              }
            }
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={selected !== null}
                className={cls}
              >
                <span className="mr-2 text-stone-500">{['A', 'B', 'C', 'D'][i]}</span>
                {opt}
                {selected !== null && i === current.correct && ' ✓'}
                {selected !== null && i === selected && i !== current.correct && ' ✗'}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="card mt-4 p-4 border-gold-500/20 animate-fade-in">
            <p className="text-[10px] font-semibold text-gold-400 mb-1">📖 {t('quiz.explanation')}</p>
            <p className="text-xs leading-relaxed text-stone-300">{current.explanation}</p>
            <button onClick={next} className="btn-gold mt-3 w-full text-xs">
              {currentIdx + 1 >= questions.length ? `🏁 ${t('quiz.seeResult')}` : `${t('quiz.next')} →`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Result
  const total = questions.length;
  const perfect = score === total;
  const percentage = Math.round((score / total) * 100);

  return (
    <div className="mx-auto max-w-lg px-4 pb-8 pt-6 animate-fade-in text-center">
      <div className="mb-6">
        {perfect ? '🎉' : percentage >= 60 ? '👍' : '📚'}
        <p className="mt-2 text-3xl font-bold text-gold-300">
          {score}/{total}
        </p>
        <p className="text-sm text-stone-400">
          {perfect ? t('quiz.perfect') : percentage >= 60 ? t('quiz.good') : t('quiz.keepLearning')}
        </p>
        <p className="mt-1 text-xs text-stone-500">{percentage}%</p>
      </div>

      {/* New badges? */}
      {stats.badges.length > 0 && (
        <div className="card mb-4 p-3 border-gold-500/30">
          <p className="mb-2 text-xs font-semibold text-gold-400">{t('quiz.badgesEarned')}</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {QUIZ_BADGES.filter((b) => stats.badges.includes(b.id)).map((b) => (
              <span key={b.id} className="chip !border-gold-500/50 !text-gold-300 text-xs">
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        <button onClick={() => startQuiz(category)} className="btn-gold text-xs">
          🔄 {t('quiz.replay')}
        </button>
        <button onClick={() => setPhase('home')} className="btn-ghost text-xs">
          🏠 {t('quiz.home')}
        </button>
      </div>
    </div>
  );
}
