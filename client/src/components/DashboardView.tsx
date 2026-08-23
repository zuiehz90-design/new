import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { useChatContext } from '../App';
import { useAuth } from '../context/AuthContext';
import { useDevotion } from '../hooks/useDevotion';
import { useGeolocation } from '../hooks/useGeolocation';
import { computePrayers, formatTime, PRAYER_KEYS, prayerLabel } from '../lib/prayer';
import { useAiSetup } from '../hooks/useAiSetup';
import { PrayerCircles } from './PrayerCircles';
import { RankCard } from './RankCard';
import { MoonIcon } from './icons';

const SALAT_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export function DashboardView() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const { coords, error, loading, request } = useGeolocation();
  const chat = useChatContext();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { prayers, quests, achievements, togglePrayer, toggleQuest } = useDevotion();
  const [now, setNow] = useState(Date.now());
  const aiSetup = useAiSetup();
  const aiConfigured = aiSetup.status !== 'missing';

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);


  const pt = useMemo(() => {
    if (!coords) return null;
    try {
      return computePrayers(coords, settings.prayerMethod);
    } catch {
      return null;
    }
  }, [coords, settings.prayerMethod, now]);

  const countdown = useMemo(() => {
    if (!pt?.next) return null;
    const diff = Math.max(0, pt.next.date.getTime() - now);
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    return { h, m, s, date: pt.next.date };
  }, [pt, now]);

  const missed = useMemo(() => {
    if (!pt || !prayers) return [];
    const checked = prayers.checked;
    return SALAT_KEYS.filter((key) => {
      const time = pt[key as keyof typeof pt] as Date | undefined;
      return time && time.getTime() < now && !checked.includes(key);
    });
  }, [pt, prayers, now]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 animate-fade-in">
      <div className="mb-6 text-center">
        <div className="font-quran hidden text-4xl text-gold-400 sm:block">﷽</div>
        <h1 className="mt-2 text-2xl font-bold">
          {t('dashboard.title')} <MoonIcon className="inline h-5 w-5 text-gold-400" />
        </h1>
      </div>
      {/* Bannière clé API (si IA non configurée) */}
      {!aiConfigured && (
        <section className="card mb-4 border-amber-500/40 bg-amber-900/15 p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🔑</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">L'IA n'est pas encore configurée</p>
              <p className="text-xs text-stone-400 mt-1">
                Ajoute une clé API <strong>gratuite</strong> depuis{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="text-gold-400 underline">openrouter.ai/keys</a>
                {' '}(sans CB) pour activer le chat intelligent.
              </p>
              <button onClick={aiSetup.open} className="btn-gold mt-2 text-xs">
                Configurer l'IA (gratuit)
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Prochaine prière */}
      <section className="card mb-4 border-gold-500/40 bg-gold-500/5 p-5 text-center shadow-glow">
        {pt?.next ? (
          <>
            <p className="text-xs uppercase tracking-widest text-gold-400">{t('prayer.next')}</p>
            <p className="mt-1 text-2xl font-bold text-gold-300">{t(prayerLabel(pt.next.key))}</p>
            {countdown && (
              <p className="mt-2 text-sm" style={{color:"var(--text-secondary)"}}>
                {countdown.h > 0 && <span className="font-semibold" style={{color:"var(--text-primary)"}}>{countdown.h}h </span>}
                <span className="font-semibold text-stone-200">{countdown.m.toString().padStart(2, '0')}m</span>{' '}
                {countdown.s.toString().padStart(2, '0')}s
              </p>
            )}
          </>
        ) : (
          <div>
            <p className="text-sm text-stone-400">{t('dashboard.noLocation')}</p>
            <button onClick={request} disabled={loading} className="btn-primary mt-3 text-xs">
              {loading ? t('prayer.geolocating') : t('prayer.geolocate')}
            </button>
            {error && (
              <p className="mt-2 text-xs text-red-400" role="alert">{error}</p>
            )}
            <Link
              to="/prayer"
              className="btn-ghost mt-3 w-full justify-center border border-stone-700/50 text-xs hover:border-gold-500/30 hover:text-gold-400"
            >
              📍 {t('prayer.dashboardFallback')}
            </Link>
          </div>
        )}
      </section>

      {/* Horaires du jour */}
      {pt && (
        <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
          {PRAYER_KEYS.map((key) => (
            <div key={key} className={`card p-2 text-center ${pt.next?.key === key ? 'border-gold-500/60' : ''}`}>
              <p className="text-[10px] text-stone-400">{t(prayerLabel(key))}</p>
              <p className="text-sm font-semibold">{formatTime(pt[key])}</p>
            </div>
          ))}
        </section>
      )}

      {/* Compte non connecté → CTA */}
      {!user && (
        <section className="card mb-4 border-emerald-700/40 bg-emerald-900/20 p-4 text-center">
          <p className="text-sm text-stone-300">{t('dashboard.loginPrompt')}</p>
          <Link to="/profile" className="btn-gold mt-3 inline-block text-sm">
            {t('profile.login')} / {t('profile.register')}
          </Link>
        </section>
      )}

      {/* Suivi spirituel (connecté) */}
      {!authLoading && user && (
        <>
          {/* Rang façon jeu vidéo */}
          {achievements && (
            <RankCard
              achievements={achievements}
              points={quests?.lifetime ?? 0}
              right={
                <>
                  <p className="text-lg font-bold text-gold-400">{prayers?.streak.current ?? 0}🔥</p>
                  <p className="text-[10px] text-stone-500">{t('profile.streak')}</p>
                </>
              }
            />
          )}

          {/* Stats rapides */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="card p-3 text-center">
              <p className="text-lg font-bold text-gold-400">{prayers?.total ?? 0}/{prayers?.of ?? 5}</p>
              <p className="text-[10px] text-stone-400">{t('dashboard.salatToday')}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg font-bold text-gold-400">⭐ {quests?.score ?? 0}</p>
              <p className="text-[10px] text-stone-400">{t('profile.points')}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg font-bold text-gold-400">{achievements?.badges?.length ?? 0}🏅</p>
              <p className="text-[10px] text-stone-400">Badges</p>
            </div>
          </div>

            {/* Check-in salat */}
          <section className="card mb-4 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gold-400">🕌 {t('dashboard.salatCheckin')}</h2>

            {/* Alerte prieres manquees */}
            {missed.length > 0 && (
              <div className="mb-3 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span>
                  Vous avez manque :{' '}
                  <strong>
                    {missed.map((k) => t(prayerLabel(k as (typeof PRAYER_KEYS)[number])).split(' ')[0]).join(', ')}
                  </strong>
                  {' '}— touchez pour rattraper
                </span>
              </div>
            )}

            <PrayerCircles
              prayers={prayers}
              missed={missed}
              onToggle={togglePrayer}
              timeOf={(key) => (pt ? (pt[key as keyof typeof pt] as Date | null) : null)}
            />
          </section>


        </>
      )}

          </div>
  );
}