import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware as auth } from './auth.js';
import { checkAchievements, getRank, userPoints } from './achievements.js';
import { computeStreak, toLocalDate } from './streak.js';

/* ---------- Défis hebdomadaires ----------
   Trois défis par semaine, générés déterministiquement à partir de la
   semaine (même défi pour tous les utilisateurs, comme les quêtes du jour).
   La progression est calculée depuis la base pour les métriques serveur
   (prières, quêtes, Coran, dhikr, quiz, série) et rapportée par le client
   pour les métriques locales (99 Noms — localStorage). */

interface WeeklyRow {
  id: number;
  challenge_id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  points: number;
  progress: number;
  claimed: number;
}

interface WeeklyTemplate {
  id: string;
  type: string;
  title: string;
  description: string;
  target: number;
  points: number;
}

/** Types dont la progression est rapportée par le client (données locales). */
const CLIENT_REPORTED_TYPES = ['names'];

const WEEKLY_TEMPLATES: WeeklyTemplate[] = [
  { id: 'prayers-20', type: 'prayers', title: 'Prie 20 fois cette semaine', description: 'Coche 20 prières cette semaine pour renforcer ta constance.', target: 20, points: 60 },
  { id: 'prayers-30', type: 'prayers', title: 'Prie 30 fois cette semaine', description: 'Un objectif ambitieux : 30 prières cochées en une semaine.', target: 30, points: 90 },
  { id: 'quests-10', type: 'quests', title: 'Complète 10 quêtes', description: 'Valide 10 quêtes quotidiennes cette semaine.', target: 10, points: 50 },
  { id: 'quests-15', type: 'quests', title: 'Complète 15 quêtes', description: 'Un rythme soutenu : 15 quêtes validées.', target: 15, points: 80 },
  { id: 'quran-3', type: 'quran', title: 'Fais 3 quêtes de Coran', description: 'Valide 3 quêtes liées au Coran (lecture, mémorisation…).', target: 3, points: 45 },
  { id: 'dhikr-3', type: 'dhikr', title: 'Fais 3 quêtes de dhikr', description: 'Valide 3 quêtes de dhikr (SubhanAllah, istighfar…).', target: 3, points: 45 },
  { id: 'quiz-2', type: 'quiz', title: 'Réussis 2 quiz', description: 'Obtiens un score positif sur 2 quiz de prophètes.', target: 2, points: 40 },
  { id: 'streak-7', type: 'streak', title: 'Atteins une série de 7 jours', description: "Maintiens ta série : une prière par jour pendant 7 jours d'affilée.", target: 7, points: 100 },
  { id: 'names-5', type: 'names', title: 'Apprends 5 nouveaux noms', description: "Révise et note 5 des 99 Noms d'Allah cette semaine.", target: 5, points: 50 },
  { id: 'names-10', type: 'names', title: 'Apprends 10 nouveaux noms', description: "Un effort soutenu : révise et note 10 des 99 Noms.", target: 10, points: 90 },
];

/** Date ISO du lundi de la semaine contenant `date`. */
export function weekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daySeed(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return Math.floor(d.getTime() / 86_400_000);
}

/** 3 défis par semaine : types distincts (7 types, pas de 5 → toujours distincts). */
export function pickWeekly(seed: number): WeeklyTemplate[] {
  const groups = new Map<string, WeeklyTemplate[]>();
  for (const t of WEEKLY_TEMPLATES) {
    const list = groups.get(t.type) ?? [];
    list.push(t);
    groups.set(t.type, list);
  }
  const types = [...groups.keys()];
  const out: WeeklyTemplate[] = [];
  for (let i = 0; i < 3; i++) {
    const type = types[(seed + i * 5) % types.length];
    const list = groups.get(type)!;
    out.push(list[(seed + i * 7) % list.length]);
  }
  return out;
}

/** Progression « live » d'un défi calculée depuis la base (métriques serveur). */
export function computeProgress(userId: number, type: string, week: string): number {
  const count = (sql: string) => {
    const row = db.prepare(sql).get(userId, week) as { n: number } | undefined;
    return row?.n ?? 0;
  };
  switch (type) {
    case 'prayers':
      return count('SELECT COUNT(*) as n FROM prayers WHERE user_id = ? AND date >= ?');
    case 'quests':
      return count('SELECT COUNT(*) as n FROM quests WHERE user_id = ? AND done = 1 AND date >= ?');
    case 'quran':
      return count("SELECT COUNT(*) as n FROM quests WHERE user_id = ? AND done = 1 AND type = 'quran' AND date >= ?");
    case 'dhikr':
      return count("SELECT COUNT(*) as n FROM quests WHERE user_id = ? AND done = 1 AND type = 'dhikr' AND date >= ?");
    case 'quiz':
      return count("SELECT COUNT(*) as n FROM quiz_completions WHERE user_id = ? AND score > 0 AND substr(completed_at, 1, 10) >= ?");
    case 'streak':
      return computeStreak(userId, toLocalDate()).current;
    default:
      return 0;
  }
}

function currentWeek(): string {
  return weekStart(new Date());
}

export const challengesRouter = Router();

// GET /api/challenges
challengesRouter.get('/', auth, (req: any, res) => {
  const week = typeof req.query.week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.week)
    ? req.query.week
    : currentWeek();
  let rows = db.prepare(
    'SELECT id, challenge_id, title, description, type, target, points, progress, claimed FROM weekly_challenges WHERE user_id = ? AND week_start = ?'
  ).all(req.user.id, week) as WeeklyRow[];

  if (rows.length === 0) {
    const templates = pickWeekly(daySeed(week));
    const insert = db.prepare(
      'INSERT INTO weekly_challenges (user_id, week_start, challenge_id, title, description, type, target, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const t of templates) {
      insert.run(req.user.id, week, t.id, t.title, t.description, t.type, t.target, t.points);
    }
    rows = db.prepare(
      'SELECT id, challenge_id, title, description, type, target, points, progress, claimed FROM weekly_challenges WHERE user_id = ? AND week_start = ?'
    ).all(req.user.id, week) as WeeklyRow[];
  }

  const challenges = rows.map((r) => {
    const progress = CLIENT_REPORTED_TYPES.includes(r.type) ? r.progress : computeProgress(req.user.id, r.type, week);
    const capped = Math.min(progress, r.target);
    return {
      challenge_id: r.challenge_id,
      title: r.title,
      description: r.description,
      type: r.type,
      target: r.target,
      points: r.points,
      progress: capped,
      claimed: r.claimed === 1,
      completed: capped >= r.target,
    };
  });

  res.json({ week_start: week, challenges });
});

// POST /api/challenges/:id/claim — réclame la récompense (une seule fois)
challengesRouter.post('/:id/claim', auth, (req: any, res) => {
  const week = currentWeek();
  const row = db.prepare(
    'SELECT id, type, target, progress, claimed, points FROM weekly_challenges WHERE user_id = ? AND week_start = ? AND challenge_id = ?'
  ).get(req.user.id, week, req.params.id) as { id: number; type: string; target: number; progress: number; claimed: number; points: number } | undefined;
  if (!row) return res.status(404).json({ error: 'Défi introuvable.' });

  if (row.claimed === 1) {
    return res.json({ ok: true, challenge_id: req.params.id, claimed: true, points: 0, newBadges: [], newRank: null });
  }

  const progress = CLIENT_REPORTED_TYPES.includes(row.type)
    ? row.progress
    : computeProgress(req.user.id, row.type, week);
  if (progress < row.target) {
    return res.status(200).json({ ok: false, code: 'not_reached', challenge_id: req.params.id, claimed: false });
  }

  // Comparaison AVANT l'attribution des points, sinon before === after et newRank est toujours null.
  const before = getRank(userPoints(req.user.id));
  db.prepare('UPDATE weekly_challenges SET claimed = 1 WHERE id = ?').run(row.id);
  const newBadges = checkAchievements(req.user.id);
  const after = getRank(userPoints(req.user.id));
  const newRank = after.id !== before.id ? after : null;
  res.json({ ok: true, challenge_id: req.params.id, claimed: true, points: row.points, newBadges, newRank });
});

// POST /api/challenges/:id/progress — progression rapportée par le client (ex. 99 Noms)
challengesRouter.post('/:id/progress', auth, (req: any, res) => {
  const week = currentWeek();
  const row = db.prepare(
    'SELECT id, type, target, progress, claimed FROM weekly_challenges WHERE user_id = ? AND week_start = ? AND challenge_id = ?'
  ).get(req.user.id, week, req.params.id) as { id: number; type: string; target: number; progress: number; claimed: number } | undefined;
  if (!row) return res.status(404).json({ error: 'Défi introuvable.' });

  if (!CLIENT_REPORTED_TYPES.includes(row.type)) {
    return res.status(400).json({ error: 'Ce défi ne peut pas être rapporté manuellement.' });
  }

  let progress = row.progress;
  if (row.claimed === 0 && progress < row.target) {
    progress = progress + 1;
    db.prepare('UPDATE weekly_challenges SET progress = ? WHERE id = ?').run(progress, row.id);
  }

  res.json({
    ok: true,
    challenge_id: req.params.id,
    progress: Math.min(progress, row.target),
    target: row.target,
    completed: progress >= row.target,
    claimed: row.claimed === 1,
  });
});
