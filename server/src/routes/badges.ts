export type BadgeLevel = 'bronze' | 'silver' | 'gold';

export interface BadgeTier {
  level: BadgeLevel;
  threshold: number;
}

export interface BadgeFamily {
  id: string;
  name: string;
  icon: string;
  description: string;
  tiers: BadgeTier[];
}

/**
 * Familles de badges à 3 niveaux (Bronze / Argent / Or).
 * Chaque famille suit un compteur monotone : un badge obtenu le reste.
 */
export const BADGE_FAMILIES: BadgeFamily[] = [
  {
    id: 'salat',
    name: 'Salat',
    icon: '🕌',
    description: 'Prières cochées au total',
    tiers: [
      { level: 'bronze', threshold: 1 },
      { level: 'silver', threshold: 50 },
      { level: 'gold', threshold: 200 },
    ],
  },
  {
    id: 'five',
    name: 'Les 5 piliers',
    icon: '⭐',
    description: 'Journées complètes (5/5)',
    tiers: [
      { level: 'bronze', threshold: 1 },
      { level: 'silver', threshold: 7 },
      { level: 'gold', threshold: 30 },
    ],
  },
  {
    id: 'streak',
    name: 'Série',
    icon: '🔥',
    description: 'Meilleure série de jours consécutifs',
    tiers: [
      { level: 'bronze', threshold: 7 },
      { level: 'silver', threshold: 30 },
      { level: 'gold', threshold: 100 },
    ],
  },
  {
    id: 'quests',
    name: 'Quêtes',
    icon: '⚔️',
    description: 'Quêtes complétées',
    tiers: [
      { level: 'bronze', threshold: 1 },
      { level: 'silver', threshold: 10 },
      { level: 'gold', threshold: 50 },
    ],
  },
  {
    id: 'rank',
    name: 'Rangs',
    icon: '🌱',
    description: 'Atteindre un palier de rang (promotion)',
    tiers: [
      { level: 'bronze', threshold: 180 },
      { level: 'silver', threshold: 450 },
      { level: 'gold', threshold: 950 },
    ],
  },
  {
    id: 'stories',
    name: 'Connaisseur historique',
    icon: '📜',
    description: 'Histoires de prophètes terminées (quiz réussi)',
    tiers: [
      { level: 'bronze', threshold: 3 },
      { level: 'silver', threshold: 6 },
      { level: 'gold', threshold: 12 },
    ],
  },
];

export function badgeId(family: string, level: BadgeLevel): string {
  return family + '_' + level;
}

/** Compteurs monotones de progression (source de vérité des badges). */
export interface BadgeProgress {
  points: number;
  totalPrayers: number;
  fullDays: number;
  streakBest: number;
  questsDone: number;
  storiesDone: number;
}

export interface BadgeInputs extends BadgeProgress {
  existing: ReadonlySet<string>;
}

/** Valeur de progression d'une famille à partir de l'état courant. */
export function familyProgress(i: BadgeProgress, familyId: string): number {
  switch (familyId) {
    case 'salat':
      return i.totalPrayers;
    case 'five':
      return i.fullDays;
    case 'streak':
      return i.streakBest;
    case 'quests':
      return i.questsDone;
    case 'rank':
      return i.points;
    case 'stories':
      return i.storiesDone;
    default:
      return 0;
  }
}

/**
 * Détermine les badges (famille + niveau) à débloquer à partir de l'état courant.
 * Logique pure et testable (aucune dépendance à la base).
 */
export function computeNewBadges(i: BadgeInputs): string[] {
  const unlocked: string[] = [];
  for (const family of BADGE_FAMILIES) {
    const progress = familyProgress(i, family.id);
    for (const tier of family.tiers) {
      const id = badgeId(family.id, tier.level);
      if (progress >= tier.threshold && !i.existing.has(id)) unlocked.push(id);
    }
  }
  return unlocked;
}
