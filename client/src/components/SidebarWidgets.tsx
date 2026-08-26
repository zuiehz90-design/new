import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useMawaqitTimes } from '../hooks/useMawaqitTimes';
import { prayerLabel } from '../lib/prayer';
import { DashboardSuggestions } from './DashboardSuggestions';

/**
 * Widgets de la barre latérale (desktop) : les recommandations du moment
 * au-dessus, puis la prochaine prière en grand avec le temps restant.
 */
export function SidebarWidgets() {
  return (
    <div className="space-y-3">
      <DashboardSuggestions compact />
      <SidebarNextPrayer />
    </div>
  );
}

/** Prochaine prière en grand : nom, temps restant (gros) et heure (petit). */
export function SidebarNextPrayer() {
  const { t } = useI18n();
  const pt = useMawaqitTimes();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const countdown = useMemo(() => {
    if (!pt?.next) return null;
    const diff = Math.max(0, pt.next.date.getTime() - now);
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    return { h, m, s };
  }, [pt, now]);

  if (!pt?.next) {
    return (
      <Link to="/prayer" className="card block p-4 text-center border-gold-500/30">
        <p className="text-xs text-stone-400">{t('dashboard.noMosque')}</p>
        <p className="btn-gold mt-2 inline-block text-xs">🕌 {t('prayer.mosqueSelect')}</p>
      </Link>
    );
  }

  const key = pt.next.key as Parameters<typeof prayerLabel>[0];
  return (
    <Link to="/prayer" className="card block p-4 text-center border-gold-500/40 bg-gold-500/5 shadow-glow hover:border-gold-500/70 transition">
      <p className="text-[10px] uppercase tracking-widest text-gold-400">{t('prayer.next')}</p>
      <p className="mt-1 text-lg font-bold text-gold-300">{t(prayerLabel(key))}</p>
      {countdown && (
        <p className="mt-2 text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>
          {countdown.h > 0 && <span>{countdown.h}h </span>}
          <span>{countdown.m.toString().padStart(2, '0')}m</span>
          <span className="ml-1 text-lg text-stone-400">{countdown.s.toString().padStart(2, '0')}s</span>
        </p>
      )}
      <p className="mt-1.5 text-xs text-stone-400">🕌 {pt.next.time}</p>
    </Link>
  );
}
