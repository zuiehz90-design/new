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

import type { ReactNode } from 'react';

/** Icônes vectorielles fines (lucide-style) — uniquement or / gris-vert. */
const strokeIcon = (paths: ReactNode, size = 16) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    {paths}
  </svg>
);

const CAT_ICONS: Record<QuizCategory | 'mixed', ReactNode> = {
  mixed: strokeIcon(<><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1.2" /><circle cx="15" cy="15" r="1.2" /><circle cx="9" cy="15" r="1.2" /></>, 28),
  quran: strokeIcon(<><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" /></>, 28),
  prophets: strokeIcon(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />, 28),
  prayer: strokeIcon(<><path d="M12 2l2.8 4.5M12 2 9.2 6.5M12 2v3" /><path d="M5 21h14M6 21v-7h12v7" /><path d="M8.5 14V10a3.5 3.5 0 0 1 7 0v4" /></>, 28),
  fiqh: strokeIcon(<><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>, 28),
  history: strokeIcon(<><path d="M5 3h14v18H5z" /><path d="M3 5v2a2 2 0 0 0 2 2M21 5v2a2 2 0 0 1-2 2" /><path d="M9 8h6M9 12h6M9 16h4" /></>, 28),
  names: strokeIcon(<path d="M12 2l2.9 6.26L21 9.27l-5 4.87L17.18 21 12 17.77 6.82 21 8 14.14l-5-4.87 6.1-1.01z" />, 28),
};

const BADGE_ICONS: Record<string, ReactNode> = {
  'quiz-1': strokeIcon(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>, 15),
  'quiz-3': strokeIcon(<><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" /></>, 15),
  'quiz-7': strokeIcon(<><path d="M17 3l4 4L8 20l-5 1 1-5L17 3Z" /></>, 15),
  'quiz-14': strokeIcon(<><path d="M12 3 2 8l10 5 10-5-10-5Z" /><path d="M6 10.5V16c0 1.5 2.5 3 6 3s6-1.5 6-3v-5.5" /></>, 15),
  'quiz-30': strokeIcon(<><path d="M9 18h6M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" /></>, 15),
  'quiz-perfect': strokeIcon(<><circle cx="12" cy="14" r="6" /><path d="m8.2 13.9-4.5-4.4 3.5-1 2-3.5M15.8 13.9l4.5-4.4-3.5-1-2-3.5" /></>, 15),
};

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
          <h2 className="font-display text-2xl font-bold text-[#D4AF37]">{t('quiz.title')}</h2>
          <p className="mt-1 text-xs text-[#A3B1AC]">{t('quiz.subtitle')}</p>
        </div>

        {/* Score hebdomadaire — hero */}
        <div className="card mb-6 overflow-hidden p-5 text-center" style={{ borderColor: '#D4AF37', background: 'radial-gradient(ellipse 70% 85% at 50% 15%, rgba(212,175,55,0.10), transparent 65%), var(--bg-card)' }}>
          <p className="text-xs text-[#A3B1AC]">{t('quiz.weeklyScore')}</p>
          <p className="font-display text-5xl font-bold text-[#F4D03F]">{stats.weeklyScore} <span className="text-2xl">{t('quiz.points')}</span></p>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col items-center gap-1 rounded-xl px-2 py-3" style={{ background: '#112925', border: '1px solid #2A4A43' }}>
            <span style={{ color: '#D4AF37' }}>{strokeIcon(<><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4a1 1 0 0 0-1 1c0 2 1.5 3.5 4 4M17 5h3a1 1 0 0 1 1 1c0 2-1.5 3.5-4 4" /></>, 16)}</span>
            <p className="text-lg font-bold text-[#D4AF37]">{stats.total}</p>
            <p className="text-[10px] text-[#A3B1AC]">{t('quiz.totalQuiz')}</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl px-2 py-3" style={{ background: '#112925', border: '1px solid #2A4A43' }}>
            <span style={{ color: '#D4AF37' }}>{strokeIcon(<path d="M12 2l2.9 6.26L21 9.27l-5 4.87L17.18 21 12 17.77 6.82 21 8 14.14l-5-4.87 6.1-1.01z" />, 16)}</span>
            <p className="text-lg font-bold text-[#1F6E5C]">{stats.perfect}</p>
            <p className="text-[10px] text-[#A3B1AC]">{t('quiz.perfectQuiz')}</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl px-2 py-3" style={{ background: '#112925', border: '1px solid #2A4A43' }}>
            <span style={{ color: '#D4AF37' }}>{strokeIcon(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />, 16)}</span>
            <p className="text-lg font-bold text-[#D4AF37]">{stats.bestStreak}</p>
            <p className="text-[10px] text-[#A3B1AC]">{t('quiz.streak')}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-4">
          <p className="font-display mb-3 text-sm font-bold text-[#D4AF37]">{t('quiz.badges')}</p>
          <div className="flex flex-wrap gap-2">
            {QUIZ_BADGES.map((b) => {
              const earned = stats.badges.includes(b.id);
              return (
                <span
                  key={b.id}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                  style={earned
                    ? { background: '#112925', border: '1px solid #D4AF37', color: '#F4D03F' }
                    : { background: '#112925', border: '1px solid #2A4A43', color: '#7A8C87' }}
                  title={b.label}
                >
                  <span style={{ display: 'inline-flex', color: earned ? '#F4D03F' : '#7A8C87' }}>{BADGE_ICONS[b.id]}</span>
                  {b.label}
                </span>
              );
            })}
          </div>
        </div>


        {/* Category selection */}
        <p className="font-display mb-10 mt-2 text-center text-base font-bold text-[#D4AF37]">{t('quiz.chooseCategory')}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => startQuiz('mixed')}
            className="card card-clickable p-5 text-center transition hover:border-[#D4AF37]"
            style={{ background: 'linear-gradient(180deg, #112925, #0A1F1C)', border: '1px solid #2A4A43' }}
          >
            <span className="mb-2 block text-[#D4AF37]">{CAT_ICONS.mixed}</span>
            <span className="font-display text-sm font-bold text-[#D4AF37]">{t('quiz.mixed')}</span>
          </button>
          {(Object.keys(QUIZ_CATEGORIES) as QuizCategory[]).map((cat) => {
            const meta = QUIZ_CATEGORIES[cat];
            const count = QUIZ_QUESTIONS.filter((q) => q.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => startQuiz(cat)}
                className="card card-clickable p-5 text-center transition hover:border-[#D4AF37]"
                style={{ background: 'linear-gradient(180deg, #112925, #0A1F1C)', border: '1px solid #2A4A43' }}
              >
                <span className="mb-2 block text-[#D4AF37]">{CAT_ICONS[cat]}</span>
                <span className="font-display text-sm font-bold text-[#D4AF37]">
                  {lang === 'ar' ? meta.ar : lang === 'en' ? meta.en : meta.fr}
                </span>
                <span className="mt-1 block text-[10px] text-[#A3B1AC]">{count} {t('quiz.questions')}</span>
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
