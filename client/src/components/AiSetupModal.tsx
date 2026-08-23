import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { useAiSetup } from '../hooks/useAiSetup';
import { useToast } from '../context/ToastContext';

const KEY_PATTERN = /^sk-or-v1-[A-Za-z0-9_-]+$/;

/**
 * Écran d'onboarding : demandé en premier lorsque l'IA n'est pas configurée.
 * Explique exactement comment obtenir une clé OpenRouter gratuite.
 */
export function AiSetupModal() {
  const { t } = useI18n();
  const { show: showToast } = useToast();
  const { show, check, saveKey, dismiss } = useAiSetup();
  const [key, setKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
      setError('');
      const id = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(id);
    }
  }, [show]);

  if (!show) return null;

  const submit = async () => {
    const trimmed = key.trim();
    setError('');
    if (!trimmed) {
      setError(t('aiSetup.enterKey'));
      return;
    }
    if (!KEY_PATTERN.test(trimmed)) {
      setError(t('aiSetup.invalidKey'));
      return;
    }
    setSaving(true);
    try {
      await saveKey(trimmed);
      showToast('✅', t('aiSetup.successTitle'), t('aiSetup.successSubtitle'), 'bg-emerald-600');
      void check();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const steps = [1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-night-950/85 p-4 backdrop-blur-sm">
      <div className="card max-h-[92dvh] w-full max-w-lg overflow-y-auto border-gold-500/30 bg-night-900 p-6 shadow-glow animate-fade-in">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-3xl">🔑</div>
          <h2 className="mt-3 text-xl font-bold text-gold-300">{t('aiSetup.title')}</h2>
          <p className="mt-1 text-sm text-stone-400">{t('aiSetup.subtitle')}</p>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          {t('aiSetup.stepsTitle')}
        </p>
        <ol className="mt-2 space-y-3">
          {steps.map((n) => (
            <li key={n} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                {n}
              </span>
              <p className="text-sm text-stone-300">{t('aiSetup.step' + n)}</p>
            </li>
          ))}
        </ol>

        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold mt-4 w-full text-sm"
        >
          {t('aiSetup.openSite')} ↗
        </a>

        <div className="mt-4">
          <input
            ref={inputRef}
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={t('aiSetup.placeholder')}
            className="input w-full text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          <button onClick={submit} disabled={saving} className="btn-primary mt-2 w-full text-sm">
            {saving ? t('aiSetup.activating') : t('aiSetup.activate')}
          </button>
          <p className="mt-2 text-center text-[10px] text-stone-500">{t('aiSetup.privacy')}</p>
        </div>

        <button onClick={dismiss} className="btn-ghost mt-3 w-full text-xs text-stone-400">
          {t('aiSetup.skip')}
        </button>
      </div>
    </div>
  );
}
