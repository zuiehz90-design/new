import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { searchCity, shortPlaceName, type GeocodeResult } from '../lib/geocode';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { useAuth } from '../context/AuthContext';
import { useDevotion } from '../hooks/useDevotion';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { PrayerCircles } from './PrayerCircles';
import { PrayerPauseModal } from './PrayerPauseModal';

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'prayer.fajr', sunrise: 'prayer.sunrise', dhuhr: 'prayer.dhuhr',
  asr: 'prayer.asr', maghrib: 'prayer.maghrib', isha: 'prayer.isha',
};

const PRAYER_METHODS: { id: string; label: string; make: () => ReturnType<typeof CalculationMethod.Other> }[] = [
  { id: 'aladhan-api', label: 'AlAdhan API (recommandé)', make: () => { const p = CalculationMethod.Other(); p.fajrAngle = 12; p.ishaAngle = 12; return p; } },
  { id: 'uoif', label: 'UOIF (France, 12°)', make: () => { const p = CalculationMethod.Other(); p.fajrAngle = 12; p.ishaAngle = 12; return p; } },
  { id: 'mosquee-paris', label: 'Mosquée de Paris (18°)', make: () => { const p = CalculationMethod.Other(); p.fajrAngle = 18; p.ishaAngle = 18; return p; } },
  { id: 'muslim-world-league', label: 'Muslim World League', make: () => CalculationMethod.MuslimWorldLeague() },
  { id: 'egyptian', label: 'Egyptian', make: () => CalculationMethod.Egyptian() },
  { id: 'karachi', label: 'Karachi', make: () => CalculationMethod.Karachi() },
  { id: 'umm-al-qura', label: 'Umm al-Qura', make: () => CalculationMethod.UmmAlQura() },
  { id: 'north-america', label: 'North America (ISNA)', make: () => CalculationMethod.NorthAmerica() },
  { id: 'moonsighting', label: 'Moonsighting Committee', make: () => CalculationMethod.MoonsightingCommittee() },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function PrayerView() {
  const { t } = useI18n();
  const { settings, setSettings } = useSettings();
  const { user } = useAuth();
  const { prayers, togglePrayer } = useDevotion();
  const { coords, error, loading, request, confirmCoords } = useGeolocation();
  const [now, setNow] = useState(Date.now());
  const [lat, setLat] = useState(coords?.lat?.toString() ?? '');
  const [lng, setLng] = useState(coords?.lng?.toString() ?? '');
  const [pauseOpen, setPauseOpen] = useState(false);

  // Vérifier si la pause est active
  const isPaused = settings.prayerPauseUntil && settings.prayerPauseUntil > Date.now();
  const pauseRemaining = isPaused ? formatPauseRemaining(settings.prayerPauseUntil! - Date.now()) : null;

  useEffect(() => {
    if (coords) {
      setLat(coords.lat.toString());
      setLng(coords.lng.toString());
    }
  }, [coords]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const manualCoords = useMemo(() => {
    const nlat = parseFloat(lat);
    const nlng = parseFloat(lng);
    if (isNaN(nlat) || isNaN(nlng) || nlat < -90 || nlat > 90 || nlng < -180 || nlng > 180) return null;
    return { lat: nlat, lng: nlng };
  }, [lat, lng]);

  const active = coords ?? manualCoords;
  const times = usePrayerTimes(active, settings.prayerMethod, now);

  // La pause des prières est disponible uniquement pour les femmes
  const canPause = user?.profile?.gender === 'female';

  const applyManual = () => {
    if (manualCoords) void confirmCoords(manualCoords);
  };

  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<GeocodeResult[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityMessage, setCityMessage] = useState<string | null>(null);

  const onCitySearch = async (e: FormEvent) => {
    e.preventDefault();
    const q = cityQuery.trim();
    if (!q || cityLoading) return;
    setCityLoading(true);
    setCityMessage(null);
    setCityResults([]);
    try {
      const results = await searchCity(q);
      setCityResults(results);
      if (results.length === 0) setCityMessage(t('prayer.noResults'));
    } catch {
      setCityMessage(t('prayer.searchError'));
    } finally {
      setCityLoading(false);
    }
  };

  const selectCity = (r: GeocodeResult) => {
    setCityResults([]);
    setCityQuery('');
    void confirmCoords({ lat: r.lat, lng: r.lng }, shortPlaceName(r.name));
  };

  const missed = useMemo(() => {
    if (!times || !prayers) return [];
    const checked = prayers.checked;
    const n = Date.now();
    const keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
    return keys.filter((key) => {
      const time = times.dates[key];
      return time && time.getTime() < n && !checked.includes(key);
    });
  }, [times, prayers]);

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-4 animate-fade-in">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-gold-400">{t('prayer.title')}</h2>
      </div>

      {/* Bannière de pause */}
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
                  Prières manquées :{' '}
                  <strong>
                    {missed.map((k) => t(PRAYER_LABELS[k as keyof typeof PRAYER_LABELS] ?? '').split(' ')[0]).join(', ')}
                  </strong>
                  {' '}— touchez pour rattraper
                </span>
              </div>
            )}

          <PrayerCircles
            prayers={prayers}
            missed={missed}
            onToggle={togglePrayer}
            timeOf={(key) => (times ? (times.dates as Record<string, Date | undefined>)[key] ?? null : null)}
          />
        </section>
      )}
      {!user && (
        <section className="card mb-4 border-emerald-700/40 bg-emerald-900/20 p-3 text-center">
          <p className="text-xs text-stone-300">{t('dashboard.loginPrompt')}</p>
          <a href="/profile" className="btn-gold mt-2 inline-block text-xs">{t('profile.login')} / {t('profile.register')}</a>
        </section>
      )}

      {/* Localisation */}
      <div className="card mb-4 p-4 space-y-3">
        <h3 className="text-sm font-bold text-gold-400">📍 {t('prayer.location')}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={request} disabled={loading} className="btn-primary text-xs">
            {loading ? t('prayer.geolocating') : t('prayer.geolocate')}
          </button>
        </div>
        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
            {error}
          </p>
        )}

        {/* Recherche par ville / code postal */}
        <form onSubmit={onCitySearch} className="space-y-2">
          <label className="block text-[10px] text-stone-500" htmlFor="city-search">{t('prayer.searchCity')}</label>
          <div className="flex gap-2">
            <input
              id="city-search"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder={t('prayer.cityPlaceholder')}
              className="input flex-1 text-xs"
              dir="auto"
            />
            <button type="submit" disabled={cityLoading || !cityQuery.trim()} className="btn-ghost shrink-0 text-xs">
              {cityLoading ? t('prayer.searching') : t('prayer.search')}
            </button>
          </div>
        </form>
        {cityResults.length > 0 && (
          <ul className="space-y-1" aria-label={t('prayer.results')}>
            {cityResults.map((r) => (
              <li key={r.lat + '-' + r.lng + '-' + r.name}>
                <button
                  onClick={() => selectCity(r)}
                  className="w-full rounded-xl border border-emerald-900/50 px-3 py-2 text-left text-xs text-stone-300 transition hover:border-gold-500/60 hover:text-gold-300"
                >
                  📍 {r.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {cityMessage && <p className="text-xs text-stone-400">{cityMessage}</p>}

        {/* Saisie manuelle avancée */}
        <details className="text-xs text-stone-400">
          <summary className="cursor-pointer select-none">{t('prayer.manual')}</summary>
          <div className="mt-2 flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-stone-500">{t('prayer.lat')}</label>
              <input value={lat} onChange={(e) => setLat(e.target.value)} className="input text-xs" placeholder="48.8566" inputMode="decimal" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-stone-500">{t('prayer.lng')}</label>
              <input value={lng} onChange={(e) => setLng(e.target.value)} className="input text-xs" placeholder="2.3522" inputMode="decimal" />
            </div>
            <button onClick={applyManual} className="btn-ghost mt-4 text-xs">{t('prayer.apply')}</button>
          </div>
        </details>
        {active && (
          <p className="text-xs text-stone-400">
            📍 {active.lat.toFixed(4)}, {active.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Méthode */}
      <div className="card mb-4 p-4">
        <label className="mb-1 block text-xs text-stone-500">{t('prayer.method')}</label>
        <select
          value={settings.prayerMethod}
          onChange={(e) => setSettings((s) => ({ ...s, prayerMethod: e.target.value }))}
          className="input text-xs"
        >
          {PRAYER_METHODS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {times && (
        <>
          {times.next && (
            <div className="card mb-4 border-gold-500/40 bg-gold-500/5 p-4 text-center shadow-glow">
              <p className="text-xs text-gold-400">{t('prayer.next')}</p>
              <p className="text-lg font-bold text-gold-300">{t(PRAYER_LABELS[times.next.key] ?? times.next.key)}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((k) => (
              <div key={k} className="card p-3 text-center">
                <p className="text-xs text-stone-400">{t(PRAYER_LABELS[k])}</p>
                <p className="text-lg font-semibold">{times[k]}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {!active && !loading && (
        <p className="text-center text-sm text-stone-500">{t('prayer.geoError')}</p>
      )}

      {/* Modal de pause */}
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
