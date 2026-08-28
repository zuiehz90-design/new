import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { countdownParts, COUNTDOWN_HORIZON_DAYS, nextMajorEvent } from '../lib/eventCountdown';

/** Seuil d'affichage « en direct » : sous 4 jours, le compte à rebours tick à la seconde. */
const LIVE_THRESHOLD_DAYS = 3;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function EventCountdown() {
  const { t, lang } = useI18n();

  // Le prochain grand événement (recalculé chaque minute : changement de jour, etc.)
  const [countdown, setCountdown] = useState(() => nextMajorEvent());
  useEffect(() => {
    const id = window.setInterval(() => setCountdown(nextMajorEvent()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const isLive = countdown !== null && countdown.daysLeft <= LIVE_THRESHOLD_DAYS;

  // Tick à la seconde quand l'événement est proche
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isLive || !countdown) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [isLive, countdown?.targetDate.getTime()]);

  const parts = useMemo(
    () => (countdown ? countdownParts(countdown.targetDate) : null),
    [countdown, isLive], // isLive force le recalcul à chaque seconde près de l'événement
  );

  if (!countdown || countdown.daysLeft > COUNTDOWN_HORIZON_DAYS || !parts) return null;

  const isToday = parts.totalMs <= 0;
  const eventName = lang === 'ar' ? countdown.event.nameAr : countdown.event.name;
  const locale = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR';
  const gregorianLabel = countdown.targetDate.toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <section className="card mb-4 overflow-hidden border-gold-500/50 bg-gradient-to-br from-gold-500/10 via-transparent to-emerald-500/5 p-5 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-400/80">
        🌙 {t('countdown.title')}
      </p>

      <h3 className="mt-1 text-xl font-bold text-gold-300">
        {lang === 'ar' ? <span dir="rtl">{eventName}</span> : eventName}
      </h3>

      {isToday ? (
        /* Jour J */
        <div className="animate-fade-in">
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">🎉 {t('countdown.today')}</p>
          <p className="mt-1 text-xs text-stone-400">{countdown.event.description}</p>
        </div>
      ) : isLive ? (
        /* Compte à rebours en direct (J/H/M/S) */
        <div className="mt-3 grid grid-cols-4 gap-2" role="timer">
          {[
            { v: pad(parts.days), label: t('countdown.days') },
            { v: pad(parts.hours), label: t('countdown.hours') },
            { v: pad(parts.minutes), label: t('countdown.minutes') },
            { v: pad(parts.seconds), label: t('countdown.seconds') },
          ].map((box) => (
            <div key={box.label} className="rounded-xl border border-gold-500/30 bg-black/20 px-1 py-2">
              <p className="text-xl font-bold tabular-nums text-gold-300 sm:text-2xl">{box.v}</p>
              <p className="text-[9px] uppercase tracking-wide text-stone-500">{box.label}</p>
            </div>
          ))}
        </div>
      ) : (
        /* Compte à rebours en jours */
        <div className="mt-2 animate-fade-in">
          <p className="text-5xl font-extrabold tabular-nums text-gold-300">J-{countdown.daysLeft}</p>
          <p className="mt-1 text-xs text-stone-400">
            {countdown.daysLeft} {t('hijri.days')}
          </p>
        </div>
      )}

      {!isToday && (
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-stone-400">
          {countdown.event.description}
        </p>
      )}

      <p className="mt-2 text-[10px] text-stone-500">
        {countdown.hijriDate.day} {lang === 'ar' ? countdown.hijriDate.monthNameAr : countdown.hijriDate.monthName} {countdown.hijriDate.year} {lang === 'ar' ? 'هـ' : 'AH'}
        {' · '}
        {gregorianLabel}
      </p>

      <Link to="/hijri" className="mt-3 inline-block text-[11px] font-semibold text-gold-400 underline-offset-2 hover:underline">
        📅 {t('countdown.viewCalendar')}
      </Link>
    </section>
  );
}
