import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n';
import type { EventQuizQuestion } from '../lib/eventQuizzes';

interface Props {
  eventName: string;
  questions: EventQuizQuestion[];
  onClose: () => void;
}

/** Modal de quiz pédagogique sur un événement islamique : une question à la fois,
 *  feedback immédiat avec explication, score final et rejeu. */
export function EventQuizModal({ eventName, questions, onClose }: Props) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[idx];
  const total = questions.length;
  const isLast = idx === total - 1;

  const pick = (i: number) => {
    if (picked !== null) return; // verrouillé après la première réponse
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (isLast) { setFinished(true); return; }
    setIdx((n) => n + 1);
    setPicked(null);
  };

  const replay = () => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  };

  const resultMessage = score === total ? t('quiz.perfect') : score >= Math.ceil(total / 2) ? t('quiz.good') : t('quiz.keepLearning');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="flex items-center gap-2 text-sm font-bold text-gold-400">
          🧠 Quiz — <span className="truncate">{eventName}</span>
        </h3>

        {!finished ? (
          <>
            {/* Progression */}
            <p className="mt-1 text-[10px] uppercase tracking-wide text-stone-500">
              {t('quiz.question')} {idx + 1}/{total} · {t('quiz.score')} : {score}
            </p>

            <p className="mt-3 text-sm font-semibold leading-relaxed">{q.q}</p>

            <div className="mt-3 space-y-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.answer;
                const isPicked = i === picked;
                let cls = 'btn-ghost w-full justify-start rounded-xl border px-3 py-2 text-left text-sm';
                if (picked !== null) {
                  if (isCorrect) cls += ' !border-emerald-500/60 !bg-emerald-500/15 !text-emerald-200';
                  else if (isPicked) cls += ' !border-red-500/60 !bg-red-500/15 !text-red-300 opacity-80';
                  else cls += ' opacity-40';
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={picked !== null} className={cls}>
                    <span className="mr-2 text-[11px] font-bold text-stone-500">{'ABCD'[i]}</span>
                    {opt}
                    {picked !== null && isCorrect && <span className="ml-1">✅</span>}
                    {picked !== null && isPicked && !isCorrect && <span className="ml-1">❌</span>}
                  </button>
                );
              })}
            </div>

            {picked !== null && (
              <>
                <p className="mt-3 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-[11px] leading-relaxed text-stone-300 animate-fade-in">
                  💡 {q.explain}
                </p>
                <button onClick={next} className="btn-gold mt-3 w-full text-sm">
                  {isLast ? t('quiz.seeResult') : `${t('quiz.next')} →`}
                </button>
              </>
            )}
          </>
        ) : (
          /* Résultat */
          <div className="mt-4 animate-fade-in text-center">
            <p className="text-4xl">{score === total ? '🎉' : score >= Math.ceil(total / 2) ? '🌟' : '📖'}</p>
            <p className="mt-2 text-lg font-bold text-gold-300">
              {t('quiz.score')} : {score}/{total}
            </p>
            <p className="mt-1 text-xs text-stone-400">{resultMessage}</p>
            <button onClick={replay} className="btn-ghost mt-4 w-full text-sm">
              🔄 {t('quiz.replay')}
            </button>
          </div>
        )}

        <button onClick={onClose} className="mt-3 w-full text-center text-xs text-stone-400 underline underline-offset-2">
          {t('common.cancel')}
        </button>
      </div>
    </div>
  
  ,
  document.body
  );

}
