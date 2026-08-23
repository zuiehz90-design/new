import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware as auth } from './auth.js';
import { checkAchievements, getRank, userPoints } from './achievements.js';
import { computeStreak, toLocalDate } from './streak.js';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const prayersRouter = Router();

// GET /api/prayers?date=YYYY-MM-DD (default: today)
prayersRouter.get('/', auth, (req: any, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : toLocalDate();
  const rows = db.prepare('SELECT prayer, date FROM prayers WHERE user_id = ? AND date = ?').all(req.user.id, date) as any[];
  const checked = rows.map((r: any) => r.prayer);
  const today = toLocalDate();
  const streak = computeStreak(req.user.id, today);
  res.json({ date, checked, total: PRAYER_NAMES.filter((p) => checked.includes(p)).length, of: 5, streak });
});

// POST /api/prayers/check { prayer, date? }
prayersRouter.post('/check', auth, (req: any, res) => {
  const { prayer, date } = req.body ?? {};
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : toLocalDate();
  if (!PRAYER_NAMES.includes(prayer)) return res.status(400).json({ error: 'Prière invalide.' });
  // Débloquer les badges / points liés à ce check-in
  const before = getRank(userPoints(req.user.id));
  try {
    db.prepare('INSERT OR IGNORE INTO prayers (user_id, date, prayer) VALUES (?, ?, ?)').run(req.user.id, d, prayer);
  } catch {
    /* déjà présent */
  }
  const newBadges = checkAchievements(req.user.id);
  const after = getRank(userPoints(req.user.id));
  const newRank = after.id !== before.id ? after : null;
  return res.json({ ok: true, date: d, prayer, newBadges, newRank });
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
