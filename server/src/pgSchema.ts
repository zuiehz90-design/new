// Schema PostgreSQL (Neon) cree au demarrage en production.
// Miroir exact du schema SQLite (voir db.ts) + achieved_badges.
export const PG_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  profile_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  last_seen TEXT,
  api_key TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
CREATE TABLE IF NOT EXISTS prayers (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  prayer TEXT NOT NULL,
  checked_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
  late INTEGER NOT NULL DEFAULT 0,
  late_minutes INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date, prayer)
);
CREATE TABLE IF NOT EXISTS quests (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conv_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  messages TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, conv_id)
);
CREATE TABLE IF NOT EXISTS devotion_scores (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prophet TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 5,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
  UNIQUE(user_id, prophet)
);
CREATE TABLE IF NOT EXISTS quest_completions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
CREATE TABLE IF NOT EXISTS achieved_badges (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS late INTEGER NOT NULL DEFAULT 0;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS late_minutes INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_anonymous ON users(is_anonymous, last_seen);
CREATE INDEX IF NOT EXISTS idx_achieved_badges_user ON achieved_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_prayers_user ON prayers(user_id, date);
CREATE INDEX IF NOT EXISTS idx_quests_user ON quests(user_id, date);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at);
`;
