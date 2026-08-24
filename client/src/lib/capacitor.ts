/**
 * Capacitor (iOS) adapter — interfaces with native SQLite + Local Notifications.
 * This file is only imported when running inside a Capacitor shell (iOS).
 */

import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { LocalNotifications } from '@capacitor/local-notifications';

/** True if running inside a Capacitor shell (iOS/Android) */
export const isCapacitor = Capacitor.isNativePlatform();

/** Platform identifier: 'ios', 'android', or 'web' */
export const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

// ── SQLite helpers ──────────────────────────────────────────

let dbReady = false;
const DB_NAME = 'nour';

async function openDb(name: string): Promise<SQLiteDBConnection> {
  const conn = new SQLiteDBConnection(name, false, CapacitorSQLite);
  await conn.open();
  return conn;
}

/** Initialize the native SQLite database (call once at app startup) */
export async function initNativeSqlite(): Promise<void> {
  if (!isCapacitor || dbReady) return;
  try {
    const conn = await openDb(DB_NAME);
    dbReady = true;
    await conn.close();
  } catch { /* ignore */ }
}

/** Run a write query (INSERT/UPDATE/DELETE) */
export async function sqliteRun(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
  const conn = await openDb(DB_NAME);
  try {
    const result = await conn.run(sql, params);
    const ch = typeof result.changes === "number" ? result.changes : (result.changes as any)?.changes ?? 0;
    return { changes: ch };
  } finally {
    await conn.close();
  }
}

/** Run a read query (SELECT) */
export async function sqliteQuery<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const conn = await openDb(DB_NAME);
  try {
    const result = await conn.query(sql, params);
    return (result.values ?? []) as T[];
  } finally {
    await conn.close();
  }
}

/** Execute DDL (CREATE TABLE, etc.) */
export async function sqliteExec(sql: string): Promise<void> {
  const conn = await openDb(DB_NAME);
  try {
    await conn.execute(sql);
  } finally {
    await conn.close();
  }
}

// ── Notifications helpers ───────────────────────────────────

/** Request permission for local notifications */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isCapacitor) return false;
  const perm = await LocalNotifications.requestPermissions();
  return perm.display === 'granted';
}

/** Schedule a single local notification */
export async function scheduleNotification(opts: {
  title: string;
  body: string;
  id?: number;
  clickUrl?: string;
}): Promise<void> {
  if (!isCapacitor) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await LocalNotifications.schedule({
    notifications: [
      {
        title: opts.title,
        body: opts.body,
        id: opts.id ?? Math.floor(Date.now() / 1000),
        sound: 'default',
      },
    ],
  });
}

// ── DATABASE_URL config (stored in native preferences) ──────

/** Get the DATABASE_URL from native secure storage */
export async function getNativeDatabaseUrl(): Promise<string> {
  if (!isCapacitor) return '';
  const { Preferences } = await import('@capacitor/preferences');
  const { value } = await Preferences.get({ key: 'databaseUrl' });
  return value || '';
}

/** Save the DATABASE_URL to native secure storage */
export async function setNativeDatabaseUrl(url: string): Promise<void> {
  if (!isCapacitor) return;
  const { Preferences } = await import('@capacitor/preferences');
  if (url) {
    await Preferences.set({ key: 'databaseUrl', value: url });
  } else {
    await Preferences.remove({ key: 'databaseUrl' });
  }
}
