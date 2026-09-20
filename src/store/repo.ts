// Repository / CRUD layer over the SQLite store.
// UI never touches db.ts directly — it only uses the exported `r`.
import { getDb, type Item, type StoreItem, type NewStoreEntry, type BodyPhoto, type TryOn, type ItemCategory } from './db';

function nowIso(): string {
   return new Date().toISOString();
}
function tagsToRow(tags: string[]): string {
   return tags.join(',');
}
function rowToTags(raw: string): string[] {
   return raw ? raw.split(',').map((t) => t.trim()).filter(Boolean) : [];
}
function pathsToRow(paths: string[]): string {
   return paths.join('|');
}
function rowToPaths(raw: string): string[] {
   return raw ? raw.split('|').filter(Boolean) : [];
}

interface ItemRow {
   id: number;
   type: ItemCategory;
   name: string;
   color: string;
   tags: string;
   image_path: string;
   thumbnail_path: string | null;
   created_at: string;
}
function rowToItem(row: ItemRow): Item {
   return {
      id: row.id,
      type: row.type,
      name: row.name,
      color: row.color,
      tags: rowToTags(row.tags),
      imagePath: row.image_path,
      thumbnailPath: row.thumbnail_path,
      createdAt: row.created_at,
    };
}

export interface NewItem {
   type: ItemCategory;
   name: string;
   color: string;
   tags?: string[];
   imagePath: string;
   thumbnailPath?: string | null;
}

export interface Repo {
   getSetting(key: string): Promise<string | undefined>;
   setSetting(key: string, value: string): Promise<void>;
   setOnboarded(): Promise<void>;
   insertItem(input: NewItem): Promise<Item>;
   updateItem(id: number, patch: Partial<NewItem>): Promise<void>;
   deleteItem(id: number): Promise<void>;
   listItems(): Promise<Item[]>;
   getItem(id: number): Promise<Item | undefined>;
    listStoreItems(): Promise<StoreItem[]>;
    insertStoreItem(input: NewStoreEntry): Promise<StoreItem>;
   insertBodyPhoto(path: string): Promise<BodyPhoto>;
   insertTryOn(bodyPhotoId: number, itemId: number, transform: string, outputPath?: string | null): Promise<TryOn>;
   listTryOns(): Promise<TryOn[]>;
   deleteTryOn(id: number): Promise<void>;
}

function build(): Repo {
   async function getSetting(key: string): Promise<string | undefined> {
      const db = await getDb();
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
      return row?.value;
      }

   async function setSetting(key: string, value: string): Promise<void> {
      const db = await getDb();
      await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
      }

   async function setOnboarded(): Promise<void> {
      await setSetting('has_onboarded', '1');
      }

   async function insertItem(input: NewItem): Promise<Item> {
      const db = await getDb();
      const res = await db.runAsync(
      'INSERT INTO items (type, name, color, tags, image_path, thumbnail_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [input.type, input.name, input.color, tagsToRow(input.tags ?? []), input.imagePath, input.thumbnailPath ?? null, nowIso()],
      );
      const id = res.lastInsertRowId;
      const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?', [id]);
      if (!row) throw new Error('insertItem: row missing after insert');
      return rowToItem(row);
      }

   async function updateItem(id: number, patch: Partial<NewItem>): Promise<void> {
      const db = await getDb();
      await db.withTransactionAsync(async () => {
        if (patch.name !== undefined) await db.runAsync('UPDATE items SET name = ? WHERE id = ?', [patch.name, id]);
        if (patch.color !== undefined) await db.runAsync('UPDATE items SET color = ? WHERE id = ?', [patch.color, id]);
        if (patch.type !== undefined) await db.runAsync('UPDATE items SET type = ? WHERE id = ?', [patch.type, id]);
        if (patch.tags !== undefined) await db.runAsync('UPDATE items SET tags = ? WHERE id = ?', [tagsToRow(patch.tags), id]);
        if (patch.thumbnailPath !== undefined) await db.runAsync('UPDATE items SET thumbnail_path = ? WHERE id = ?', [patch.thumbnailPath, id]);
        });
      }

   async function deleteItem(id: number): Promise<void> {
      const db = await getDb();
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM try_ons WHERE item_id = ?', [id]);
        await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
        });
      }

   async function listItems(): Promise<Item[]> {
      const db = await getDb();
      const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY created_at DESC');
      return rows.map(rowToItem);
      }

   async function getItem(id: number): Promise<Item | undefined> {
      const db = await getDb();
      const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?', [id]);
      return row ? rowToItem(row) : undefined;
      }

   async function listStoreItems(): Promise<StoreItem[]> {
      const db = await getDb();
      const rows = await db.getAllAsync<StoreItemRow>('SELECT * FROM store_items ORDER BY name ASC');
      return rows.map((row) => ({
        id: row.id,
        source: 'catalog',
        name: row.name,
        category: row.category,
        color: row.color,
        imagePaths: rowToPaths(row.image_paths),
        specs: row.specs,
        createdAt: row.created_at,
        }));
      }

   async function insertStoreItem(input: NewStoreEntry): Promise<StoreItem> {
      const db = await getDb();
      const res = await db.runAsync(
       'INSERT INTO store_items (source, name, category, color, image_paths, specs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
       ['catalog', input.name, input.category, input.color, pathsToRow(input.imagePaths), input.specs ?? null, nowIso()],
       );
      const id = res.lastInsertRowId;
      const row = await db.getFirstAsync<StoreItemRow>('SELECT * FROM store_items WHERE id = ?', [id]);
      if (!row) throw new Error('insertStoreItem: row missing after insert');
      return {
        id,
        source: 'catalog',
        name: row.name,
        category: row.category,
        color: row.color,
        imagePaths: rowToPaths(row.image_paths),
        specs: row.specs,
        createdAt: row.created_at,
       };
      }

   async function insertBodyPhoto(path: string): Promise<BodyPhoto> {
      const db = await getDb();
      const res = await db.runAsync('INSERT INTO body_photos (path, created_at) VALUES (?, ?)', [path, nowIso()]);
      return { id: res.lastInsertRowId, path, createdAt: nowIso() };
      }

   async function insertTryOn(
        bodyPhotoId: number,
        itemId: number,
        transform: string,
        outputPath?: string | null,
      ): Promise<TryOn> {
      const db = await getDb();
      const res = await db.runAsync(
      'INSERT INTO try_ons (body_photo_id, item_id, transform, output_path, created_at) VALUES (?, ?, ?, ?, ?)',
      [bodyPhotoId, itemId, transform, outputPath ?? null, nowIso()],
      );
      return {
        id: res.lastInsertRowId,
        bodyPhotoId,
        itemId,
        transform,
        outputPath: outputPath ?? null,
        createdAt: nowIso(),
        };
      }

   async function listTryOns(): Promise<TryOn[]> {
      const db = await getDb();
      const rows = await db.getAllAsync<Row>('SELECT * FROM try_ons ORDER BY created_at DESC');
      return rows.map((row) => ({
        id: row.id,
        bodyPhotoId: row.body_photo_id,
        itemId: row.item_id,
        transform: row.transform,
        outputPath: row.output_path,
        createdAt: row.created_at,
        }));
      }

   async function deleteTryOn(id: number): Promise<void> {
      const db = await getDb();
      await db.runAsync('DELETE FROM try_ons WHERE id = ?', [id]);
      }

   return {
      getSetting,
      setSetting,
      setOnboarded,
      insertItem,
      updateItem,
      deleteItem,
      listItems,
      getItem,
      listStoreItems,
      insertStoreItem,
      insertBodyPhoto,
      insertTryOn,
      listTryOns,
      deleteTryOn,
};
}

interface StoreItemRow {
   id: number;
   source: string;
   name: string;
   category: ItemCategory;
   color: string;
   image_paths: string;
   specs: string | null;
   created_at: string;
}
interface Row {
   id: number;
   body_photo_id: number;
   item_id: number;
   transform: string;
   output_path: string | null;
   created_at: string;
}

export const r: Repo = build();
