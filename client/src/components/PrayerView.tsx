import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useDevotion } from '../hooks/useDevotion';
import { useMawaqitTimes } from '../hooks/useMawaqitTimes';
import { searchMosques, listMethods, type MawaqitMosque, type MethodInfo } from '../lib/mawaqit';
import { PrayerCircles } from './PrayerCircles';
import { PrayerPauseModal } from './PrayerPauseModal';

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'prayer.fajr', sunrise: 'prayer.sunrise', dhuhr: 'prayer.dhuhr',
  asr: 'prayer.asr', maghrib: 'prayer.maghrib', isha: 'prayer.isha',
};
const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export function PrayerView() {
  const { t } = useI18n();
  const { settings, setSettings } = useSettings();
  const { user } = useAuth();
  const { prayers, togglePrayer } = useDevotion();
  const [now, setNow] = useState(Date.now());
  const [pauseOpen, setPauseOpen] = useState(false);

  // Recherche mosquée
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MawaqitMosque[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // Méthodes
  const [methods, setMethods] = useState<MethodInfo[]>([]);
  useEffect(() => { listMethods().then(m => setMethods(m.methods)).catch(() => {}); }, []);

  const isPaused = settings.prayerPauseUntil && settings.prayerPauseUntil > Date.now();
  const pauseRemaining = isPaused ? formatPauseRemaining(settings.prayerPauseUntil! - Date.now()) : null;
  const canPause = user?.profile?.gender === 'female';

  const { times, dates, next: nextPrayer, loading, error } = useMawaqitTimes();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const methodLabel = (id: string) => methods.find(m => m.id === id)?.label ?? id;

  // Prières manquées
  const missed = useMemo(() => {
    if (!dates || !prayers) return [];
    const checked = prayers.checked;
    const n = Date.now();
    return PRAYER_ORDER.filter((key) => {
      const d = dates[key];
      return d && d.getTime() < n && !checked.includes(key);
    });
  }, [dates, prayers]);

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setMessage(null);
    setResults([]);
    try {
      const mosques = await searchMosques(q);
      setResults(mosques);
      if (mosques.length === 0) setMessage(t('prayer.mosqueNoResults'));
    } catch {
      setMessage(t('prayer.mosqueError'));
    } finally {
      setSearching(false);
    }
  };

  const selectMosque = (m: MawaqitMosque) => {
    setSettings((s) => ({
      ...s,
      mawaqitMosqueId: m.uuid,
      mawaqitMosqueName: m.name,
      mawaqitLatitude: m.latitude,
      mawaqitLongitude: m.longitude,
    }));
    setResults([]);
    setQuery('');
    setShowSearch(false);
  };

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-4 animate-fade-in">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-gold-400">{t('prayer.title')}</h2>
      </div>

      {/* Bannière pause */}
      {isPaused && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-amber-300">⏸️ {t('prayer.pause.active')}</p>
              <p className="mt-1 text-xs text-amber-400/80">{pauseRemaining}</p>
            </div>
            <button
              onClick={() => setPauseOpen(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/20"
            >
              🔄 {t('prayer.pause.resume')}
            </button>
          </div>
        </div>
      )}

      {/* Check-in salat */}
      {user && !isPaused && (
        <section className="card mb-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gold-400">🕌 {t('dashboard.salatCheckin')}</h3>
            {canPause && (
              <button
                onClick={() => setPauseOpen(true)}
                className="rounded-lg px-2 py-1 text-[10px] font-bold text-stone-500 transition hover:bg-stone-500/10 hover:text-stone-300"
                title={t('prayer.pause.button')}
              >
                ⏸️ {t('prayer.pause.button')}
              </button>
            )}
          </div>

          {missed.length > 0 && (
            <div className="mb-3 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                {t('prayer.missed')} :{' '}
                <strong>
                  {missed.map((k) => t(PRAYER_LABELS[k]).split(' ')[0]).join(', ')}
                </strong>
                {' '}— {t('prayer.missedHint')}
              </span>
            </div>
          )}

          <PrayerCircles
            prayers={prayers}
            missed={missed}
            onToggle={togglePrayer}
            timeOf={(key) => (dates ? (dates as Record<string, Date | undefined>)[key] ?? null : null)}
          />
        </section>
      )}
      {!user && (
        <section className="card mb-4 border-emerald-700/40 bg-emerald-900/20 p-3 text-center">
          <p className="text-xs text-stone-300">{t('dashboard.loginPrompt')}</p>
          <a href="/profile" className="btn-gold mt-2 inline-block text-xs">{t('profile.login')} / {t('profile.register')}</a>
        </section>
      )}

      {/* Horaires de prière */}
      {loading && <p className="text-center text-xs text-stone-500 py-4">⏳ {t('prayer.loading')}</p>}
      {error && <p className="text-center text-xs text-red-400 py-4">⚠️ {error}</p>}
      {times && (
        <>
          {nextPrayer && (
            <div className="card mb-4 border-gold-500/40 bg-gold-500/5 p-4 text-center shadow-glow">
              <p className="text-xs text-gold-400">{t('prayer.next')}</p>
              <p className="text-lg font-bold text-gold-300">
                {t(PRAYER_LABELS[nextPrayer.key] ?? nextPrayer.key)} — {nextPrayer.time}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((k) => (
              <div key={k} className="card p-3 text-center">
                <p className="text-xs text-stone-400">{t(PRAYER_LABELS[k])}</p>
                <p className="text-lg font-semibold">{(times as Record<string, string>)[k]}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] text-stone-500">
            🕌 {settings.mawaqitMosqueName ?? t('prayer.defaultCity')} · {methodLabel(settings.prayerMethod ?? 'uoif')}
          </p>
        </>
      )}

      {/* Sélection de la mosquée */}
      <div className="card mt-4 p-4 space-y-3">
        <h3 className="text-sm font-bold text-gold-400">🕌 {t('prayer.mosque')}</h3>

        {/* Mosquée actuelle */}
        {settings.mawaqitMosqueId && !showSearch ? (
          <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🕌</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-emerald-300">{settings.mawaqitMosqueName}</p>
              </div>
              <button
                onClick={() => setShowSearch(true)}
                className="shrink-0 rounded-lg border border-stone-700/50 px-2.5 py-1.5 text-[10px] text-stone-400 transition hover:border-gold-500/40 hover:text-gold-300"
              >
                {t('prayer.changeMosque')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-stone-400">{t('prayer.mosqueHint')}</p>
            <form onSubmit={onSearch} className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('prayer.mosquePlaceholder')}
                  className="input flex-1 text-xs"
                  dir="auto"
                  autoFocus
                />
                <button type="submit" disabled={searching || !query.trim()} className="btn-ghost shrink-0 text-xs">
                  {searching ? t('prayer.searching') : t('prayer.search')}
                </button>
              </div>
            </form>

            {results.length > 0 && (
              <ul className="space-y-1">
                {results.map((m) => (
                  <li key={m.uuid}>
                    <button
                      onClick={() => selectMosque(m)}
                      className="w-full rounded-xl border border-emerald-900/50 px-3 py-2 text-left transition hover:border-gold-500/60"
                    >
                      <p className="text-xs font-semibold text-stone-200">🕌 {m.name}</p>
                      <p className="mt-0.5 text-[10px] text-stone-500">
                        {[m.city, m.country].filter(Boolean).join(', ')}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {message && <p className="text-xs text-stone-400">{message}</p>}
          </div>
        )}

        {/* Méthode de calcul */}
        {methods.length > 0 && (
          <div className="pt-2 border-t border-stone-800/50">
            <label className="text-[10px] text-stone-500">{t('prayer.method')}</label>
            <select
              value={settings.prayerMethod ?? 'uoif'}
              onChange={(e) => setSettings((s) => ({ ...s, prayerMethod: e.target.value }))}
              className="input mt-1 w-full text-xs"
            >
              {methods.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Modal pause */}
      <PrayerPauseModal open={pauseOpen} onClose={() => setPauseOpen(false)} />
    </div>
  );
}

function formatPauseRemaining(ms: number): string {
  if (ms <= 0) return '0m';
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}