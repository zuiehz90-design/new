import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useNameAudio } from '../hooks/useNameAudio';
import { storageKey } from '../lib/storageScope';
import { push } from '../lib/notifications';
import {
  getSpecialDay,
  reminderKey,
  TAKBIR_AUDIO_URL,
  type SpecialDayInfo,
} from '../lib/specialDay';
import { getEventQuiz } from '../lib/eventQuizzes';

/** Clé locale de la checklist d'actions (une par jour et par événement). */
function actionsKey(scope: string, info: SpecialDayInfo): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return storageKey(scope, `specialday-actions:${dateStr}:${info.event.month}-${info.event.day}`);
}

export function SpecialDayCard() {
  const { t, lang } = useI18n();
  const { scope } = useAuth();
  const audio = useNameAudio();

  // Jour spécial actuel ou imminent (veille). ?demo-special=1 : prévisualise
  // la carte avec le prochain grand événement (mode test/démonstration).
  const info = useMemo(() => {
    const demo = typeof window !== 'undefined' && window.location.search.includes('demo-special');
    return getSpecialDay(undefined, demo ? { force: true } : undefined);
  }, []);

  // ── Rappel : une notification par jour et par événement (anti-doublon) ──
  useEffect(() => {
    if (!info || info.daysLeft > 1) return;
    const key = reminderKey(new Date(), info);
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch { /* stockage indisponible */ }
    const name = lang === 'ar' ? info.event.nameAr : info.event.name;
    void push({
      type: 'special',
      icon: info.isToday ? '🎉' : '🌙',
      title: info.isToday
        ? t('specialday.notifTodayTitle', { name })
        : t('specialday.notifEveTitle', { name }),
      body: info.isToday ? t('specialday.notifTodayBody') : t('specialday.notifEveBody'),
      clickUrl: '/hijri',
    });
    // Dépend de la clé uniquement : se déclenche une fois par jour/événement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.event.month, info?.event.day, info?.daysLeft]);

  // ── Checklist d'actions cochées (persistée par compte/jour/événement) ──
  const storageK = info ? actionsKey(scope, info) : '';
  const [done, setDone] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!storageK) { setDone(new Set()); return; }
    try {
      const raw = localStorage.getItem(storageK);
      setDone(new Set(raw ? (JSON.parse(raw) as number[]) : []));
    } catch { setDone(new Set()); }
  }, [storageK]);
  const toggleAction = useCallback((idx: number) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      try { localStorage.setItem(storageK, JSON.stringify([...next])); } catch { /* quota */ }
      return next;
    });
  }, [storageK]);

  if (!info || info.daysLeft > 1) return null;

  const eventName = lang === 'ar' ? info.event.nameAr : info.event.name;
  const quizQuestions = getEventQuiz(info.event.month, info.event.day);
  const locale = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR';
  const dateLabel = info.gregorianDate.toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <section
      className={
        'card mb-4 overflow-hidden p-5 text-center animate-fade-in ' +
        (info.isToday
          ? 'border-gold-500/60 bg-gradient-to-br from-gold-500/15 to-emerald-500/10'
          : 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent')
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-400/80">
        {info.isToday ? `🎉 ${t('countdown.today')}` : `🌙 ${t('specialday.tomorrow')}`}
      </p>

      <h3 className="mt-1 text-xl font-extrabold text-gold-300">
        {lang === 'ar' ? <span dir="rtl">{eventName}</span> : eventName}
      </h3>
      <p className="mt-0.5 text-[11px] text-stone-500">
        {info.hijriDate.day} {lang === 'ar' ? info.hijriDate.monthNameAr : info.hijriDate.monthName} {info.hijriDate.year} {lang === 'ar' ? 'هـ' : 'AH'}
        {' · '}
        {dateLabel}
      </p>

      {/* Takbir en audio (domaine public — archive.org) */}
      {info.takbirRelevant && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => audio.play(TAKBIR_AUDIO_URL)}
            className={`chip py-1.5 text-xs ${audio.playing ? '!border-gold-500/70 !text-gold-300' : ''}`}
          >
            {audio.playing ? `⏹ ${t('specialday.takbirStop')}` : `🔊 ${t('specialday.takbirPlay')}`}
          </button>
          <button
            onClick={audio.toggleLoop}
            className={`chip py-1.5 text-xs ${audio.looping ? '!border-gold-500/70 !text-gold-300' : ''}`}
            title={t('names99.audioLoop')}
          >
            🔁
          </button>
        </div>
      )}

      {/* Suggestions concrètes d'actions */}
      {info.actions.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{t('specialday.actionsTitle')}</p>
          <ul className="mt-2 space-y-1.5 text-left">
            {info.actions.map((action, i) => (
              <li key={i}>
                <button
                  onClick={() => toggleAction(i)}
                  disabled={!info.isToday}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-stone-800/40 disabled:cursor-default"
                >
                  <span className={'shrink-0 text-sm leading-none mt-0.5 ' + (done.has(i) ? 'text-emerald-400' : 'text-stone-600')}>
                    {done.has(i) ? '☑' : '☐'}
                  </span>
                  <span className={'text-[12px] leading-relaxed ' + (done.has(i) ? 'text-stone-500 line-through' : 'text-stone-300')}>
                    {action}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liens utiles */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {quizQuestions && (
          <Link to={`/hijri?quiz=${info.event.month}-${info.event.day}`} className="chip text-xs py-1.5">
            🧠 {t('hijri.quiz.button')}
          </Link>
        )}
        <Link to="/hijri" className="chip text-xs py-1.5">📅 {t('countdown.viewCalendar')}</Link>
      </div>
    </section>
  );
}
