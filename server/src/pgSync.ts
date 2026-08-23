// Adaptateur PostgreSQL présentant la même API synchrone que node:sqlite.
import { Worker } from 'node:worker_threads';
import { translateExec } from './pgSql.js';
import { PG_SCHEMA } from './pgSchema.js';

const PAYLOAD_OFFSET = 64;
const BUFFER_SIZE = 32 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 60_000;
const SLEEP_MS = 25;

export interface SyncStatement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface SyncDb {
  prepare(sql: string): SyncStatement;
  exec(sql: string): void;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const sleepBuffer = new SharedArrayBuffer(4);
const sleepView = new Int32Array(sleepBuffer);

export function createPgDb(databaseUrl: string): SyncDb {
  const sab = new SharedArrayBuffer(BUFFER_SIZE);
  const view = new Int32Array(sab, 0, 2);
  let broken = false;
  let fatalError = '';

  // En développement, tsx exécute directement les fichiers .ts ; en production,
  // le build serveur fournit le .js correspondant.
  const workerUrl = import.meta.url.endsWith('.ts')
    ? new URL('./pgWorker.ts', import.meta.url)
    : new URL('./pgWorker.js', import.meta.url);
  const worker = new Worker(workerUrl, {
    workerData: { databaseUrl, sab },
    execArgv: process.execArgv,
  });
  worker.unref();
  worker.on('error', (error) => {
    broken = true;
    fatalError = error.message;
    Atomics.store(view, 0, 6);
    Atomics.notify(view, 0, 1);
  });
  worker.on('exit', (code) => {
    if (code !== 0) {
      broken = true;
      fatalError ||= `worker PostgreSQL arrêté (code ${code})`;
      Atomics.store(view, 0, 6);
      Atomics.notify(view, 0, 1);
    }
  });

  const fail = (message: string): never => {
    broken = true;
    fatalError = message;
    throw new Error('Base de données injoignable : ' + message);
  };

  function assertAlive(): void {
    if (broken) fail(fatalError || 'worker arrêté');
  }

  function readPayload(length: number): string {
    return decoder.decode(new Uint8Array(sab, PAYLOAD_OFFSET, length));
  }

  function call(request: unknown): unknown {
    assertAlive();
    const encoded = encoder.encode(JSON.stringify(request));
    if (encoded.byteLength + PAYLOAD_OFFSET > sab.byteLength) {
      throw new Error('Requête trop grande pour le tampon partagé.');
    }
    new Uint8Array(sab, PAYLOAD_OFFSET, encoded.byteLength).set(encoded);
    Atomics.store(view, 1, encoded.byteLength);
    Atomics.store(view, 0, 1);
    Atomics.notify(view, 0, 1);

    const waited = Atomics.wait(view, 0, 1, REQUEST_TIMEOUT_MS);
    if (waited === 'timed-out') {
      try { void worker.terminate(); } catch { /* déjà arrêté */ }
      return fail('délai de requête dépassé');
    }

    const status = Atomics.load(view, 0);
    const length = Atomics.load(view, 1);
    const raw = readPayload(length);
    Atomics.store(view, 0, 0);
    Atomics.notify(view, 0, 1);

    let result: { error?: string; [key: string]: unknown };
    try {
      result = JSON.parse(raw) as { error?: string; [key: string]: unknown };
    } catch {
      return fail('réponse PostgreSQL invalide');
    }
    if (status === 6) return fail(result.error ?? 'connexion impossible');
    if (status === 3) throw new Error(result.error ?? 'Erreur PostgreSQL.');
    if (status !== 2) return fail(`état worker inattendu (${status})`);
    return result;
  }

  function runExec(sql: string): void {
    // Les transactions sont traitées statement par statement pour conserver
    // la compatibilité avec les appels db.exec existants.
    for (const statement of translateExec(sql)) call({ kind: 'exec', sql: statement, params: [] });
  }

  const startedAt = Date.now();
  for (;;) {
    const status = Atomics.load(view, 0);
    if (status === 5) {
      // Le worker reste en attente sur l'état 0 après le handshake.
      Atomics.store(view, 0, 0);
      Atomics.notify(view, 0, 1);
      break;
    }
    if (status === 6) {
      const length = Atomics.load(view, 1);
      let message = 'connexion impossible';
      try { message = (JSON.parse(readPayload(length)) as { error?: string }).error ?? message; } catch { /* ignore */ }
      return fail(message);
    }
    assertAlive();
    if (Date.now() - startedAt > REQUEST_TIMEOUT_MS) return fail("délai d'attente de connexion dépassé");
    Atomics.wait(sleepView, 0, 0, SLEEP_MS);
  }

  runExec(PG_SCHEMA);

  return {
    exec: runExec,
    prepare(sql: string): SyncStatement {
      return {
        run(...params) {
          return call({ kind: 'run', sql, params }) as { changes: number; lastInsertRowid: number };
        },
        get(...params) {
          return call({ kind: 'get', sql, params });
        },
        all(...params) {
          return call({ kind: 'all', sql, params }) as unknown[];
        },
      };
    },
  };
}
