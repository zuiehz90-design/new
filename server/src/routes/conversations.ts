import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware as auth } from './auth.js';

export interface SyncMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  offline?: boolean;
}

export interface SyncConversation {
  id: string;
  title: string;
  messages: SyncMessage[];
  createdAt: number;
  updatedAt: number;
}

export const conversationsRouter = Router();

const MAX_CONVERSATIONS = 100;
const MAX_MESSAGES = 500;
const MAX_CONTENT = 50_000;

/**
 * Valide et normalise un payload { conversations: [...] } (logique pure, testable).
 * Retourne null si le payload est mal formé, sinon la liste nettoyée.
 */
export function parseConversationsPayload(body: unknown): SyncConversation[] | null {
  if (!body || typeof body !== 'object' || !Array.isArray((body as any).conversations)) return null;
  const out: SyncConversation[] = [];
  for (const raw of (body as any).conversations as unknown[]) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as any;
    if (typeof c.id !== 'string' || !c.id || c.id.length > 100) continue;
    if (!Array.isArray(c.messages)) continue;
    const messages: SyncMessage[] = [];
    for (const rm of c.messages.slice(0, MAX_MESSAGES) as unknown[]) {
      if (!rm || typeof rm !== 'object') continue;
      const m = rm as any;
      if (typeof m.id !== 'string' || typeof m.content !== 'string') continue;
      if (m.role !== 'user' && m.role !== 'assistant' && m.role !== 'system') continue;
      messages.push({
        id: m.id.slice(0, 100),
        role: m.role,
        content: m.content.slice(0, MAX_CONTENT),
        createdAt: typeof m.createdAt === 'number' ? m.createdAt : Date.now(),
        ...(m.offline ? { offline: true } : {}),
      });
    }
    out.push({
      id: c.id,
      title: typeof c.title === 'string' ? c.title.slice(0, 200) : 'Nouvelle conversation',
      messages,
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
      updatedAt: typeof c.updatedAt === 'number' ? c.updatedAt : Date.now(),
    });
  }
  return out.slice(0, MAX_CONVERSATIONS);
}

// GET /api/conversations — historique du compte
conversationsRouter.get('/', auth, (req: any, res) => {
  const rows = db
    .prepare('SELECT conv_id, title, messages, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.user.id) as any[];
  res.json({
    conversations: rows.map((r) => ({
      id: r.conv_id,
      title: r.title,
      messages: JSON.parse(r.messages || '[]'),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
});

// PUT /api/conversations — remplace tout l'historique (dernier écrit gagne)
conversationsRouter.put('/', auth, (req: any, res) => {
  const parsed = parseConversationsPayload(req.body);
  if (!parsed) return res.status(400).json({ error: 'Payload de conversations invalide.' });
  const userId = req.user.id;
  const del = db.prepare('DELETE FROM conversations WHERE user_id = ?');
  const ins = db.prepare(
    'INSERT INTO conversations (user_id, conv_id, title, messages, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  db.exec('BEGIN');
  try {
    del.run(userId);
    for (const c of parsed) {
      ins.run(userId, c.id, c.title, JSON.stringify(c.messages), c.createdAt, c.updatedAt);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  res.json({ ok: true, count: parsed.length });
});
