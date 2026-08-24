import { useState } from 'react';
import { useI18n } from '../i18n';
import { useSettings } from '../context/SettingsContext';

const PAUSE_OPTIONS = [
  { label: '1 heure', ms: 60 * 60 * 1000 },
  { label: '3 heures', ms: 3 * 60 * 60 * 1000 },
  { label: 'Jusqu\'à demain matin', ms: getUntilTomorrow() },
  { label: 'Jusqu\'à dimanche', ms: getUntilSunday() },
  { label: '1 semaine', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '2 semaines', ms: 14 * 24 * 60 * 60 * 1000 },
  { label: '1 mois', ms: 30 * 24 * 60 * 60 * 1000 },
];

function getUntilTomorrow(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(6, 0, 0, 0); // 6h du matin
  return tomorrow.getTime() - now.getTime();
}

function getUntilSunday(): number {
  const now = new Date();
  const sunday = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  sunday.setDate(sunday.getDate() + daysUntilSunday);
  sunday.setHours(6, 0, 0, 0);
  return sunday.getTime() - now.getTime();
}

export function PrayerPauseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { settings, setSettings } = useSettings();
  const [customDays, setCustomDays] = useState('');

  if (!open) return null;

  const isPaused = settings.prayerPauseUntil && settings.prayerPauseUntil > Date.now();
  const remaining = isPaused ? formatRemaining(settings.prayerPauseUntil! - Date.now()) : null;

  const setPause = (ms: number) => {
    setSettings((s) => ({ ...s, prayerPauseUntil: Date.now() + ms }));
    onClose();
  };

  const cancelPause = () => {
    setSettings((s) => ({ ...s, prayerPauseUntil: null }));
    onClose();
  };

  const setCustomPause = () => {
    const days = parseInt(customDays, 10);
    if (isNaN(days) || days <= 0) return;
    setPause(days * 24 * 60 * 60 * 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-sm p-5 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gold-400">⏸️ {t('prayer.pause.title')}</h2>
          <button onClick={onClose} className="btn-ghost text-xs">✕</button>
        </div>

        {isPaused ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
              <p className="text-sm text-amber-300">⏸️ {t('prayer.pause.active')}</p>
              <p className="mt-1 text-lg font-bold text-amber-200">{remaining}</p>
              <p className="mt-1 text-xs text-amber-400/70">
                {t('prayer.pause.until')} {new Date(settings.prayerPauseUntil!).toLocaleString()}
              </p>
            </div>
            <button
              onClick={cancelPause}
              className="w-full rounded-xl border border-red-500/40 bg-red-500/10 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
            >
              🔄 {t('prayer.pause.resume')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-stone-400">{t('prayer.pause.description')}</p>
            
            <div className="space-y-2">
              {PAUSE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setPause(opt.ms)}
                  className="w-full rounded-xl border border-emerald-900/40 px-4 py-2.5 text-left text-sm transition hover:border-gold-500/50 hover:bg-gold-500/5"
                >
                  <span className="text-stone-300">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-white/10 pt-3">
              <p className="mb-2 text-xs text-stone-500">{t('prayer.pause.custom')}</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="7"
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={setCustomPause}
                  disabled={!customDays || parseInt(customDays, 10) <= 0}
                  className="btn-primary shrink-0 text-sm"
                >
                  {t('prayer.pause.customDays')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0m';
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
