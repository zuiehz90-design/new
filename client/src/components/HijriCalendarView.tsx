import { useState, useMemo } from 'react';
import { useI18n } from '../i18n';
import {
  gregorianToHijri,
  buildHijriMonthCalendar,
  HIJRI_MONTHS,
  getUpcomingEvents,
  type IslamicEvent,
} from '../lib/hijriCalendar';

const EVENT_ICONS: Record<IslamicEvent['type'], string> = {
  holiday: '🕌',
  recommended: '🤲',
  historical: '📜',
};

const EVENT_COLORS: Record<IslamicEvent['type'], string> = {
  holiday: '!border-gold-500/60 !bg-gold-500/10',
  recommended: '!border-emerald-500/50 !bg-emerald-500/10',
  historical: '!border-sky-500/40 !bg-sky-500/10',
};

export function HijriCalendarView() {
  const { t, lang } = useI18n();
  const today = useMemo(() => gregorianToHijri(new Date()), []);
  const [viewMonth, setViewMonth] = useState(today.month);
  const [viewYear, setViewYear] = useState(today.year);
  const [showUpcoming, setShowUpcoming] = useState(false);

  const calendar = useMemo(
    () => buildHijriMonthCalendar(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const upcoming = useMemo(() => getUpcomingEvents(5), []);

  const goPrevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const monthLabel = lang === 'ar'
    ? HIJRI_MONTHS[viewMonth - 1].ar
    : lang === 'en'
    ? HIJRI_MONTHS[viewMonth - 1].en
    : HIJRI_MONTHS[viewMonth - 1].fr;

  // Jours grégoriens de la semaine (pour l'en-tête)
  const weekDays = lang === 'ar'
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : lang === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Construire la grille : trouver le jour de la semaine du 1er
  const firstDayWeekday = calendar[0]?.gregorian.getDay() ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-6 animate-fade-in">
      {/* En-tête */}
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-gold-400">{t('hijri.title')}</h2>
        <p className="mt-1 text-xs text-stone-400">{t('hijri.subtitle')}</p>
      </div>

      {/* Date hégirienne d'aujourd'hui */}
      <div className="card mb-4 p-4 text-center border-gold-500/30">
        <p className="text-xs text-stone-400">{t('hijri.today')}</p>
        <p className="mt-1 text-xl font-bold text-gold-300">
          {today.day} {lang === 'ar' ? today.monthNameAr : today.monthName} {today.year} {lang === 'ar' ? 'هـ' : 'AH'}
        </p>
        <p className="mt-1 text-[11px] text-stone-500">
          {new Date().toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Bascule calendrier / événements à venir */}
      <div className="mb-4 flex justify-center gap-1.5">
        <button
          onClick={() => setShowUpcoming(false)}
          className={`chip text-xs ${!showUpcoming ? '!border-gold-500/70 !text-gold-300' : ''}`}
        >
          📅 {t('hijri.monthView')}
        </button>
        <button
          onClick={() => setShowUpcoming(true)}
          className={`chip text-xs ${showUpcoming ? '!border-gold-500/70 !text-gold-300' : ''}`}
        >
          🔔 {t('hijri.upcoming')}
        </button>
      </div>

      {showUpcoming ? (
        /* Événements à venir */
        <div className="space-y-2">
          {upcoming.map((e, i) => {
            const daysAway = Math.ceil((e.gregorianDate.getTime() - Date.now()) / 86400000);
            return (
              <div key={i} className={`card p-4 ${EVENT_COLORS[e.type]}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{EVENT_ICONS[e.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-stone-100 text-sm">{lang === 'ar' ? e.nameAr : e.name}</p>
                      <span className="text-[11px] text-gold-400 shrink-0">
                        {daysAway === 0 ? t('hijri.today') : `${daysAway} ${t('hijri.days')}`}
                      </span>
                    </div>
                    {lang === 'ar' && (
                      <p className="text-xs text-stone-300 mt-0.5" dir="rtl">{e.nameAr}</p>
                    )}
                    <p className="mt-1 text-xs text-stone-400">{e.description}</p>
                    <p className="mt-1 text-[11px] text-stone-500">
                      {e.hijriDate.day} {lang === 'ar' ? e.hijriDate.monthNameAr : e.hijriDate.monthName} {e.hijriDate.year} {lang === 'ar' ? 'هـ' : 'AH'}
                      {' · '}
                      {e.gregorianDate.toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vue calendrier mensuel */
        <>
          {/* Navigation mois */}
          <div className="mb-3 flex items-center justify-between">
            <button onClick={goPrevMonth} className="btn-ghost text-xs">‹</button>
            <div className="text-center">
              <p className="text-lg font-bold text-gold-300">{monthLabel}</p>
              <p className="text-[11px] text-stone-500">{viewYear} {lang === 'ar' ? 'هـ' : 'AH'}</p>
            </div>
            <button onClick={goNextMonth} className="btn-ghost text-xs">›</button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-stone-500 py-1">{d}</div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {/* Jours vides avant le 1er */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Jours du mois */}
            {calendar.map((day) => {
              const hasEvent = day.events.length > 0;
              const isToday = day.isToday;
              return (
                <div
                  key={day.hijriDay}
                  className={`aspect-square rounded-lg p-1 text-center transition-all ${
                    isToday
                      ? 'bg-gold-500/20 border border-gold-500/60'
                      : hasEvent
                      ? 'bg-emerald-500/5 border border-emerald-500/20'
                      : 'hover:bg-stone-800/50'
                  }`}
                >
                  <p className={`text-xs font-medium ${isToday ? 'text-gold-300' : 'text-stone-300'}`}>
                    {day.hijriDay}
                  </p>
                  <p className="text-[9px] text-stone-500">
                    {day.gregorian.getDate()}
                  </p>
                  {hasEvent && (
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {day.events.map((e, i) => (
                        <span key={i} className="text-[8px]" title={e.name}>
                          {EVENT_ICONS[e.type]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] text-stone-400">
            <span className="flex items-center gap-1">🕌 {t('hijri.holiday')}</span>
            <span className="flex items-center gap-1">🤲 {t('hijri.recommended')}</span>
            <span className="flex items-center gap-1">📜 {t('hijri.historical')}</span>
          </div>

          {/* Événements du mois affiché */}
          {calendar.some((d) => d.events.length > 0) && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-stone-400">{t('hijri.thisMonth')}</p>
              {calendar
                .filter((d) => d.events.length > 0)
                .flatMap((d) => d.events.map((e) => ({ e, day: d })))
                .map(({ e, day }, i) => (
                  <div key={i} className={`card p-3 ${EVENT_COLORS[e.type]}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{EVENT_ICONS[e.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-100">
                          {lang === 'ar' ? e.nameAr : e.name}
                        </p>
                        <p className="text-[11px] text-stone-400">{e.description}</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">
                          {day.hijriDay} {lang === 'ar' ? HIJRI_MONTHS[viewMonth - 1].ar : HIJRI_MONTHS[viewMonth - 1].fr}
                          {' · '}
                          {day.gregorian.toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
