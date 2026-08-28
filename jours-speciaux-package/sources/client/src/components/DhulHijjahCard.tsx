import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import {
  ANNOUNCE_WINDOW_DAYS,
  dayActions,
  dhulHijjahStatus,
  invocationFor,
  type DhulHijjahAction,
} from '../lib/dhulHijjah';

/** Liens rapides vers le compteur de dhikr pour les invocations clés. */
const DHIKR_LINKS = [
  { id: 'takbir-dhulhijja', labelKey: 'dhulhijjah.ctaTakbir', emoji: '📿' },
  { id: 'tahlil-100', labelKey: 'dhulhijjah.ctaTahlil', emoji: '🤍' },
  { id: 'istighfar-100', labelKey: 'dhulhijjah.ctaIstighfar', emoji: '🤲' },
] as const;

export function DhulHijjahCard() {
  const { t, lang } = useI18n();

  // Recalcul chaque minute (changement de jour)
  const [status, setStatus] = useState(() => dhulHijjahStatus());
  useEffect(() => {
    const id = window.setInterval(() => setStatus(dhulHijjahStatus()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  /* Hors période et hors fenêtre d'annonce : rien à afficher */
  if (!status.active && (status.daysUntilStart === null || status.daysUntilStart > ANNOUNCE_WINDOW_DAYS)) {
    return null;
  }

  const actionLabels: Record<DhulHijjahAction, string> = {
    fasting: t('dhulhijjah.fasting'),
    arafahFasting: t('dhulhijjah.arafahFasting'),
    noFasting: t('dhulhijjah.noFasting'),
    dhikr: t('dhulhijjah.dhikr'),
    sadaqa: t('dhulhijjah.sadaqa'),
    quran: t('dhulhijjah.quran'),
    takbir: t('dhulhijjah.takbir'),
    arafahDua: t('dhulhijjah.arafahDua'),
    udhiya: t('dhulhijjah.udhiya'),
  };

  const locale = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR';
  const startDateLabel = status.startDate?.toLocaleDateString(locale, { day: 'numeric', month: 'long' });

  /* ── Période active : compteur dédié jour X/10 + rappels du jour ── */
  if (status.active) {
    const day = status.day ?? 1;
    const actions = dayActions(day);
    const invocation = invocationFor('takbir');
    const arafahDua = status.isArafah ? invocationFor('arafahDua') : null;
    const daysToArafah = !status.isArafah && !status.isEid && day < 9 ? 9 - day : null;

    return (
      <section
        className={
          'card mb-4 p-5 animate-fade-in ' +
          (status.isArafah || status.isEid
            ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-gold-500/10'
            : 'border-gold-500/50 bg-gradient-to-br from-gold-500/10 to-transparent')
        }
      >
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-gold-400/80">
          🌙 {t('dhulhijjah.title')}
        </p>
        <h3 className="mt-1 text-center text-lg font-bold text-gold-300">
          {status.isArafah ? `🕋 ${t('dhulhijjah.arafah')}` : status.isEid ? `🎉 ${t('dhulhijjah.eid')}` : `${t('dhulhijjah.subtitle')}`}
        </h3>

        {/* Compteur dédié : jour X / 10 avec points de progression */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-sm font-bold text-stone-200">{t('dhulhijjah.day', { n: String(day) })}</span>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={
                  'h-2 w-2 rounded-full transition-all ' +
                  (i < day ? 'bg-gold-400' : 'bg-stone-600/60')
                }
              />
            ))}
          </div>
        </div>

        {/* Rappels du jour */}
        <ul className="mt-3 space-y-1.5">
          {actions.map((a) => (
            <li key={a} className="flex items-start gap-2 text-[12px] leading-relaxed text-stone-300">
              <span className="text-emerald-400">✓</span>
              <span className={status.isArafah && a === 'arafahFasting' ? 'font-semibold text-emerald-300' : ''}>
                {actionLabels[a]}
              </span>
            </li>
          ))}
        </ul>

        {/* Invocations spécifiques (takbir permanent, du'a de Arafah) */}
        {arafahDua && (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-black/20 px-3 py-2 text-center animate-fade-in">
            <p className="text-[10px] uppercase tracking-wide text-emerald-400">{t('dhulhijjah.arafahDua')}</p>
            <p className="mt-1 font-quran text-base leading-relaxed text-gold-300" dir="rtl">{arafahDua.arabic}</p>
            <p className="mt-1 text-[11px] italic text-stone-400">{arafahDua.transliteration}</p>
          </div>
        )}
        {!status.isEid && invocation && (
          <details className="mt-3 rounded-xl border border-gold-500/25 bg-black/20 px-3 py-2">
            <summary className="cursor-pointer text-[11px] font-semibold text-gold-400">
              📿 {t('dhulhijjah.takbir')} — {t('hijri.details')}
            </summary>
            <p className="mt-2 font-quran text-sm leading-relaxed text-gold-300" dir="rtl">{invocation.arabic}</p>
            <p className="mt-1 text-[11px] italic text-stone-400">{invocation.transliteration}</p>
          </details>
        )}

        {/* Rappel du jeûne de Arafah à venir */}
        {daysToArafah !== null && (
          <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-center text-[11px] font-semibold text-emerald-300">
            🕋 {t('dhulhijjah.daysToArafah', { n: String(daysToArafah) })}
          </p>
        )}

        {/* Compteur de dhikr : liens rapides */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {DHIKR_LINKS.map((l) => (
            <Link key={l.id} to={`/dhikr?id=${l.id}`} className="chip text-xs py-1.5">
              {l.emoji} {t(l.labelKey)}
            </Link>
          ))}
        </div>

        <Link to="/hijri" className="mt-3 block text-center text-[11px] font-semibold text-gold-400 underline-offset-2 hover:underline">
          📅 {t('countdown.viewCalendar')}
        </Link>
      </section>
    );
  }

  /* ── Annonce avant la période ── */
  return (
    <section className="card mb-4 border-gold-500/40 p-4 text-center animate-fade-in">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-400/80">🌙 {t('dhulhijjah.title')}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums text-gold-300">
        J-{status.daysUntilStart}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
        {startDateLabel ? t('dhulhijjah.startOn', { date: startDateLabel }) : ''}
      </p>
      <p className="mt-1 text-[10px] italic text-stone-500">{t('dhulhijjah.hadith')}</p>
      <Link to="/hijri" className="mt-2 inline-block text-[11px] font-semibold text-gold-400 underline-offset-2 hover:underline">
        📅 {t('countdown.viewCalendar')}
      </Link>
    </section>
  );
}
