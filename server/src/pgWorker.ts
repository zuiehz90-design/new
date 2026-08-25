// Worker thread PostgreSQL pour conserver l'API synchrone de node:sqlite.
// status: 0 idle, 1 requête, 2 résultat, 3 erreur, 5 connecté, 6 erreur fatale.
import { workerData } from 'node:worker_threads';
import pg from 'pg';
import { translateSql, translateExec } from './pgSql.js';

interface InitData {
  databaseUrl: string;
  sab: SharedArrayBuffer;
}

const { Client } = pg;
const init = workerData as InitData;
const sab = init.sab;
const view = new Int32Array(sab, 0, 2);
const payloadOffset = 64;
const bytes = new TextEncoder();
const text = new TextDecoder();

function writePayload(value: unknown, status: number): void {
  const json = JSON.stringify(value) ?? 'null';
  const encoded = bytes.encode(json);
  const capacity = sab.byteLength - payloadOffset;
  if (encoded.byteLength > capacity) {
    const fallback = bytes.encode(JSON.stringify({ error: 'Réponse trop grande pour le tampon partagé.' }));
    new Uint8Array(sab, payloadOffset, fallback.byteLength).set(fallback);
    Atomics.store(view, 1, fallback.byteLength);
    Atomics.store(view, 0, 3);
  } else {
    new Uint8Array(sab, payloadOffset, encoded.byteLength).set(encoded);
    Atomics.store(view, 1, encoded.byteLength);
    Atomics.store(view, 0, status);
  }
  Atomics.notify(view, 0, 1);
}

const COUNT_KEYS = new Set([
  'n', 'count', 'total', 'cnt',
  'total_prayers', 'quest_points', 'quests_done',
  'today_prayers', 'lifetime_quests', 'lifetime_prayers',
]);
function coerceRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    for (const key of Object.keys(row)) {
      if (COUNT_KEYS.has(key) && typeof row[key] === 'string' && /^-?\d+$/.test(row[key] as string)) {
        row[key] = Number(row[key]);
      }
    }
    return row;
  });
}

let client: pg.Client | null = null;
let needsReconnect = false;

/** Détecte les erreurs de connexion (vs erreurs SQL) : seul ce cas déclenche une reconnexion. */
function isConnectionError(err: unknown): boolean {
  const e = err as { message?: string; code?: string };
  const msg = String(e?.message ?? e ?? '');
  const code = String(e?.code ?? '');
  return (
    code === 'ECONNRESET' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT' ||
    code === 'EPIPE' || code === 'EHOSTUNREACH' ||
    code === '57P01' || code === '57P02' || code === '57P03' ||
    code === '08006' || code === '08003' || code === '08001' ||
    msg.includes('not queryable') ||
    msg.includes('Connection terminated') ||
    msg.includes('connection error') ||
    msg.includes('terminated unexpectedly') ||
    msg.includes('socket hang up') ||
    msg.includes('ECONNRESET') ||
    msg.includes('Client has encountered') ||
    msg.includes('server closed the connection') ||
    msg.includes('server conn crashed') ||
    msg.includes('connection terminated')
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * (Re)connecte le client PostgreSQL avec retries et backoff.
 * Neon ferme les connexions inactives : sans reconnexion, le serveur
 * reste bloqué avec « Client has encountered a connection error ».
 */
async function connectWithRetry(): Promise<void> {
  let lastErr: unknown = new Error('connexion impossible');
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const useSsl = /[?&]sslmode=(require|verify-ca|verify-full)/i.test(init.databaseUrl) || /neon.tech/i.test(init.databaseUrl);
      const c = new pg.Client({
        connectionString: init.databaseUrl,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 15_000,
        query_timeout: 60_000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10_000,
      });
      c.on('error', () => {
        // La connexion a été coupée : les requêtes suivantes doivent reconnecter.
        needsReconnect = true;
      });
      await c.connect();
      client = c;
      needsReconnect = false;
      return;
    } catch (error) {
      lastErr = error;
      if (attempt < 5) await sleep(400 * attempt);
    }
  }
  throw lastErr;
}

/** Exécute une requête en reconnectant automatiquement si la connexion est morte. */
async function executeWithReconnect(kind: string, sql: string, params: unknown[]): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (needsReconnect || !client) await connectWithRetry();
    try {
      return await execute(kind, sql, params);
    } catch (err) {
      if (!isConnectionError(err) || attempt >= 2) throw err;
      needsReconnect = true;
    }
  }
  throw new Error('connexion impossible après plusieurs tentatives');
}

async function execute(kind: string, rawSql: string, params: unknown[]): Promise<unknown> {
  if (!client) throw new Error('PostgreSQL non connecté.');
  if (kind === 'exec') {
    const statements = translateExec(rawSql);
    if (statements.length > 0) await client.query(statements.join(';\n'));
    return { ok: true };
  }

  const translated = translateSql(rawSql, params);
  const result = await client.query(translated.sql, translated.values);

  if (kind === 'run') {
    const first = result.rows[0] as Record<string, unknown> | undefined;
    return {
      changes: result.rowCount ?? 0,
      lastInsertRowid: first && 'id' in first ? Number(first.id) : 0,
    };
  }
  if (kind === 'get') {
    return coerceRows(result.rows as Record<string, unknown>[])[0];
  }
  return coerceRows(result.rows as Record<string, unknown>[]);
}

async function main(): Promise<void> {
  try {
    await connectWithRetry();
  } catch (error) {
    const err = error as Error & { code?: string };
    writePayload({ error: err.message || err.code || String(error) }, 6);
    return;
  }

  Atomics.store(view, 0, 5);
  Atomics.notify(view, 0, 1);

  for (;;) {
    // Le thread est réveillé par le thread principal lorsqu'une requête arrive.
    Atomics.wait(view, 0, 0);
    if (Atomics.load(view, 0) !== 1) continue;

    try {
      const length = Atomics.load(view, 1);
      const request = JSON.parse(text.decode(new Uint8Array(sab, payloadOffset, length))) as {
        kind: string;
        sql: string;
        params?: unknown[];
      };
      writePayload(await executeWithReconnect(request.kind, request.sql, request.params ?? []), 2);
    } catch (error) {
      writePayload({ error: (error as Error).message || String(error) }, 3);
    }
  }
}

void main();
