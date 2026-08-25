import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { fetchModels, fetchHealth, type ModelOption } from '../lib/api';
import { RECITERS } from '../lib/quran';
import { getPrefs, setPrefs, permissionState, requestPermission, type NotificationPrefs } from '../lib/notifications';

const LANGUAGES = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { settings, setSettings } = useSettings();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => getPrefs());

  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetchHealth().then((h) => alive && setAiConfigured(h?.aiConfigured ?? false));
    setNotifPrefs(getPrefs());
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

          {/* Préférences de notification par type */}
          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('notif.sectionTitle')}</label>
            <div className="card p-3 space-y-2" style={{ background: 'var(--bg-card)' }}>
              {permissionState() === 'granted' ? (
                <p className="text-[11px] font-semibold text-emerald-400">✅ {t('notif.permissionGranted')}</p>
              ) : permissionState() === 'denied' ? (
                <p className="text-[11px] font-semibold text-red-400">⛔ {t('notif.permissionDenied')}</p>
              ) : (
                <button
                  onClick={async () => { await requestPermission(); setNotifPrefs(getPrefs()); }}
                  className="chip w-full justify-center text-xs"
                >
                  🔔 {t('notif.enableButton')}
                </button>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ['prayer', '🕌', t('notif.type.prayer')],
                  ['quest', '⚔️', t('notif.type.quest')],
                  ['badge', '🏅', t('notif.type.badge')],
                  ['rank', '🏆', t('notif.type.rank')],
                  ['dailyVerse', '📖', t('notif.type.dailyVerse')],
                  ['dhikr', '📿', t('notif.type.dhikr')],
                  ['sleep', '🌙', t('notif.type.sleep')],
                  ['streak', '🔥', t('notif.type.streak')],
                ] as [keyof NotificationPrefs, string, string][]).map(([key, icon, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      const next = { ...notifPrefs, [key]: !notifPrefs[key] };
                      setNotifPrefs(next);
                      setPrefs({ [key]: !notifPrefs[key] });
                    }}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition"
                    style={{
                      border: '1px solid',
                      borderColor: notifPrefs[key] ? 'rgba(207, 161, 74, 0.4)' : 'rgba(255,255,255,0.1)',
                      background: notifPrefs[key] ? 'rgba(207, 161, 74, 0.08)' : 'transparent',
                      color: notifPrefs[key] ? 'var(--accent-gold)' : 'var(--text-tertiary)',
                    }}
                  >
                    <span className="text-base shrink-0">{icon}</span>
                    <span className="flex-1 min-w-0 truncate">{label}</span>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: notifPrefs[key] ? 'var(--accent-gold)' : 'rgba(255,255,255,0.15)' }} />
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const next = { ...notifPrefs, sound: !notifPrefs.sound };
                  setNotifPrefs(next);
                  setPrefs({ sound: next.sound });
                }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs transition"
                style={{
                  background: notifPrefs.sound ? 'rgba(207, 161, 74, 0.08)' : 'rgba(255,255,255,0.03)',
                  color: notifPrefs.sound ? 'var(--accent-gold)' : 'var(--text-tertiary)',
                }}
              >
                <span className="flex items-center gap-2">🔊 {t('notif.sound')}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: notifPrefs.sound ? 'var(--accent-gold)' : 'rgba(255,255,255,0.15)' }} />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('settings.focusMode')}</label>
            <button
              onClick={() => setSettings((s) => ({ ...s, focusMode: !s.focusMode }))}
              className={`chip ${settings.focusMode ? '!border-gold-500/70 !text-gold-300' : ''}`}
            >
              {settings.focusMode ? '🧘 Activé' : '🧘 Désactivé'}
            </button>
            <p className="mt-1 text-[11px] text-stone-500">{t('settings.focusModeHint')}</p>
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
