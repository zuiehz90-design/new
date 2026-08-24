import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware as auth } from './auth.js';
import { checkAchievements, getRank, userPoints } from './achievements.js';
import { computeStreak, toLocalDate } from './streak.js';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Calcul du malus en points en retard (en minutes).
 * Plus on est en retard, plus la pénalité est grande.
 * - 0-15 min : aucun malus (simple oubli)
 * - 15-60 min : -2 pts
 * - 1-2h : -5 pts
 * - 2-4h : -8 pts
 * - 4h+ : -10 pts
 */
function computeLatePenalty(lateMinutes: number): number {
  if (lateMinutes <= 15) return 0;
  if (lateMinutes <= 60) return -2;
  if (lateMinutes <= 120) return -5;
  if (lateMinutes <= 240) return -8;
  return -10;
}

export const prayersRouter = Router();

// GET /api/prayers?date=YYYY-MM-DD (default: today)
prayersRouter.get('/', auth, (req: any, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : toLocalDate();
  const rows = db.prepare('SELECT prayer, date, late, late_minutes FROM prayers WHERE user_id = ? AND date = ?').all(req.user.id, date) as any[];
  const checked = rows.map((r: any) => r.prayer);
  const today = toLocalDate();
  const streak = computeStreak(req.user.id, today);
  res.json({ date, checked, total: PRAYER_NAMES.filter((p) => checked.includes(p)).length, of: 5, streak });
});

// POST /api/prayers/check { prayer, date?, late?, lateMinutes? }
prayersRouter.post('/check', auth, (req: any, res) => {
  const { prayer, date, late, lateMinutes } = req.body ?? {};
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : toLocalDate();
  if (!PRAYER_NAMES.includes(prayer)) return res.status(400).json({ error: 'Prière invalide.' });
  const isLate = Boolean(late);
  const minutes = typeof lateMinutes === 'number' ? Math.max(0, Math.round(lateMinutes)) : 0;
  const penalty = isLate ? computeLatePenalty(minutes) : 0;

  // Débloquer les badges / points liés à ce check-in
  const before = getRank(userPoints(req.user.id));
  try {
    if (isLate) {
      db.prepare('INSERT INTO prayers (user_id, date, prayer, late, late_minutes) VALUES (?, ?, ?, 1, ?) ON CONFLICT (user_id, date, prayer) DO UPDATE SET late = 1, late_minutes = ?').run(req.user.id, d, prayer, minutes, minutes);
    } else {
      db.prepare('INSERT OR IGNORE INTO prayers (user_id, date, prayer) VALUES (?, ?, ?)').run(req.user.id, d, prayer);
    }
  } catch {
    /* déjà présent */
  }
  const newBadges = checkAchievements(req.user.id);
  const after = getRank(userPoints(req.user.id));
  const newRank = after.id !== before.id ? after : null;
  return res.json({ ok: true, date: d, prayer, newBadges, newRank, penalty, late: isLate, lateMinutes: minutes });
});

// POST /api/prayers/uncheck { prayer, date? }
prayersRouter.post('/uncheck', auth, (req: any, res) => {
  const { prayer, date } = req.body ?? {};
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : toLocalDate();
  if (!PRAYER_NAMES.includes(prayer)) return res.status(400).json({ error: 'Prière invalide.' });
  db.prepare('DELETE FROM prayers WHERE user_id = ? AND date = ? AND prayer = ?').run(req.user.id, d, prayer);
  return res.json({ ok: true, date: d, prayer });
});

// GET /api/streak
prayersRouter.get('/streak', auth, (req: any, res) => {
  const today = typeof req.query.today === 'string' ? req.query.today : toLocalDate();
  res.json(computeStreak(req.user.id, today));
});

export { toLocalDate } from './streak.js';
