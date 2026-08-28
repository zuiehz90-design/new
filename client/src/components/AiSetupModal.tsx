import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { useAiSetup } from '../hooks/useAiSetup';
import { useToast } from '../context/ToastContext';

/**
 * Ã‰cran d'onboarding : demandÃ© en premier lorsque l'IA n'est pas configurÃ©e.
 * Explique exactement comment obtenir une clÃ© OpenRouter gratuite.
 */
export function AiSetupModal() {
  const { t } = useI18n();
  const { show: showToast } = useToast();
  const { show, check, dismiss } = useAiSetup();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!show) return;
    const id = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(id);
  }, [show]);

  if (!show) return null;

  useEffect(() => {
    if (show) void check();
  }, [show, check]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-night-950/85 p-4 backdrop-blur-sm">
      <div className="card max-h-[92dvh] w-full max-w-lg overflow-y-auto border-gold-500/30 bg-night-900 p-6 shadow-glow animate-fade-in">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-3xl">ðŸ”‘</div>
          <h2 className="mt-3 text-xl font-bold text-gold-300">{t('aiSetup.title')}</h2>
          <p className="mt-1 text-sm text-stone-400">{t('aiSetup.subtitle')}</p>
        </div>

        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <p className="text-sm font-semibold text-emerald-300">Clé serveur uniquement</p>
          <p className="mt-2 text-xs leading-relaxed text-stone-400">Aucune clé personnelle n’est demandée ni stockée dans votre compte. Si le chat affiche une erreur, l’administrateur doit vérifier la variable <code className="text-gold-300">OPENROUTER_API_KEY</code> du serveur.</p>
        </div>

        <button onClick={dismiss} className="btn-ghost mt-1 w-full text-xs text-stone-500">
          {t('aiSetup.skip')}
        </button>
      </div>
    </div>
  );
}
