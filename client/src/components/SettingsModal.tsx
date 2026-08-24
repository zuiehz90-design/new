import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { fetchModels, fetchHealth, type ModelOption } from '../lib/api';
import { RECITERS } from '../lib/quran';

const LANGUAGES = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

const PRAYER_METHODS = [
  { id: 'uoif', label: 'UOIF (France, 12°)' },
  { id: 'mosquee-paris', label: 'Mosquée de Paris (18°)' },
  { id: 'muslim-world-league', label: 'Muslim World League' },
  { id: 'egyptian', label: 'Egyptian' },
  { id: 'karachi', label: 'Karachi' },
  { id: 'umm-al-qura', label: 'Umm al-Qura' },
  { id: 'north-america', label: 'North America (ISNA)' },
  { id: 'moonsighting', label: 'Moonsighting Committee' },
];

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { settings, setSettings } = useSettings();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetchHealth().then((h) => alive && setAiConfigured(h?.aiConfigured ?? false));
    fetchModels().then((m) => alive && setModels(m));
    return () => {
      alive = false;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[85vh] w-full max-w-md overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gold-400">⚙️ {t('settings.title')}</h2>
          <button onClick={onClose} className="btn-ghost text-xs">✕ {t('settings.close')}</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('settings.language')}</label>
            <select
              value={settings.lang}
              onChange={(e) => setSettings((s) => ({ ...s, lang: e.target.value as typeof settings.lang }))}
              className="input text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('settings.theme')}</label>
            <div className="flex gap-2">
              <button onClick={() => setSettings((s) => ({ ...s, theme: 'dark' }))} className={`chip ${settings.theme === 'dark' ? '!border-gold-500/60 !text-gold-300' : ''}`}>
                🌙 {t('settings.dark')}
              </button>
              <button onClick={() => setSettings((s) => ({ ...s, theme: 'light' }))} className={`chip ${settings.theme === 'light' ? '!border-gold-500/60 !text-gold-300' : ''}`}>
                ☀️ {t('settings.light')}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('settings.translation')}</label>
            <select
              value={settings.translation}
              onChange={(e) => setSettings((s) => ({ ...s, translation: e.target.value as 'fr' | 'en' }))}
              className="input text-sm"
            >
              <option value="fr">Français (Hamidullah)</option>
              <option value="en">English (Abdel Haleem)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('settings.reciter')}</label>
            <select
              value={settings.reciter}
              onChange={(e) => setSettings((s) => ({ ...s, reciter: e.target.value }))}
              className="input text-sm"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('settings.prayerMethod')}</label>
            <select
              value={settings.prayerMethod}
              onChange={(e) => setSettings((s) => ({ ...s, prayerMethod: e.target.value }))}
              className="input text-sm"
            >
              {PRAYER_METHODS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('prayer.notifications')}</label>
            <button
              onClick={async () => {
                const enabled = !settings.prayerNotifications;
                if (enabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                  await Notification.requestPermission();
                }
                setSettings((s) => ({ ...s, prayerNotifications: enabled }));
              }}
              className={`chip ${settings.prayerNotifications ? '!border-gold-500/70 !text-gold-300' : ''}`}
            >
              {settings.prayerNotifications ? '🔔 Activées' : '🔕 Désactivées'}
            </button>
            {settings.prayerNotifications && typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
              <p className="mt-1 text-[11px] text-red-400">{t('prayer.notifPermission')}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('settings.model')}</label>
            <select
              value={settings.model}
              onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
              className="input text-sm"
            >
              {models.length > 0 ? (
                models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))
              ) : (
                <option value="openrouter/free">openrouter/free</option>
              )}
            </select>
            <p className="mt-1 text-[11px] text-stone-500">{t('settings.modelNote')}</p>
            {aiConfigured === false && (
              <p className="mt-1 text-[11px] text-red-400">
                ⚠️ Aucune clé IA n’est associée à ce compte. Ajoutez votre clé OpenRouter pour activer les réponses personnalisées.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
