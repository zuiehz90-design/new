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

const COUNT_KEYS = new Set(['n', 'count', 'total', 'cnt']);
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

let client: pg.Client;

async function execute(kind: string, rawSql: string, params: unknown[]): Promise<unknown> {
  if (kind === 'exec') {
    for (const statement of translateExec(rawSql)) await client.query(statement);
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
    const useSsl = /[?&]sslmode=(require|verify-ca|verify-full)/i.test(init.databaseUrl) || /neon\.tech/i.test(init.databaseUrl);
    client = new Client({
      connectionString: init.databaseUrl,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 15_000,
      query_timeout: 60_000,
    });
    client.on('error', () => {
      // Les requêtes suivantes reçoivent une erreur explicite.
    });
    await client.connect();
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { message?: string };
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
      writePayload(await execute(request.kind, request.sql, request.params ?? []), 2);
    } catch (error) {
      writePayload({ error: (error as Error).message || String(error) }, 3);
    }
  }
}

void main();
