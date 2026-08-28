import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from './auth.js';
import { config } from '../config.js';

export const setupRouter = Router();

setupRouter.get('/setup-key', authMiddleware, (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Non autorisé.' });
    const row = db.prepare('SELECT api_key FROM users WHERE id = ?').get(userId) as { api_key: string | null } | undefined;
    res.json({ configured: Boolean(row?.api_key) });
  } catch {
    res.json({ configured: false });
  }
});

setupRouter.delete('/setup-key', authMiddleware, (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Non autoris�.' });
    db.prepare('UPDATE users SET api_key = NULL WHERE id = ?').run(userId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Erreur interne.' });
  }
});

setupRouter.post('/setup-key', authMiddleware, (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Non autorisé.' });
    const { key } = (req.body ?? {}) as { key?: string };
    if (typeof key !== 'string' || !/^sk-or-v1-[A-Za-z0-9_-]+$/.test(key.trim())) {
      return res.status(400).json({ error: 'Clé API invalide.' });
    }
    db.prepare('UPDATE users SET api_key = ? WHERE id = ?').run(key.trim(), userId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Erreur interne.' });
  }
});

/** La clé n'est jamais renvoyée au client, uniquement consommée côté serveur. */
export function getUserApiKey(userId: number): string | null {
  try {
    const row = db.prepare('SELECT api_key FROM users WHERE id = ?').get(userId) as { api_key: string | null } | undefined;
    return row?.api_key || null;
  } catch {
    return null;
  }
}

/** Clé OpenRouter effective pour un utilisateur : la sienne si présente,
 *  sinon la clé serveur globale (fallback). */
export function getResolvedApiKey(userId: number): string | null {
  const userKey = getUserApiKey(userId);
  if (userKey) return userKey;
  return config.openRouterApiKey;
}
