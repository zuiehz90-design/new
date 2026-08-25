import { useCallback, useRef } from 'react';
import { apiPrayers, apiQuests } from '../lib/api';

/**
 * Pré-fetch des données de page au survol des liens de navigation.
 * Utilise requestIdleCallback pour ne jamais impacter la performance principale.
 * Les données sont mises en cache côté client (mobileCache / localStorage)
 * donc le pré-fetch est utile pour les premières visites.
 */

type PrefetchFn = () => Promise<unknown>;

const prefetchers: Record<string, PrefetchFn> = {
  '/prayer': () => apiPrayers(),
  '/quests': () => apiQuests(),
};

const prefetched = new Set<string>();

export function usePrefetch() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePrefetch = useCallback((path: string) => {
    // Ne pas pré-fetch si déjà fait ou si pas de prefetcher
    if (prefetched.has(path) || !prefetchers[path]) return;

    // Debounce : ne prefetch que si le survol dure > 100ms
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const run = () => {
        prefetched.add(path);
        prefetchers[path]().catch(() => {});
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(run, { timeout: 2000 });
      } else {
        // Fallback pour navigateurs sans requestIdleCallback
        setTimeout(run, 0);
      }
    }, 100);
  }, []);

  const cancelPrefetch = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { schedulePrefetch, cancelPrefetch };
}
