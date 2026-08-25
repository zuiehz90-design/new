import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware as auth } from './auth.js';
import { checkAchievements, getRank, userPoints } from './achievements.js';

export const quizRouter = Router();

/** Prophètes ayant un quiz (allowlist côté serveur). */
const PROPHETS = [
  'Adam', 'Nuh', 'Ibrahim', 'Yusuf', 'Moussa', 'Isa',
  'Yunus', 'Dawud', 'Ayyub', 'Sulayman', 'Hud', 'Lut',
];

interface QuizRow {
  score: number;
  total: number;
  points_awarded: number;
}

// GET /api/quiz/progress — progression par prophète (pour les barres de suivi).
quizRouter.get('/progress', auth, (req: any, res) => {
  try {
    const rows = db.prepare(
      'SELECT prophet, score, total, points_awarded, completed_at FROM quiz_completions WHERE user_id = ?'
    ).all(req.user.id) as { prophet: string; score: number; total: number; points_awarded: number; completed_at: string }[];
    res.json({
      progress: rows.map(r => ({
        prophet: r.prophet,
        score: r.score,
        total: r.total,
        points: r.points_awarded,
        completed: r.score > 0,
        completedAt: r.completed_at,
      })),
    });
  } catch (err: any) {
    console.error('Quiz progress error:', err?.message ?? err);
    res.status(500).json({ error: 'Erreur progression: ' + (err?.message ?? String(err)) });
  }
});

// POST /api/quiz/complete — valide un quiz de compréhension et attribue des points
// Anti-farm : points attribués une seule fois par prophète (meilleur score).
quizRouter.post('/complete', auth, (req: any, res) => {
  const prophet = String((req.body ?? {}).prophet ?? '');
  const score = Number((req.body ?? {}).score);
  const total = Number((req.body ?? {}).total);

  if (!PROPHETS.includes(prophet)) {
    return res.status(400).json({ error: 'Prophète inconnu.' });
  }
  if (!Number.isFinite(score) || !Number.isFinite(total) || total < 1 || score < 0 || score > total) {
    return res.status(400).json({ error: 'Score invalide.' });
  }

  const existing = db.prepare(
    'SELECT score, total, points_awarded FROM quiz_completions WHERE user_id = ? AND prophet = ?'
  ).get(req.user.id, prophet) as QuizRow | undefined;

  const points = score === total ? 15 : Math.round((10 * score) / total);
  let awarded = 0;
  let first = false;
  let best = false;

  if (!existing) {
    first = true;
    awarded = points;
    db.prepare(
      'INSERT INTO quiz_completions (user_id, prophet, score, total, points_awarded) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, prophet, score, total, awarded);
  } else if (score > existing.score) {
    const newPoints = Math.max(0, points - existing.points_awarded);
    if (newPoints > 0) {
      awarded = newPoints;
      best = true;
      db.prepare(
        'UPDATE quiz_completions SET score = ?, total = ?, points_awarded = points_awarded + ? WHERE user_id = ? AND prophet = ?'
      ).run(score, total, newPoints, req.user.id, prophet);
    }
  }

  const before = getRank(userPoints(req.user.id));
  const newBadges = checkAchievements(req.user.id);
  const after = getRank(userPoints(req.user.id));
  const newRank = after.id !== before.id ? after : null;

  res.json({ ok: true, prophet, score, total, points: awarded, first, best, newBadges, newRank });
});
