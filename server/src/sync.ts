/**
 * Sync module: pushes local SQLite data to Neon and pulls remote data.
 * Runs as a background task when DATABASE_URL is configured.
 * 
 * Strategy: periodic push/pull with "last write wins" conflict resolution.
 * Tables synced: users, prayers, quests, conversations, streak, devotion_scores.
 */

import { db } from './db.js';

const PUSH_INTERVAL = 30_000;   // 30s
const PULL_INTERVAL = 120_000;  // 2min

let pushTimer: ReturnType<typeof setInterval> | null = null;
let pullTimer: ReturnType<typeof setInterval> | null = null;
let pgPool: any = null;
let lastSyncAt: string | null = null;

/** Start background sync with Neon */
export async function startSync(databaseUrl: string): Promise<void> {
  if (pushTimer) return; // already running

  try {
    const pg = await import('pg');
    pgPool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 30000,
    });
    // Test connection
    const client = await pgPool.connect();
    client.release();
    console.log('[sync] Connected to Neon');
  } catch (err: any) {
    console.error('[sync] Cannot connect to Neon:', err.message);
    return;
  }

  // Initial sync
  await pushToRemote().catch(e => console.error('[sync] Initial push failed:', e.message));
  await pullFromRemote().catch(e => console.error('[sync] Initial pull failed:', e.message));

  pushTimer = setInterval(() => {
    pushToRemote().catch(e => console.error('[sync] Push error:', e.message));
  }, PUSH_INTERVAL);

  pullTimer = setInterval(() => {
    pullFromRemote().catch(e => console.error('[sync] Pull error:', e.message));
  }, PULL_INTERVAL);

  console.log('[sync] Background sync started (push every 30s, pull every 2min)');
}

/** Stop background sync */
export function stopSync(): void {
  if (pushTimer) { clearInterval(pushTimer); pushTimer = null; }
  if (pullTimer) { clearInterval(pullTimer); pullTimer = null; }
  if (pgPool) { pgPool.end().catch(() => {}); pgPool = null; }
  console.log('[sync] Stopped');
}

/** Get sync status */
export function getSyncStatus(): { active: boolean; lastSync: string | null } {
  return { active: Boolean(pushTimer), lastSync: lastSyncAt };
}

/** Push local SQLite data to Neon */
async function pushToRemote(): Promise<void> {
  if (!pgPool) return;
  const client = await pgPool.connect();
  try {
    // Users
    const users = db.prepare('SELECT * FROM users').all() as any[];
    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, name, password_hash, profile_json, created_at, is_anonymous, last_seen, api_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, profile_json=EXCLUDED.profile_json,
           last_seen=EXCLUDED.last_seen, api_key=EXCLUDED.api_key`,
        [u.id, u.name, u.password_hash, u.profile_json, u.created_at, u.is_anonymous, u.last_seen, u.api_key]
      );
    }

    // Prayers
    const prayers = db.prepare('SELECT * FROM prayers').all() as any[];
    for (const p of prayers) {
      await client.query(
        `INSERT INTO prayers (user_id, date, prayer, checked_at, late, late_minutes)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (user_id, date, prayer) DO UPDATE SET
           checked_at=EXCLUDED.checked_at, late=EXCLUDED.late, late_minutes=EXCLUDED.late_minutes`,
        [p.user_id, p.date, p.prayer, p.checked_at, p.late, p.late_minutes]
      );
    }

    // Quests
    const quests = db.prepare('SELECT * FROM quests').all() as any[];
    for (const q of quests) {
      await client.query(
        `INSERT INTO quests (user_id, date, quest_id, title, description, type, points, done)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (user_id, date, quest_id) DO UPDATE SET
           done=EXCLUDED.done, title=EXCLUDED.title, description=EXCLUDED.description`,
        [q.user_id, q.date, q.quest_id, q.title, q.description, q.type, q.points, q.done]
      );
    }

    // Conversations
    const convs = db.prepare('SELECT * FROM conversations').all() as any[];
    for (const c of convs) {
      await client.query(
        `INSERT INTO conversations (user_id, conv_id, title, messages, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (user_id, conv_id) DO UPDATE SET
           title=EXCLUDED.title, messages=EXCLUDED.messages, updated_at=EXCLUDED.updated_at`,
        [c.user_id, c.conv_id, c.title, c.messages, c.created_at, c.updated_at]
      );
    }

    // Streak
    const streaks = db.prepare('SELECT * FROM streak').all() as any[];
    for (const s of streaks) {
      await client.query(
        `INSERT INTO streak (user_id, current, best, last_date)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id) DO UPDATE SET
           current=EXCLUDED.current, best=EXCLUDED.best, last_date=EXCLUDED.last_date`,
        [s.user_id, s.current, s.best, s.last_date]
      );
    }

    // Devotion scores
    const devs = db.prepare('SELECT * FROM devotion_scores').all() as any[];
    for (const d of devs) {
      await client.query(
        `INSERT INTO devotion_scores (user_id, total)
         VALUES ($1,$2)
         ON CONFLICT (user_id) DO UPDATE SET total=EXCLUDED.total`,
        [d.user_id, d.total]
      );
    }

    lastSyncAt = new Date().toISOString();
  } finally {
    client.release();
  }
}

/** Pull Neon data into local SQLite */
async function pullFromRemote(): Promise<void> {
  if (!pgPool) return;
  const client = await pgPool.connect();
  try {
    // Users
    const { rows: users } = await client.query('SELECT * FROM users');
    for (const u of users) {
      db.prepare(
        `INSERT INTO users (id, name, password_hash, profile_json, created_at, is_anonymous, last_seen, api_key)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT (id) DO UPDATE SET
           name=excluded.name, profile_json=excluded.profile_json,
           last_seen=excluded.last_seen, api_key=excluded.api_key`
      ).run(u.id, u.name, u.password_hash, u.profile_json, u.created_at, u.is_anonymous, u.last_seen, u.api_key);
    }

    // Prayers
    const { rows: prayers } = await client.query('SELECT * FROM prayers');
    for (const p of prayers) {
      db.prepare(
        `INSERT INTO prayers (user_id, date, prayer, checked_at, late, late_minutes)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT (user_id, date, prayer) DO UPDATE SET
           checked_at=excluded.checked_at, late=excluded.late, late_minutes=excluded.late_minutes`
      ).run(p.user_id, p.date, p.prayer, p.checked_at, p.late, p.late_minutes);
    }

    // Quests
    const { rows: quests } = await client.query('SELECT * FROM quests');
    for (const q of quests) {
      db.prepare(
        `INSERT INTO quests (user_id, date, quest_id, title, description, type, points, done)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT (user_id, date, quest_id) DO UPDATE SET
           done=excluded.done, title=excluded.title, description=excluded.description`
      ).run(q.user_id, q.date, q.quest_id, q.title, q.description, q.type, q.points, q.done);
    }

    // Conversations
    const { rows: convs } = await client.query('SELECT * FROM conversations');
    for (const c of convs) {
      db.prepare(
        `INSERT INTO conversations (user_id, conv_id, title, messages, created_at, updated_at)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT (user_id, conv_id) DO UPDATE SET
           title=excluded.title, messages=excluded.messages, updated_at=excluded.updated_at`
      ).run(c.user_id, c.conv_id, c.title, c.messages, c.created_at, c.updated_at);
    }

    // Streak
    const { rows: streaks } = await client.query('SELECT * FROM streak');
    for (const s of streaks) {
      db.prepare(
        `INSERT INTO streak (user_id, current, best, last_date)
         VALUES (?,?,?,?)
         ON CONFLICT (user_id) DO UPDATE SET
           current=excluded.current, best=excluded.best, last_date=excluded.last_date`
      ).run(s.user_id, s.current, s.best, s.last_date);
    }

    // Devotion scores
    const { rows: devs } = await client.query('SELECT * FROM devotion_scores');
    for (const d of devs) {
      db.prepare(
        `INSERT INTO devotion_scores (user_id, total)
         VALUES (?,?)
         ON CONFLICT (user_id) DO UPDATE SET total=excluded.total`
      ).run(d.user_id, d.total);
    }

    lastSyncAt = new Date().toISOString();
  } finally {
    client.release();
  }
}
