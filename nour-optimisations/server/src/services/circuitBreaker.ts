/**
 * Circuit Breaker pour OpenRouter.
 * 
 * États :
 *   CLOSED  → fonctionnement normal
 *   OPEN    → trop d'erreurs, on ne tente plus d'appels
 *   HALF_OPEN → test de récupération (1 requête de test)
 * 
 * Seuil : 5 erreurs consécutives → OPEN pendant 60s
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

const FAILURE_THRESHOLD = 5;
const OPEN_TIMEOUT_MS = 60_000; // 1 minute

let state: CircuitState = 'CLOSED';
let failureCount = 0;
let lastFailureAt = 0;
let totalTrips = 0;

/** Vérifie si l'appel est autorisé */
export function canCall(): boolean {
  if (state === 'CLOSED') return true;

  if (state === 'OPEN') {
    // Vérifier si le timeout est dépassé → passer en HALF_OPEN
    if (Date.now() - lastFailureAt > OPEN_TIMEOUT_MS) {
      state = 'HALF_OPEN';
      return true; // Autoriser 1 requête de test
    }
    return false;
  }

  // HALF_OPEN : autoriser une seule requête de test
  return true;
}

/** Appeler quand un appel réussit */
export function recordSuccess(): void {
  if (state === 'HALF_OPEN') {
    // Récupération réussie → revenir en CLOSED
    state = 'CLOSED';
    failureCount = 0;
    console.log(JSON.stringify({ t: new Date().toISOString(), level: 'info', msg: 'Circuit breaker: recovered → CLOSED' }));
  } else {
    failureCount = 0; // Reset le compteur en cas de succès
  }
}

/** Appeler quand un appel échoue */
export function recordFailure(): void {
  failureCount++;
  lastFailureAt = Date.now();

  if (state === 'HALF_OPEN') {
    // Le test de récupération a échoué → retour en OPEN
    state = 'OPEN';
    totalTrips++;
    console.log(JSON.stringify({ t: new Date().toISOString(), level: 'warn', msg: `Circuit breaker: half-open failed → OPEN (trip #${totalTrips})` }));
  } else if (failureCount >= FAILURE_THRESHOLD) {
    state = 'OPEN';
    totalTrips++;
    console.log(JSON.stringify({ t: new Date().toISOString(), level: 'warn', msg: `Circuit breaker: ${failureCount} failures → OPEN (trip #${totalTrips})` }));
  }
}

/** État actuel (pour health check) */
export function getStatus(): { state: CircuitState; failures: number; trips: number; openSince: number | null } {
  return {
    state,
    failures: failureCount,
    trips: totalTrips,
    openSince: state === 'OPEN' ? lastFailureAt : null,
  };
}

/** Reset manuel (pour debug) */
export function reset(): void {
  state = 'CLOSED';
  failureCount = 0;
  totalTrips = 0;
}
