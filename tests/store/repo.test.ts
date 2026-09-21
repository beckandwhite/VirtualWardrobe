import { r } from '../../src/store/repo';

// QA-1 · Repository / SQLite regression suite.
//
// The repository layer (src/store/repo.ts) is the app's persistence boundary:
// onboarding state, wardrobe items, catalog rows, body photos, and saved
// try-ons all flow through it. These tests exercise the *real* repo logic
// (serialization, row→domain conversion, ordering, cascade deletes, missing-row
// handling) against a faithful in-memory fake of the expo-sqlite surface, with
// zero device / native / wasm dependency.
//
// The fake implements exactly the four methods repo.ts calls —
// getFirstAsync / getAllAsync / runAsync / withTransactionAsync — plus execAsync
// (a no-op schema step) so the repo's row/serialization behavior is asserted on
// real data shapes without a live database.

interface Row {
    [key: string]: unknown;
}

// A minimal, behaviorally-faithful stand-in for expo-sqlite's SQLiteDatabase.
// Tables are keyed by the snake_case schema in src/store/db.ts. `seq` mirrors the
// AUTOINCREMENT primary keys; `failFirstAfterInsert` injects the "row vanished
// after insert" fault to assert the repo's missing-row error path.
function makeFakeDb() {
    const tables = {
       app_settings: new Map<string, string>(),
       items: [] as Row[],
       store_items: [] as Row[],
       body_photos: [] as Row[],
       try_ons: [] as Row[],
      };
    const seq = { items: 0, store_items: 0, body_photos: 0, try_ons: 0 };

    const norm = (sql: string): string => sql.replace(/\s+/g, ' ').trim();
    const find = (rows: Row[], id: number): Row | undefined => rows.find((r) => r.id === id);

    let failFirstAfterInsert = false;

    async function getFirstAsync<T>(sql: string, params: unknown[]): Promise<T | null> {
       const q = norm(sql);
       if (q.startsWith('SELECT value FROM app_settings ')) {
          const key = params[0] as string;
          return tables.app_settings.has(key) ? ({ value: tables.app_settings.get(key) } as T) : null;
        }
       if (q.startsWith('SELECT * FROM items ')) {
          if (failFirstAfterInsert) return null;
          return (find(tables.items, params[0] as number) as T | undefined) ?? null;
        }
       if (q.startsWith('SELECT * FROM store_items ')) {
          return (find(tables.store_items, params[0] as number) as T | undefined) ?? null;
        }
       return null;
        }

    async function getAllAsync<T>(sql: string): Promise<T[]> {
       const q = norm(sql);
       if (q.startsWith('SELECT * FROM items ')) {
          return tables.items
           .slice()
           .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))) as T[];
          }
       if (q.startsWith('SELECT * FROM store_items ')) {
          return tables.store_items
           .slice()
           .sort((a, b) => String(a.name).localeCompare(String(b.name))) as T[];
          }
       if (q.startsWith('SELECT * FROM try_ons ')) {
          return tables.try_ons
           .slice()
           .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))) as T[];
          }
       return [];
        }

    function setFailAfterInsert(v: boolean): void {
       failFirstAfterInsert = v;
          }

    async function runAsync(sql: string, params: unknown[]): Promise<{ lastInsertRowId: number; changes: number }> {
       const q = norm(sql);

       if (q.startsWith('INSERT OR REPLACE INTO app_settings ')) {
          tables.app_settings.set(params[0] as string, params[1] as string);
          return { lastInsertRowId: 0, changes: 1 };
          }

       if (q.startsWith('INSERT INTO items ')) {
          const row: Row = {
            id: ++seq.items,
            type: params[0],
            name: params[1],
            color: params[2],
            tags: params[3],
            image_path: params[4],
            thumbnail_path: params[5],
            created_at: params[6],
            };
          tables.items.push(row);
          return { lastInsertRowId: row.id as unknown as number, changes: 1 };
          }

       if (q.startsWith('UPDATE items SET ')) {
          const target = find(tables.items, params[1] as number);
          if (!target) return { lastInsertRowId: 0, changes: 0 };
          if (q.includes('name = ?')) target.name = params[0];
          if (q.includes('color = ?')) target.color = params[0];
          if (q.includes('type = ?')) target.type = params[0];
          if (q.includes('tags = ?')) target.tags = params[0];
          if (q.includes('thumbnail_path = ?')) target.thumbnail_path = params[0];
          return { lastInsertRowId: target.id as unknown as number, changes: 1 };
          }

       if (q === 'DELETE FROM try_ons WHERE item_id = ?') {
          const id = params[0] as number;
          tables.try_ons = tables.try_ons.filter((row) => row.item_id !== id);
          return { lastInsertRowId: 0, changes: 1 };
          }

       if (q === 'DELETE FROM items WHERE id = ?') {
          const id = params[0] as number;
          tables.items = tables.items.filter((row) => row.id !== id);
          return { lastInsertRowId: 0, changes: 1 };
          }

       if (q === 'DELETE FROM try_ons WHERE id = ?') {
          const id = params[0] as number;
          tables.try_ons = tables.try_ons.filter((row) => row.id !== id);
          return { lastInsertRowId: 0, changes: 1 };
          }

       if (q.startsWith('INSERT INTO store_items ')) {
          const row: Row = {
            id: ++seq.store_items,
            source: params[0],
            name: params[1],
            category: params[2],
            color: params[3],
            image_paths: params[4],
            specs: params[5],
            created_at: params[6],
            };
          tables.store_items.push(row);
          return { lastInsertRowId: row.id as unknown as number, changes: 1 };
          }

       if (q.startsWith('INSERT INTO body_photos ')) {
          const row: Row = { id: ++seq.body_photos, path: params[0], created_at: params[1] };
          tables.body_photos.push(row);
          return { lastInsertRowId: row.id as unknown as number, changes: 1 };
          }

       if (q.startsWith('INSERT INTO try_ons ')) {
          const row: Row = {
            id: ++seq.try_ons,
            body_photo_id: params[0],
            item_id: params[1],
            transform: params[2],
            output_path: params[3],
            created_at: params[4],
            };
          tables.try_ons.push(row);
          return { lastInsertRowId: row.id as unknown as number, changes: 1 };
          }

       throw new Error(`FakeDb.runAsync: unhandled statement: ${q}`);
        }

    return {
       tables,
       getFirstAsync,
       getAllAsync,
       runAsync,
       setFailAfterInsert,
       withTransactionAsync: async (task: () => Promise<void>): Promise<void> => {
          await task();
           },
       execAsync: async (): Promise<void> => undefined,
       };
    }

// The repo resolves its db lazily via db.ts's getDb(); the test swaps the active
// fake per case. `mockDb` is the name Jest's out-of-scope guard allows the
// jest.mock factory to reference.
let mockDb: ReturnType<typeof makeFakeDb> | null = null;

jest.mock('../../src/store/db', () => ({
    getDb: jest.fn(async () => mockDb!),
     }));

// Seed raw rows (as stored) to assert the repo's row→domain conversion on real,
// occasionally malformed, data shapes.
function seedItem(table: ReturnType<typeof makeFakeDb>['tables'], row: Row): void {
    table.items.push(row);
}
function seedStore(table: ReturnType<typeof makeFakeDb>['tables'], row: Row): void {
    table.store_items.push(row);
}
function seedTryOn(table: ReturnType<typeof makeFakeDb>['tables'], row: Row): void {
    table.try_ons.push(row);
}

describe('QA-1 · repository / SQLite regressions', () => {
    let db: ReturnType<typeof makeFakeDb>;

    beforeEach(() => {
       db = makeFakeDb();
       mockDb = db;
        });

    // ── Suite A · settings + onboarding ──────────────────────────────────────
    describe('settings & onboarding', () => {
       it('returns undefined for a missing setting key', async () => {
          expect(await r.getSetting('does_not_exist')).toBeUndefined();
          });

       it('persists and reads back a key/value via setSetting', async () => {
          await r.setSetting('theme', 'dark');
          expect(await r.getSetting('theme')).toBe('dark');
          });

       it('replaces a value rather than duplicating the row on re-write', async () => {
          await r.setSetting('theme', 'dark');
          await r.setSetting('theme', 'light');
          expect(await r.getSetting('theme')).toBe('light');
          expect(db.tables.app_settings.get('theme')).toBe('light');
          expect([...db.tables.app_settings.keys()]).toEqual(['theme']);
          });

       it('setOnboarded writes the has_onboarded flag and is idempotent', async () => {
          expect(await r.getSetting('has_onboarded')).toBeUndefined();
          await r.setOnboarded();
          expect(await r.getSetting('has_onboarded')).toBe('1');
          await r.setOnboarded(); // repeated call must not corrupt / duplicate
          expect(db.tables.app_settings.get('has_onboarded')).toBe('1');
          expect([...db.tables.app_settings.keys()]).toEqual(['has_onboarded']);
          });
       });

    // ── Suite B · item CRUD lifecycle ────────────────────────────────────────
    describe('item CRUD', () => {
       it('insertItem returns a typed Item with tags serialized then restored', async () => {
          const item = await r.insertItem({
             name: 'Classic White Tee',
             type: 'top',
             color: 'white',
             tags: ['casual', 'summer'],
             imagePath: 'file://wardrobe/tee.png',
             thumbnailPath: 'file://wardrobe/tee-thumb.png',
            });
          expect(item).toMatchObject({
             id: 1,
             type: 'top',
             name: 'Classic White Tee',
             color: 'white',
             tags: ['casual', 'summer'],
             imagePath: 'file://wardrobe/tee.png',
             thumbnailPath: 'file://wardrobe/tee-thumb.png',
            });
          expect(item.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp
          });

       it('insertItem defaults an omitted tags list to an empty array', async () => {
          const item = await r.insertItem({
             name: 'Plain Tee',
             type: 'top',
             color: 'white',
             imagePath: 'file://wardrobe/plain.png',
            });
          expect(item.tags).toEqual([]);
          expect(item.thumbnailPath).toBeNull();
          });

       it('listItems returns rows in descending created_at order', async () => {
          seedItem(db.tables, {
             id: 1, type: 'top', name: 'Old', color: 'x', tags: '', image_path: 'a', thumbnail_path: null, created_at: '2020-01-01T00:00:00Z',
            });
          seedItem(db.tables, {
             id: 2, type: 'top', name: 'New', color: 'x', tags: '', image_path: 'b', thumbnail_path: null, created_at: '2020-01-03T00:00:00Z',
            });
          seedItem(db.tables, {
             id: 3, type: 'top', name: 'Mid', color: 'x', tags: '', image_path: 'c', thumbnail_path: null, created_at: '2020-01-02T00:00:00Z',
            });
          const out = await r.listItems();
          expect(out.map((i) => i.name)).toEqual(['New', 'Mid', 'Old']);
          });

       it('getItem returns the matching domain object for a valid id', async () => {
          const created = await r.insertItem({ name: 'T', type: 'dress', color: 'red', imagePath: 'p' });
          const got = await r.getItem(created.id);
          expect(got).toMatchObject({ id: created.id, name: 'T', type: 'dress' });
          });

       it('getItem returns undefined for an unknown id', async () => {
          expect(await r.getItem(999)).toBeUndefined();
          });

       it('updateItem mutates only the patched fields, preserving the rest', async () => {
          const item = await r.insertItem({
             name: 'Tee',
             type: 'top',
             color: 'white',
             tags: ['old'],
             imagePath: 'img',
             thumbnailPath: 'thumb',
            });
          await r.updateItem(item.id, { color: 'black', name: 'Renamed' });
          const got = await r.getItem(item.id);
          expect(got).toMatchObject({
             name: 'Renamed',
             color: 'black',
             type: 'top', // untouched
             tags: ['old'], // untouched
            });
          });

       it('updateItem rewrites the serialized tags row', async () => {
          const item = await r.insertItem({ name: 'T', type: 'top', color: 'c', tags: ['a'], imagePath: 'p' });
          await r.updateItem(item.id, { tags: ['b', 'c'] });
          expect(await r.getItem(item.id)).toMatchObject({ tags: ['b', 'c'] });
          });

       it('updateItem with an empty patch leaves every field intact', async () => {
          const item = await r.insertItem({ name: 'Stable', type: 'top', color: 'white', tags: ['x'], imagePath: 'p' });
          await r.updateItem(item.id, {});
          const got = await r.getItem(item.id);
          expect(got).toMatchObject({ name: 'Stable', color: 'white', tags: ['x'] });
          });

       it('deleteItem cascades to the related try_ons and spares other items', async () => {
          const doomed = await r.insertItem({ name: 'Doomed', type: 'top', color: 'red', imagePath: 'd' });
          const survivor = await r.insertItem({ name: 'Survivor', type: 'top', color: 'blue', imagePath: 's' });
          const photo = await r.insertBodyPhoto('file://body.png');
          await r.insertTryOn(photo.id, doomed.id, '{x:0}', 'file://out.png');
          await r.insertTryOn(photo.id, survivor.id, '{x:1}', 'file://out.png');

          await r.deleteItem(doomed.id);

          expect(await r.getItem(doomed.id)).toBeUndefined();
          // Only the doomed item's try-on is removed.
          const remaining = await r.listTryOns();
          expect(remaining).toHaveLength(1);
          expect(remaining[0].itemId).toBe(survivor.id);
          // The survivor item is untouched.
          expect(await r.getItem(survivor.id)).toMatchObject({ id: survivor.id });
          });
       });

    // ── Suite C · catalog store-item persistence ──────────────────────────────
    describe('catalog store items', () => {
       it('insertStoreItem stores metadata and returns a catalog-sourced StoreItem', async () => {
          const row = await r.insertStoreItem({
             name: 'Cotton Shirt',
             category: 'top',
             color: 'white',
             imagePaths: ['assets/store/shirt-1.png', 'assets/store/shirt-2.png'],
             specs: '100% cotton',
            });
          expect(row).toMatchObject({
             source: 'catalog',
             name: 'Cotton Shirt',
             category: 'top',
             color: 'white',
             imagePaths: ['assets/store/shirt-1.png', 'assets/store/shirt-2.png'],
             specs: '100% cotton',
            });
          });

       it('listStoreItems orders by name ascending', async () => {
          seedStore(db.tables, { id: 1, source: 'catalog', name: 'Zebra', category: 'top', color: 'z', image_paths: '', specs: null, created_at: '2020-01-01T00:00:00Z' });
          seedStore(db.tables, { id: 2, source: 'catalog', name: 'Apple', category: 'top', color: 'a', image_paths: '', specs: null, created_at: '2020-01-02T00:00:00Z' });
          seedStore(db.tables, { id: 3, source: 'catalog', name: 'Mango', category: 'top', color: 'm', image_paths: '', specs: null, created_at: '2020-01-03T00:00:00Z' });
          expect((await r.listStoreItems()).map((s) => s.name)).toEqual(['Apple', 'Mango', 'Zebra']);
          });

       it('preserves a null specs value through the round-trip', async () => {
          const row = await r.insertStoreItem({ name: 'Tee', category: 'top', color: 'white', imagePaths: [] });
          expect(row.specs).toBeNull();
          });

       it('treats empty imagePaths as an empty array, not a corrupted path', async () => {
          const row = await r.insertStoreItem({ name: 'No Images', category: 'shoes', color: 'black', imagePaths: [] });
          expect(row.imagePaths).toEqual([]);
          });

       it('drops empty path fragments but keeps non-empty ones stored in the row', async () => {
          seedStore(db.tables, { id: 5, source: 'catalog', name: 'Weird', category: 'top', color: 'x', image_paths: 'a||b|', specs: null, created_at: '2020-01-01T00:00:00Z' });
          const out = await r.listStoreItems();
          expect(out[0].imagePaths).toEqual(['a', 'b']);
           });
       });

    // ── Suite D · body photos & try-ons ──────────────────────────────────────
    describe('body photos & try-ons', () => {
       it('insertBodyPhoto returns a record with id, path and ISO timestamp', async () => {
          const photo = await r.insertBodyPhoto('file://body-1.png');
          expect(photo).toMatchObject({ id: 1, path: 'file://body-1.png' });
          expect(photo.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
          });

       it('insertTryOn persists the transform blob and returns a typed TryOn', async () => {
          const transform = JSON.stringify({ x: 0.3, y: 0.4, scale: 1.2, rotation: 5, opacity: 0.9 });
          const tryOn = await r.insertTryOn(1, 2, transform, 'file://out.png');
          expect(tryOn).toMatchObject({ bodyPhotoId: 1, itemId: 2, transform, outputPath: 'file://out.png', id: 1 });
          expect(tryOn.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
          });

       it('insertTryOn keeps a null output path valid', async () => {
          const tryOn = await r.insertTryOn(1, 2, '{}');
          expect(tryOn.outputPath).toBeNull();
          });

       it('listTryOns returns descending created_at order', async () => {
          seedTryOn(db.tables, { id: 1, body_photo_id: 1, item_id: 1, transform: 'a', output_path: null, created_at: '2020-01-01T00:00:00Z' });
          seedTryOn(db.tables, { id: 2, body_photo_id: 1, item_id: 2, transform: 'b', output_path: 'o', created_at: '2020-01-03T00:00:00Z' });
          seedTryOn(db.tables, { id: 3, body_photo_id: 1, item_id: 3, transform: 'c', output_path: 'o', created_at: '2020-01-02T00:00:00Z' });
          expect((await r.listTryOns()).map((t) => t.id)).toEqual([2, 3, 1]);
          });

       it('deleteTryOn removes only the selected row', async () => {
          await r.insertTryOn(1, 1, 'a', 'o');
          const keep = await r.insertTryOn(1, 2, 'b', 'o');
          await r.deleteTryOn(keep.id);
          const remaining = await r.listTryOns();
          expect(remaining).toHaveLength(1);
          expect(remaining[0].id).toBe(1);
          });
       });

    // ── Suite E · serialization helpers & edge conditions ──────────────────────
    describe('serialization & edge conditions', () => {
       it('round-trips tags through the comma-delimited row (trim + drop empties)', async () => {
          seedItem(db.tables, {
             id: 9,
             type: 'top',
             name: 'Messy',
             color: 'x',
             tags: '  a ,,,  b  , ,',
             image_path: 'p',
             thumbnail_path: null,
             created_at: '2020-01-01T00:00:00Z',
            });
          const got = await r.getItem(9);
          expect(got?.tags).toEqual(['a', 'b']);
          });

       it('an empty stored tags row yields an empty array', async () => {
          seedItem(db.tables, { id: 10, type: 'top', name: 'None', color: 'x', tags: '', image_path: 'p', thumbnail_path: null, created_at: '2020-01-01T00:00:00Z' });
          expect((await r.getItem(10))?.tags).toEqual([]);
          });

       it('round-trips path arrays through the pipe-delimited row', async () => {
          const row = await r.insertStoreItem({ name: 'Multi', category: 'top', color: 'x', imagePaths: ['a', 'b', 'c'] });
          expect(row.imagePaths).toEqual(['a', 'b', 'c']);
          });

       it('throws when the inserted row is missing after insert', async () => {
          db.setFailAfterInsert(true); // fault injection: getFirstAsync returns null post-insert
          await expect(
             r.insertItem({ name: 'Ghost', type: 'top', color: 'x', imagePath: 'p' }),
             ).rejects.toThrow(/row missing after insert/);
          });

       it('does not crash when reading shapes that are missing or null-like', async () => {
          expect(await r.getItem(404)).toBeUndefined();
          expect(await r.getSetting('missing')).toBeUndefined();
          const empty = await r.listStoreItems();
          expect(empty).toEqual([]);
          });
       });
    });
