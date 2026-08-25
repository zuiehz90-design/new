/**
 * Sentry Free error tracking — initialisation lazy en production uniquement.
 *
 * Utilisation :
 *   import { initSentry } from './lib/sentry';
 *   initSentry(); // au démarrage de l'app, dans main.tsx
 *
 * La DSN est lue depuis la variable d'environnement VITE_SENTRY_DSN.
 * Si elle n'est pas définie, Sentry n'est pas initialisé (aucun impact en dev).
 */

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return; // Pas de DSN → pas de Sentry

  // Import dynamique pour ne charger Sentry que en production
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      // TracesSamplesRate: 0.1 = 10% des transactions (gratuit)
      tracesSampleRate: 0.1,
      // Ne pas envoyer les erreurs du développement local
      enabled: import.meta.env.PROD,
      // Filtrer les erreurs non pertinentes
      beforeSend(event) {
        // Ignorer les erreurs de réseau (CORS, offline)
        if (event.exception?.values?.[0]?.type === 'TypeError' &&
            event.exception.values[0].value?.includes('fetch')) {
          return null;
        }
        return event;
      },
    });
    console.log('[Sentry] initialized');
  }).catch(() => {
    // Sentry n'est pas critique — si l'import échoue, on continue
  });
}
