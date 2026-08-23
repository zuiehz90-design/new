import { Router } from 'express';
import { db, publicUser, type UserRow } from '../db.js';
import { hashPassword, verifyPassword, createSession, getSessionUser, deleteSession, createAnonymousUser, touchAnonymous, deleteAnonymousUser, invalidateSessionCache } from '../auth.js';

export const authRouter = Router();

function auth(req: any, res: any, next: any) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = token ? getSessionUser(token) : null;
  if (!user) return res.status(401).json({ error: 'Non authentifié.' });
  req.user = user;
  req.token = token;
  // Prolonge la vie du profil fantome a chaque requete authentifiee
  if (user.isAnonymous) touchAnonymous(user.id);
  next();
}

authRouter.post('/anonymous', (_req, res) => {
  const user = createAnonymousUser();
  const token = createSession(user.id);
  res.status(201).json({ token, user });
});

authRouter.get('/me', auth, (req: any, res) => {
  res.json({ user: req.user });
});

authRouter.post('/register', (req, res) => {
  const { name, password } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2) return res.status(400).json({ error: 'Nom trop court (≥ 2 caractères).' });
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (≥ 6 caractères).' });
  const existing = db.prepare('SELECT id FROM users WHERE name = ?').get(name.trim()) as any;
  if (existing) return res.status(409).json({ error: 'Ce nom est déjà utilisé. Choisissez-en un autre.' });

  // Si la session courante est un profil fantome, on le convertit en compte reel
  // (meme id, toutes les donnees conservees : salat, streak, quetes, conversations).
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const current = token ? getSessionUser(token) : null;
  if (current && current.isAnonymous) {
    db.prepare("UPDATE users SET name = ?, password_hash = ?, is_anonymous = 0, last_seen = datetime('now') WHERE id = ?").run(name.trim(), hashPassword(password), current.id);
    invalidateSessionCache(token, current.id);
    const user = publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(current.id) as UserRow);
    return res.json({ token, user });
  }

  db.prepare('INSERT INTO users (name, password_hash) VALUES (?, ?)').run(name.trim(), hashPassword(password));
  const user = publicUser(db.prepare('SELECT * FROM users WHERE name = ?').get(name.trim()) as UserRow);
  const newToken = createSession(user.id);
  res.status(201).json({ token: newToken, user });
});

authRouter.post('/login', (req, res) => {
  const { name, password } = req.body ?? {};
  if (typeof name !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Nom et mot de passe requis.' });
  const row = db.prepare('SELECT * FROM users WHERE name = ?').get(name.trim()) as UserRow | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) return res.status(401).json({ error: 'Nom ou mot de passe incorrect.' });

  // Connexion depuis un profil fantome : le fantome et ses donnees sont abandonnes
  // (purge immediate, sinon la purge periodique s'en chargerait plus tard).
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const current = token ? getSessionUser(token) : null;
  if (current && current.isAnonymous && current.id !== row.id) {
    deleteAnonymousUser(current.id);
  }

  const user = publicUser(row);
  const newToken = createSession(user.id);
  res.json({ token: newToken, user });
});

authRouter.post('/logout', auth, (req: any, res) => {
  deleteSession(req.token);
  res.json({ ok: true });
});

export { auth as authMiddleware };
