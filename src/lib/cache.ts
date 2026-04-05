import * as SQLite from 'expo-sqlite';

export class LocalCache {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('beachfinder_cache.db');
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) return null;
    const row = await this.db.getFirstAsync<{ value: string; expires_at: number }>(
      'SELECT value, expires_at FROM cache WHERE key = ?',
      key,
    );
    if (!row) return null;
    if (row.expires_at < Date.now()) {
      await this.db.runAsync('DELETE FROM cache WHERE key = ?', key);
      return null;
    }
    return JSON.parse(row.value) as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync(
      'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)',
      key,
      JSON.stringify(value),
      Date.now() + ttlMs,
    );
  }

  async delete(key: string): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM cache WHERE key = ?', key);
  }

  async clearAll(): Promise<void> {
    if (!this.db) return;
    await this.db.execAsync('DELETE FROM cache');
  }

  async clearExpired(): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM cache WHERE expires_at < ?', Date.now());
  }
}

export const localCache = new LocalCache();
