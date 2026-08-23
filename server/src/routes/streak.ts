import { db } from '../db.js';

export function toLocalDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Compte le streak courant et le meilleur à partir des jours « actifs »
 * (au moins 1 prière cochée dans la journée). Logique pure et testable.
 */
export function streakFromActiveDays(
  activeDays: ReadonlySet<string>,
  today: string,
): { current: number; best: number } {
  const todayDate = new Date(today + 'T00:00:00');

  // Meilleure série : on parcourt tous les jours (ne pas s'arrêter à la première coupure)
  let best = 0;
  let run = 0;
  for (let i = 0; i < 1000; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    if (activeDays.has(toLocalDate(d))) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  // Série actuelle : jours actifs consécutifs en partant d'aujourd'hui.
  // Si aujourd'hui n'a encore aucune prière cochée, la journée n'est pas finie :
  // on part d'hier pour ne pas casser la série à tort.
  let current = 0;
  const start = activeDays.has(today) ? 0 : 1;
  for (let i = start; i < 1000; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    if (activeDays.has(toLocalDate(d))) current++;
    else break;
  }

  return { current, best };
}

/** Série de jours « complets » (5/5 prières cochées) — pour les badges exigeants. */
export function computeFullDayStreak(userId: number, today: string): number {
  const rows = db
    .prepare('SELECT date, COUNT(DISTINCT prayer) as n FROM prayers WHERE user_id = ? GROUP BY date')
    .all(userId) as { date: string; n: number }[];
  const full = new Set(rows.filter((r) => r.n >= 5).map((r) => r.date));
  const todayDate = new Date(today + 'T00:00:00');
  let current = 0;
  for (let i = 0; i < 1000; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    if (full.has(toLocalDate(d))) current++;
    else break;
  }
  return current;
}

/** Nombre total de journées « complètes » (5/5 prières) jamais réalisées. */
export function countFullDays(userId: number): number {
  const rows = db
    .prepare('SELECT date, COUNT(DISTINCT prayer) as n FROM prayers WHERE user_id = ? GROUP BY date')
    .all(userId) as { date: string; n: number }[];
  return rows.filter((r) => r.n >= 5).length;
}

/** Streak d'un utilisateur depuis la table prayers (source de vérité). */
export function computeStreak(userId: number, today: string): { current: number; best: number } {
  const rows = db
    .prepare('SELECT date, COUNT(DISTINCT prayer) as n FROM prayers WHERE user_id = ? GROUP BY date')
    .all(userId) as { date: string; n: number }[];
  const active = new Set(rows.filter((r) => r.n >= 1).map((r) => r.date));
  return streakFromActiveDays(active, today);
}
