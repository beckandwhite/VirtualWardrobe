import * as SQLite from 'expo-sqlite';

export type ItemCategory =
    | 'top'
    | 'bottom'
    | 'dress'
    | 'outerwear'
    | 'shoes'
    | 'other';

export interface Item {
   id: number;
   type: ItemCategory;
   name: string;
   color: string;
   tags: string[];
   imagePath: string;
   thumbnailPath: string | null;
   createdAt: string;
}

export interface StoreItem {
   id: number;
   source: 'catalog';
   name: string;
   category: ItemCategory;
   color: string;
   imagePaths: string[];
   specs: string | null;
   createdAt: string;
}

// Catalog entry as it is persisted into `store_items`. Mirrors the bundled
// `assets/store.json` shape minus the manifest slug `id` (the row gets its own
// autoincrement `id`); `specs` is optional on the manifest, coerced to null.
export interface NewStoreEntry {
   name: string;
   category: ItemCategory;
   color: string;
   imagePaths: string[];
   specs?: string | null;
}

export interface BodyPhoto {
   id: number;
   path: string;
   createdAt: string;
}

export interface TryOn {
   id: number;
   bodyPhotoId: number;
   itemId: number;
   transform: string;
   outputPath: string | null;
   createdAt: string;
}

const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initialized = false;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
   if (!dbPromise) {
      dbPromise = SQLite.openDatabaseAsync('virtual_wardrobe.db');
     }
   return dbPromise;
}

export async function initStore(): Promise<void> {
   const db = await getDb();
   if (initialized) return;
   initialized = true;

    // 1. Always-existing settings table (bootstraps the app state).
   await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
       );
     INSERT OR IGNORE INTO app_settings (key, value) VALUES
         ('has_onboarded', '0'),
          ('catalog_ingested', '0'),
          ('language', 'en');
   `);

    // 2. Schema-versioned migrations.
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', ['schema_version']);
    const current = row ? parseInt(row.value, 10) : 0;

    if (current < 1) {
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '',
        image_path TEXT NOT NULL,
        thumbnail_path TEXT,
        created_at TEXT NOT NULL
       );
      CREATE TABLE IF NOT EXISTS store_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL DEFAULT 'catalog',
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        color TEXT NOT NULL,
        image_paths TEXT NOT NULL DEFAULT '',
        specs TEXT,
        created_at TEXT NOT NULL
       );
      CREATE TABLE IF NOT EXISTS body_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        created_at TEXT NOT NULL
       );
      CREATE TABLE IF NOT EXISTS try_ons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        body_photo_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        transform TEXT NOT NULL,
        output_path TEXT,
        created_at TEXT NOT NULL
       );
   `);
        await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['schema_version', String(SCHEMA_VERSION)]);
     }
}
