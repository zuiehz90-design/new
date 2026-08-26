/**
 * Répétition espacée pour les 99 Noms d'Allah.
 *
 * Chaque nom traverse des paliers dont l'intervalle de révision grandit avec
 * la réussite : nouveau → 1 jour → 3 jours → 7 jours → 14 jours → 30 jours → maîtrisé.
 *
 * La notation est simple :
 *  - "again" : le nom est oublié → on redescend d'un palier ;
 *  - "good"  : le nom est connu → on monte d'un palier ;
 *  - "easy"  : le nom est très facile → on monte de deux paliers.
 *
 * Le module est pur (aucune dépendance au DOM/localStorage) : les fonctions
 * manipulent un état sérialisable, le composant se charge de le persister.
 */

export type ReviewRating = 'again' | 'good' | 'easy';

export interface NameSrsState {
  /** Palier courant : 0 = nouveau, 1..5 = en apprentissage, 6 = maîtrisé. */
  level: number;
  /** Timestamp (ms) de la prochaine révision. 0 = dû immédiatement. */
  dueAt: number;
  /** Nombre total de révisions effectuées. */
  reviews: number;
  /** Nombre de fois où le nom a été « oublié ». */
  lapses: number;
}

/** État complet, indexé par position dans NAMES_99. */
export type NamesSrsStore = Record<number, NameSrsState>;

export const SRS_VERSION = 1;
export const MASTERED_LEVEL = 6;

const INTERVAL_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

export function intervalDaysForLevel(level: number): number | null {
  return INTERVAL_DAYS[level] ?? null;
}

export function isMastered(state: NameSrsState | undefined): boolean {
  return (state?.level ?? 0) >= MASTERED_LEVEL;
}

/** Un nom est dû s'il n'a jamais été revu, ou si sa date de révision est passée. */
export function isDue(state: NameSrsState | undefined, now: number = Date.now()): boolean {
  if (!state) return true;
  if (isMastered(state)) return false;
  return state.dueAt <= now;
}

export function emptyStore(): NamesSrsStore {
  return {};
}

/**
 * Applique une notation et retourne le nouvel état du nom.
 * `previous` est undefined pour un nom jamais revu (palier 0).
 */
export function applyRating(
  previous: NameSrsState | undefined,
  rating: ReviewRating,
  now: number = Date.now(),
): NameSrsState {
  const currentLevel = previous?.level ?? 0;
  const reviews = (previous?.reviews ?? 0) + 1;
  const lapses = (previous?.lapses ?? 0) + (rating === 'again' ? 1 : 0);

  let level: number;
  if (rating === 'again') level = Math.max(1, currentLevel - 1);
  else if (rating === 'easy') level = Math.min(MASTERED_LEVEL, currentLevel + 2);
  else level = Math.min(MASTERED_LEVEL, currentLevel + 1);

  const days = intervalDaysForLevel(level);
  return {
    level,
    dueAt: days === null ? 0 : now + days * 86_400_000,
    reviews,
    lapses,
  };
}

/** Indices des noms à réviser, dans l'ordre de leur prochaine échéance. */
export function dueNameIndexes(store: NamesSrsStore, total: number, now: number = Date.now()): number[] {
  const due: number[] = [];
  for (let i = 0; i < total; i += 1) {
    if (isDue(store[i], now)) due.push(i);
  }
  return due.sort((a, b) => (store[a]?.dueAt ?? 0) - (store[b]?.dueAt ?? 0));
}

export function masteredCount(store: NamesSrsStore, total: number): number {
  let count = 0;
  for (let i = 0; i < total; i += 1) {
    if (isMastered(store[i])) count += 1;
  }
  return count;
}

/** Nombre de noms déjà vus au moins une fois (appris ou en cours). */
export function seenCount(store: NamesSrsStore, total: number): number {
  let count = 0;
  for (let i = 0; i < total; i += 1) {
    if ((store[i]?.reviews ?? 0) > 0) count += 1;
  }
  return count;
}

/** Libellé lisible de l'échéance pour l'interface. */
export function nextReviewLabel(level: number): string {
  const days = intervalDaysForLevel(level);
  if (days === null) return '—';
  return days === 1 ? '1 jour' : `${days} jours`;
}
