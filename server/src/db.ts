import path from 'node:path';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createPgDb, type SyncDb } from './pgSync.js';

// Deux modes :
//  - local / tests : SQLite (fichier server/data/nour.db) — rien ne change.
//  - production    : si DATABASE_URL est défini, PostgreSQL (Neon) via
//    l'adaptateur synchrone pgSync (aucune route modifiée).

const usePg = Boolean(process.env.DATABASE_URL) && process.env.ENABLE_SYNC !== 'true';

function createSqliteDb(): DatabaseSync {
  const DB_DIR = path.resolve(process.cwd(), 'server/data');
  fs.mkdirSync(DB_DIR, { recursive: true });
  const DB_PATH = path.join(DB_DIR, 'nour.db');

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  db.exec('CREATE TABLE IF NOT EXISTS users (' +
    'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'name TEXT NOT NULL, ' +
    'password_hash TEXT NOT NULL, ' +
    "profile_json TEXT NOT NULL DEFAULT '{}', " +
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ')');

  // Migration : supprimer email et exiger des noms uniques
  try {
    const cols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
    if (cols.some((c) => c.name === 'email')) {
      const dupes = db.prepare('SELECT name, COUNT(*) as n FROM users GROUP BY name HAVING n > 1').all() as { name: string; n: number }[];
      for (const d of dupes) {
        const rows = db.prepare('SELECT id FROM users WHERE name = ? ORDER BY id').all(d.name) as { id: number }[];
        for (let i = 1; i < rows.length; i++) {
          db.prepare('UPDATE users SET name = ? WHERE id = ?').run(`${d.name} #${i + 1}`, rows[i].id);
        }
      }
      db.exec('ALTER TABLE users DROP COLUMN email');
    }
  } catch { /* migration déjà faite */ }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name ON users(name)');

  // Migration : profils fantomes (anonymes) + purge auto
  try {
    const cols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
    if (!cols.some((c) => c.name === 'is_anonymous')) {
      db.exec('ALTER TABLE users ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0');
    }
    if (!cols.some((c) => c.name === 'last_seen')) {
      db.exec('ALTER TABLE users ADD COLUMN last_seen TEXT');
    }
  } catch { /* migration deja faite */ }
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_anonymous ON users(is_anonymous, last_seen)');  // Migration : api_key OpenRouter par compte
  try {
    const cols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
    if (!cols.some((c) => c.name === 'api_key')) {
      db.exec('ALTER TABLE users ADD COLUMN api_key TEXT');
    }
  } catch { /* migration deja faite */ }

  // Migration : prières en retard (late, late_minutes)
  try {
    const cols = db.prepare('PRAGMA table_info(prayers)').all() as { name: string }[];
    if (!cols.some((c) => c.name === 'late')) {
      db.exec('ALTER TABLE prayers ADD COLUMN late INTEGER NOT NULL DEFAULT 0');
    }
    if (!cols.some((c) => c.name === 'late_minutes')) {
      db.exec('ALTER TABLE prayers ADD COLUMN late_minutes INTEGER NOT NULL DEFAULT 0');
    }
  } catch { /* migration deja faite */ }


  db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS prayers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  prayer TEXT NOT NULL,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  late INTEGER NOT NULL DEFAULT 0,
  late_minutes INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date, prayer)
);
CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'general',
  points INTEGER NOT NULL DEFAULT 10,
  done INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date, quest_id)
);
CREATE INDEX IF NOT EXISTS idx_prayers_user ON prayers(user_id, date);
CREATE INDEX IF NOT EXISTS idx_quests_user ON quests(user_id, date);
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conv_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  messages TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, conv_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at);
CREATE TABLE IF NOT EXISTS devotion_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS streak (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current INTEGER NOT NULL DEFAULT 0,
  best INTEGER NOT NULL DEFAULT 0,
  last_date TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS quiz_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prophet TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 5,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, prophet)
);
CREATE TABLE IF NOT EXISTS quest_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
  return db;
}

export const db: SyncDb = usePg
  ? createPgDb(process.env.DATABASE_URL as string)
  : (createSqliteDb() as unknown as SyncDb);

export interface UserRow {
  id: number;
  name: string;
  password_hash: string;
  profile_json: string;
  created_at: string;
  is_anonymous: number;
  last_seen: string | null;
  api_key: string | null;
}

export function publicUser(row: UserRow) {
  let profile = {};
  try {
    profile = JSON.parse(row.profile_json || '{}');
  } catch {
    /* ignore */
  }
  return { id: row.id, name: row.name, profile, createdAt: row.created_at, isAnonymous: row.is_anonymous === 1 } as const;
}
