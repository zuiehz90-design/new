/**
 * Compte à rebours de la prochaine prière.
 * Fonction pure : (cible, maintenant) -> { h, m, s }, borné à 0.
 */
export function countdownParts(target: number, now: number): { h: number; m: number; s: number } {
  const diff = Math.max(0, target - now);
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

