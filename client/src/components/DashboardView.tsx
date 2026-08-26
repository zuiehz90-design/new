import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { useChatContext } from '../App';
import { useAuth } from '../context/AuthContext';
import { CountdownText } from './CountdownText';
import { countdownParts } from '../lib/countdown';
import { useDevotion } from '../hooks/useDevotion';
import { PRAYER_KEYS, prayerLabel } from '../lib/prayer';
import { useMawaqitTimes } from '../hooks/useMawaqitTimes';
import { useAiSetup } from '../hooks/useAiSetup';
import { PrayerCircles } from './PrayerCircles';
import { RankCard } from './RankCard';
import { DailyVerse } from './DailyVerse';
import { DashboardSuggestions } from './DashboardSuggestions';
import { NameOfTheDay } from './NameOfTheDay';
import { isDesktop, isDesktopOnline } from '../lib/desktop';

const SALAT_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export function DashboardView() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const chat = useChatContext();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { prayers, quests, achievements, togglePrayer, toggleQuest } = useDevotion();
  const [now, setNow] = useState(Date.now());
  const [desktopBannerDismissed, setDesktopBannerDismissed] = useState(
    () => localStorage.getItem('nour-desktop-banner-dismissed') === '1'
  );
  const [desktopOnline, setDesktopOnline] = useState<boolean | null>(null);
  const aiSetup = useAiSetup();
  const aiConfigured = aiSetup.status !== 'missing';

  const dismissDesktopBanner = () => {
    localStorage.setItem('nour-desktop-banner-dismissed', '1');
    setDesktopBannerDismissed(true);
  };

  // Vérifier si l'app desktop est connectée à la base en ligne
  useEffect(() => {
    if (isDesktop) {
      isDesktopOnline().then(setDesktopOnline);
    }
  }, []);

  // Vérifier si la pause est active
  const isPaused = settings.prayerPauseUntil && settings.prayerPauseUntil > Date.now();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);


  const pt = useMawaqitTimes();

  const countdown = useMemo(() => {
    if (!pt?.next) return null;
    return countdownParts(pt.next.date.getTime(), now);
  }, [pt, now]);

  const missed = useMemo(() => {
    if (!pt || !prayers) return [];
    const checked = prayers.checked;
    return SALAT_KEYS.filter((key) => {
      const time = pt.dates?.[key];
      return time && time.getTime() < now && !checked.includes(key);
    });
  }, [pt, prayers, now]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 animate-fade-in">
      <div className="mb-6 text-center">
        <div className="font-quran hidden text-4xl text-gold-400 sm:block">﷽</div>
        <h1 className="font-display mt-2 text-3xl font-bold text-gold-400">
          {t('dashboard.title')}
        </h1>
        {/* Indicateur synchro desktop */}
        {isDesktop && desktopOnline !== null && (
          <p className="mt-1 text-[10px]">
            {desktopOnline ? (
              <span className="text-emerald-400">🟢 Synchronisé avec le compte en ligne</span>
            ) : (
              <span className="text-amber-400">🟠 Mode hors-ligne — données locales uniquement</span>
            )}
          </p>
        )}
      </div>

      {/* Bannière app desktop (web uniquement) */}
      {!isDesktop && !desktopBannerDismissed && typeof window !== "undefined" && window.innerWidth >= 768 && (
        <section className="card mb-4 border-gold-500/50 bg-gradient-to-br from-emerald-900/40 to-gold-900/20 p-4 animate-fade-in shadow-glow">
          <div className="flex items-start gap-3">
            <span className="text-3xl shrink-0">🖥️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gold-300">{t('dashboard.desktopTitle')}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-300">{t('dashboard.desktopDesc')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href="https://github.com/zuiehz90-design/new/releases"
                  className="btn-gold text-xs" target="_blank" rel="noopener"
                >
                  ⬇️ {t('dashboard.desktopCta')}
                </a>
                <button onClick={dismissDesktopBanner} className="text-xs text-stone-400 underline hover:text-stone-200">
                  {t('dashboard.desktopDismiss')}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-stone-500">{t('dashboard.desktopHint')}</p>
            </div>
          </div>
        </section>
      )}

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

      {/* ZONE 1 — HERO : prochaine prière */}
      <section
        className="card relative mb-16 overflow-hidden border-gold-500/40 p-8 text-center"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.12), transparent 70%), var(--bg-card)' }}
      >
        {pt?.next ? (
          <>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">{t('prayer.next')}</p>
            <p className="font-display mt-2 text-3xl font-bold text-gold-300">{t(prayerLabel(pt.next.key))}</p>
            {countdown && (
              <p className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl" style={{color:"var(--text-primary)"}}>
                <CountdownText p={countdown} />
              </p>
            )}
          </>
        ) : (
          <div>
            <p className="text-sm text-stone-400">{t('dashboard.noMosque')}</p>
            <Link
              to="/prayer"
              className="btn-gold mt-3 inline-block text-sm"
            >
              🕌 {t('prayer.mosqueSelect')}
            </Link>
          </div>
        )}
      </section>

      {/* Grille de raccourcis */}
      <section className="mb-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { emoji: '✨', label: t('dashboard.suggest.learnNames'), to: '/names' },
          { emoji: '📖', label: t('dashboard.suggest.readQuran'), to: '/quran' },
          { emoji: '🧠', label: t('dashboard.suggest.quiz'), to: '/quiz' },
          { emoji: '📿', label: t('dashboard.suggest.dhikr'), to: '/dhikr' },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="card card-clickable flex flex-col items-center gap-2 p-4 text-center">
            <span className="text-2xl">{c.emoji}</span>
            <span className="text-xs font-semibold text-gold-300">{c.label}</span>
          </Link>
        ))}
      </section>

      {/* Suggestions contextuelles (basées sur lheure et les prières) */}
      <DashboardSuggestions />

      {/* ZONE 2 — Citation du jour + Nom du jour côte à côte */}
      <div className="mb-16 grid gap-4 md:grid-cols-2">
        <DailyVerse />
        <NameOfTheDay />
      </div>

      {/* ZONE 2 — Horaires : rangée horizontale compacte (scrollable sur mobile) */}
      {pt && (
        <section className="mb-4">
          <h2 className="font-display mb-2 text-lg font-bold text-gold-400">{t('prayer.schedule')}</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PRAYER_KEYS.map((key) => (
              <div key={key} className={`card min-w-[76px] shrink-0 p-2.5 text-center ${pt.next?.key === key ? 'border-gold-500/60' : ''}`}>
                <p className="text-[10px] text-stone-400">{t(prayerLabel(key))}</p>
                <p className="text-sm font-semibold">{pt.times?.[key]}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ZONE 3 — Découvrir : grandes cartes cliquables */}
      <section className="mb-16">
        <h2 className="font-display mb-4 text-2xl font-bold text-gold-400">✨ {t('dashboard.discover')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { emoji: 'الرّحمن', title: t('names99.title'), desc: t('names99.daily'), to: '/names', big: true },
            { emoji: '📖', title: t('dashboard.suggest.readQuran'), desc: t('discover.quranDesc'), to: '/quran' },
            { emoji: '📚', title: t('glossary.title'), desc: t('discover.glossaryDesc'), to: '/glossary' },
            { emoji: '🕊️', title: t('discover.prophets'), desc: t('discover.prophetsDesc'), to: '/prophets' },
          ].map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={`card card-clickable flex flex-col items-start gap-2 p-5 ${c.big ? 'sm:col-span-2 sm:flex-row sm:items-center sm:gap-5' : ''}`}
            >
              <span className={`font-quran shrink-0 ${c.big ? 'text-4xl text-gold-300' : 'text-3xl'}`}>{c.emoji}</span>
              <span>
                <span className="font-display block text-base font-bold text-gold-300">{c.title}</span>
                <span className="mt-0.5 block text-xs text-stone-400">{c.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

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
            <RankCard achievements={achievements} />
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
            <h2 className="font-display mb-3 flex items-center gap-2 text-lg font-bold text-gold-400">
              🕌 {t('dashboard.salatCheckin')}
              <span className="ml-auto text-xl tabular-nums" style={{ color: 'var(--accent-gold)' }}>
                {prayers?.total ?? 0}/{prayers?.of ?? 5}
              </span>
            </h2>

            {/* Bannière de pause */}
            {isPaused && (
              <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 flex items-center gap-2">
                <span className="text-lg">⏸️</span>
                <span>{t('prayer.pause.exempt', { date: new Date(settings.prayerPauseUntil!).toLocaleDateString() })}</span>
              </div>
            )}

            {/* Alerte prieres manquees (masquee si pause active) */}
            {!isPaused && missed.length > 0 && (
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
              timeOf={(key) => (pt?.dates ? (pt.dates as Record<string, Date | undefined>)[key] ?? null : null)}
            />
          </section>


        </>
      )}

          </div>
  );
}