const DB_NAME = 'nour-cache';
const STORE = 'cache';
let dbReady: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbReady) return dbReady;
  dbReady = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB error'));
  });
  return dbReady;
}

export async function dbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function dbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silencieux si IndexedDB pas dispo
  }
}
