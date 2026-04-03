/**
 * Lightweight IndexedDB wrapper for offline data persistence.
 * Stores key-value pairs so the app can show cached content when offline.
 */

const DB_NAME = 'superapp-offline';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('expiresAt', 'expiresAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

interface CacheEntry<T> {
  key: string;
  data: T;
  savedAt: number;
  expiresAt: number;
}

/** Save a value with optional TTL (default 24 h) */
export async function saveOffline<T>(key: string, data: T, ttlMs = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const entry: CacheEntry<T> = {
      key,
      data,
      savedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    tx.objectStore(STORE_NAME).put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail — offline storage is best-effort
  }
}

/** Read a cached value; returns null if expired or missing */
export async function loadOffline<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    const entry = await new Promise<CacheEntry<T> | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as CacheEntry<T> | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) return null;
    return entry.data;
  } catch {
    return null;
  }
}

/** Delete a cached key */
export async function removeOffline(key: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch {
    // Silently fail
  }
}

/** Clear all expired entries (call periodically) */
export async function pruneExpired(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('expiresAt');
    const range = IDBKeyRange.upperBound(Date.now());
    const req = index.openCursor(range);
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch {
    // Silently fail
  }
}
