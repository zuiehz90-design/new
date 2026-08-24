import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from './auth.js';
import { prayerDayRows, streakFromActiveDays, toLocalDate } from './streak.js';
import { computeNewBadges, BADGE_FAMILIES, badgeId, familyProgress, type BadgeInputs } from './badges.js';

export const achievementsRouter = Router();

interface Rank {
  id: string;
  tier: string;
  division: number | null;
  name: string;
  min: number;
  icon: string;
  color: string;
}

/**
 * Rangs façon jeu vidéo : 6 paliers (Bronze → Légende) divisés en 3 divisions
 * (3 = plus bas, 1 = plus haut). Les seuils croissent de plus en plus vite :
 * chaque palier demande plus de points que le précédent.
 */
const RANK_TIERS = [
  { tier: 'Bronze', icon: '🥉', color: 'text-amber-500' },
  { tier: 'Argent', icon: '🥈', color: 'text-stone-300' },
  { tier: 'Or', icon: '🥇', color: 'text-gold-400' },
  { tier: 'Platine', icon: '💠', color: 'text-cyan-300' },
  { tier: 'Diamant', icon: '💎', color: 'text-sky-300' },
];
const RANK_THRESHOLDS = [0, 50, 110, 180, 260, 350, 450, 580, 740, 950, 1250, 1650, 2200, 3000, 4200];

const RANKS: Rank[] = RANK_TIERS.flatMap((t, ti) =>
  [3, 2, 1].map((div, di) => ({
    id: t.tier.toLowerCase() + '_' + div,
    tier: t.tier,
    division: div,
    name: t.tier + ' ' + div,
    min: RANK_THRESHOLDS[ti * 3 + di] ?? RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1],
    icon: t.icon,
    color: t.color,
  }))
);
RANKS.push({ id: 'legende', tier: 'Légende', division: null, name: 'Légende', min: 6000, icon: '👑', color: 'text-yellow-300' });

export function getRank(points: number): Rank {
  return RANKS.reduce((acc, r) => (points >= r.min ? r : acc), RANKS[0]);
}

interface RankProgress {
  current: number;
  next: number | null;
  pct: number;
  pointsInto: number;
  pointsNeeded: number;
  maxed: boolean;
}

function computeRankProgress(points: number, rank: Rank): RankProgress {
  const idx = RANKS.findIndex((r) => r.id === rank.id);
  const next = RANKS[idx + 1] ?? null;
  if (!next) {
    return { current: points, next: null, pct: 100, pointsInto: points - rank.min, pointsNeeded: 0, maxed: true };
  }
  const pointsInto = Math.max(0, points - rank.min);
  const span = next.min - rank.min;
  return {
    current: points,
    next: next.min,
    pct: Math.min(100, Math.round((pointsInto / span) * 100)),
    pointsInto,
    pointsNeeded: Math.max(0, next.min - points),
    maxed: false,
  };
}


achievementsRouter.get('/ranks/distribution', authMiddleware, (req: any, res) => {
  try {
    // Calcule la distribution des rangs parmi tous les utilisateurs (hors fantomes).
    const users = db.prepare('SELECT id, is_anonymous FROM users WHERE is_anonymous = 0').all() as { id: number; is_anonymous: number }[];
    const dist: Record<string, number> = {};
    for (const r of RANKS) dist[r.id] = 0;
    let total = 0;
    for (const u of users) {
      const pts = userPoints(u.id);
      const rank = getRank(pts);
      dist[rank.id] = (dist[rank.id] ?? 0) + 1;
      total++;
    }
    const result = RANKS.map(r => ({
      id: r.id,
      tier: r.tier,
      division: r.division,
      name: r.name,
      min: r.min,
      icon: r.icon,
      color: r.color,
      count: dist[r.id] ?? 0,
      pct: total > 0 ? Math.round(((dist[r.id] ?? 0) / total) * 100) : 0,
    }));
    res.json({ ranks: result, total });
  } catch (err: any) {
    console.error('Rank distribution error:', err?.message ?? err);
    res.status(500).json({ error: 'Erreur distribution: ' + (err?.message ?? String(err)) });
  }
});

achievementsRouter.get('/', authMiddleware, (req: any, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) { res.status(401).json({ error: 'Non autorisé.' }); return; }
    // Calcule les statistiques une fois puis réutilise-les pour l'auto-réparation.
    const stats = computeStats(userId);
    const healed = checkAchievements(userId, stats);
    const rank = getRank(stats.points);
    const nextRank = RANKS[RANKS.findIndex((r) => r.id === rank.id) + 1] ?? null;
    const badges = getUserBadges(userId);
    const badgeSet = new Set(badges);

    const families = BADGE_FAMILIES.map((f) => ({
      id: f.id,
      name: f.name,
      icon: f.icon,
      description: f.description,
      current: familyProgress(stats, f.id),
      tiers: f.tiers.map((tier) => ({
        level: tier.level,
        threshold: tier.threshold,
        earned: badgeSet.has(badgeId(f.id, tier.level)),
      })),
    }));

    res.json({
      rank,
      ranks: RANKS,
      rankProgress: computeRankProgress(stats.points, rank),
      badges,
      families,
      nextRank: nextRank?.name ?? 'Max',
      nextRankPoints: nextRank?.min ?? null,
      newBadges: healed,
    });
  } catch (err: any) {
    console.error('Achievements error:', err?.message ?? err);
    res.status(500).json({ error: 'Erreur achievements: ' + (err?.message ?? String(err)) });
  }
});

export function userPoints(userId: number): number {
  // Points = (prières * 10) + pénalités retard + quêtes complétées.
  const row = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM prayers WHERE user_id = ?) * 10
      + (SELECT COALESCE(SUM(
          CASE
            WHEN late = 1 AND late_minutes <= 15 THEN 0
            WHEN late = 1 AND late_minutes <= 60 THEN -2
            WHEN late = 1 AND late_minutes <= 120 THEN -5
            WHEN late = 1 AND late_minutes <= 240 THEN -8
            WHEN late = 1 THEN -10
            ELSE 0
          END), 0) FROM prayers WHERE user_id = ?)
      + (SELECT COALESCE(SUM(points), 0) FROM quests WHERE user_id = ? AND done = 1) AS n
  `).get(userId, userId, userId) as { n: number } | undefined;
  return row?.n ?? 0;
}

function getUserBadges(userId: number): string[] {
  const rows = db.prepare('SELECT badge_id FROM achieved_badges WHERE user_id = ?').all(userId) as { badge_id: string }[];
  return rows.map(r => r.badge_id);
}

export interface Stats {
  points: number;
  totalPrayers: number;
  fullDays: number;
  streakBest: number;
  questsDone: number;
}

/** Statistiques monotones avec deux lectures Neon au lieu de six. */
export function computeStats(userId: number): Stats {
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM prayers WHERE user_id = ?) AS total_prayers,
      (SELECT COALESCE(SUM(points), 0) FROM quests WHERE user_id = ? AND done = 1) AS quest_points,
      (SELECT COUNT(*) FROM quests WHERE user_id = ? AND done = 1) AS quests_done
  `).get(userId, userId, userId) as {
    total_prayers: number;
    quest_points: number;
    quests_done: number;
  };
  const days = prayerDayRows(userId);
  const streak = streakFromActiveDays(new Set(days.filter((r) => r.n >= 1).map((r) => r.date)), toLocalDate());
  const totalPrayers = totals?.total_prayers ?? 0;
  const questPoints = totals?.quest_points ?? 0;
  return {
    points: totalPrayers * 10 + questPoints,
    totalPrayers,
    fullDays: days.filter((r) => r.n >= 5).length,
    streakBest: streak.best,
    questsDone: totals?.quests_done ?? 0,
  };
}

// Migration : anciens badges « plats » → familles à niveaux (ex. streak7 → streak_bronze)
const LEGACY_TO_TIERED: Record<string, string> = {
  firstPrayer: 'salat_bronze',
  allFive: 'five_bronze',
  weekWarrior: 'five_silver',
  streak7: 'streak_bronze',
  streak30: 'streak_silver',
  streak100: 'streak_gold',
  firstQuest: 'quests_bronze',
  tenQuests: 'quests_silver',
  fiftyQuests: 'quests_gold',
  levelUp1: 'rank_bronze',
  levelUp2: 'rank_silver',
  levelUp3: 'rank_gold',
};

let legacyMigrationDone = false;

function migrateLegacyBadges(): void {
  if (legacyMigrationDone) return;
  try {
    const rows = db.prepare('SELECT user_id, badge_id FROM achieved_badges').all() as { user_id: number; badge_id: string }[];
    for (const r of rows) {
      const target = LEGACY_TO_TIERED[r.badge_id];
      if (!target) continue;
      db.prepare('INSERT OR IGNORE INTO achieved_badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)').run(r.user_id, target, new Date().toISOString());
      db.prepare('DELETE FROM achieved_badges WHERE user_id = ? AND badge_id = ?').run(r.user_id, r.badge_id);
    }
    legacyMigrationDone = true;
  } catch { /* base vide ou déjà migrée */ }
}
migrateLegacyBadges();

// Called after every check-in / quest completion
export function checkAchievements(userId: number, statsOverride?: Stats): string[] {
  migrateLegacyBadges();
  const unlocked: string[] = [];
  const existing = new Set(getUserBadges(userId));
  const stats = statsOverride ?? computeStats(userId);
  const inputs: BadgeInputs = {
    existing,
    points: stats.points,
    totalPrayers: stats.totalPrayers,
    fullDays: stats.fullDays,
    streakBest: stats.streakBest,
    questsDone: stats.questsDone,
  };
  const newBadges = computeNewBadges(inputs);
  for (const b of newBadges) {
    giveBadge(userId, b);
    unlocked.push(b);
  }
  return unlocked;
}

function giveBadge(userId: number, badgeId: string) {
  try {
    db.prepare(
      'INSERT OR IGNORE INTO achieved_badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)'
    ).run(userId, badgeId, new Date().toISOString());
  } catch { /* badge already exists */ }
}

// Create badges table
db.exec(`
  CREATE TABLE IF NOT EXISTS achieved_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, badge_id)
  );
`);
