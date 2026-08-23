import { Router } from 'express';
import { db, publicUser, type UserRow } from '../db.js';
import { getSessionUser } from '../auth.js';
import { authMiddleware as auth } from './auth.js';

export const profileRouter = Router();

profileRouter.get('/', auth, (req: any, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as UserRow | undefined;
  if (!row) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  res.json({ user: publicUser(row) });
});

profileRouter.put('/', auth, (req: any, res) => {
  const { name, profile } = req.body ?? {};
  const userId = req.user.id;
  if (typeof name === 'string' && name.trim().length >= 2) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), userId);
  }
  if (profile && typeof profile === 'object') {
    db.prepare('UPDATE users SET profile_json = ? WHERE id = ?').run(JSON.stringify(profile), userId);
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  res.json({ user: row ? publicUser(row) : null });
});
