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

/** Rendu texte du compte à rebours (ex. « 1h 04m 33s », « 04m 33s » sans heures). */
export function formatCountdown(p: { h: number; m: number; s: number }): string {
  const mm = p.m.toString().padStart(2, '0');
  const ss = p.s.toString().padStart(2, '0');
  return p.h > 0 ? `${p.h}h ${mm}m ${ss}s` : `${mm}m ${ss}s`;
}
