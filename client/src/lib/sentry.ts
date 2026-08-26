/**
 * Sentry Free error tracking — initialisation lazy en production uniquement.
 *
 * La DSN est lue depuis la variable d'environnement VITE_SENTRY_DSN.
 * Si elle n'est pas définie, Sentry n'est pas initialisé (aucun impact en dev).
 *
 * L'import est 100 % dynamique : @sentry/react n'est chargé que si une DSN est
 * configurée, ce qui permet de garder la dépendance optionnelle et de ne jamais
 * la télécharger tant qu'elle n'est pas utilisée.
 */

let initialized = false;

interface SentryLike {
  init(options: {
    dsn: string;
    environment?: string;
    tracesSampleRate?: number;
    enabled?: boolean;
    beforeSend?(event: unknown): unknown;
  }): void;
}

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return; // Pas de DSN → pas de Sentry

  // Import dynamique pour ne charger Sentry que lorsqu'une DSN existe.
  // @sentry/react est une dépendance optionnelle : si elle manque, l'erreur est avalée.
  // @ts-ignore — module optionnel non déclaré tant que la DSN n'est pas configurée
  import(/* @vite-ignore */ '@sentry/react')
    .then((module) => {
      const Sentry = module as unknown as { init: SentryLike['init'] };
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        // tracesSampleRate: 0.1 = 10 % des transactions (gratuit)
        tracesSampleRate: 0.1,
        // Ne pas envoyer les erreurs du développement local
        enabled: import.meta.env.PROD,
        // Filtrer les erreurs non pertinentes
        beforeSend(event: unknown) {
          const typed = event as { exception?: { values?: Array<{ type?: string; value?: string }> } };
          const first = typed.exception?.values?.[0];
          if (first?.type === 'TypeError' && first.value?.includes('fetch')) {
            return null;
          }
          return event;
        },
      });
      console.log('[Sentry] initialized');
    })
    .catch(() => {
      // Sentry n'est pas critique — si l'import échoue, on continue.
    });
}
