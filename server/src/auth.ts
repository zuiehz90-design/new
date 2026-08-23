import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db, publicUser, type UserRow } from './db.js';
import { ANONYMOUS_MAX_AGE_DAYS, randomAnonymousName } from './guestNames.js';

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = scryptSync(pw, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return test.length === expected.length && timingSafeEqual(test, expected);
}

export function createSession(userId: number): string {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires);
  return token;
}

export function getSessionUser(token: string): ReturnType<typeof publicUser> | null {
  const row = db.prepare(
    'SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime(\'now\')'
  ).get(token) as UserRow | undefined;
  return row ? publicUser(row) : null;
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function deleteExpiredSessions(): void {
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}


/* ---------- Profils fantomes (anonymes) ---------- */

/** Cree un profil fantome (compte anonyme, mot de passe inutilisable). */
export function createAnonymousUser(): ReturnType<typeof publicUser> {
  const name = randomAnonymousName((n) => !!db.prepare('SELECT id FROM users WHERE name = ?').get(n));
  const hash = hashPassword(randomBytes(24).toString('hex'));
  const info = db.prepare(
    "INSERT INTO users (name, password_hash, is_anonymous, last_seen) VALUES (?, ?, 1, datetime('now'))"
  ).run(name, hash);
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid)) as UserRow;
  return publicUser(row);
}

/** Rafraichit last_seen d'un fantome (au plus une fois par heure). */
export function touchAnonymous(userId: number): void {
  db.prepare(
    "UPDATE users SET last_seen = datetime('now') WHERE id = ? AND is_anonymous = 1 AND (last_seen IS NULL OR last_seen < datetime('now','-1 hour'))"
  ).run(userId);
}

/** Supprime les profils fantomes inactifs et leurs donnees (FK CASCADE). */
export function cleanupAnonymousProfiles(maxAgeDays: number = ANONYMOUS_MAX_AGE_DAYS): number {
  const res = db.prepare(
    "DELETE FROM users WHERE is_anonymous = 1 AND (last_seen IS NULL OR last_seen < datetime('now', ?))"
  ).run('-' + maxAgeDays + ' days');
  // achieved_badges n'a pas de FK CASCADE : on nettoie les orphelins
  db.prepare('DELETE FROM achieved_badges WHERE user_id NOT IN (SELECT id FROM users)').run();
  db.prepare('DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)').run();
  return Number(res.changes);
}

/** Supprime immediatement un profil fantome et toutes ses donnees. */
export function deleteAnonymousUser(userId: number): void {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM achieved_badges WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}
