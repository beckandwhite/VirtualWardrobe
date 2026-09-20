import {
   runIngest,
   planIngest,
   CATALOG_VERSION,
   type IngestRepo,
   type CatalogEntry,
} from '../../src/catalog/ingest';
import type { StoreItem, ItemCategory } from '../../src/store/db';

// A bare in-memory stand-in for the repo the ingester drives. Structural
// conformance to IngestRepo means the test exercises the *decision* logic
// (version gate + per-name dedupe) with zero SQLite/Expo dependency.
function makeFakeRepo(): IngestRepo & { rows: StoreItem[] } {
   const settings: Record<string, string> = {};
   const rows: StoreItem[] = [];
   let seq = 0;
   return {
      rows,
      async getSetting(key) {
         return settings[key];
      },
      async setSetting(key, value) {
         settings[key] = value;
      },
      async listStoreItems() {
         return rows.slice();
      },
      async insertStoreItem(input) {
         const row: StoreItem = {
            id: ++seq,
            source: 'catalog',
            name: input.name,
            category: input.category,
            color: input.color,
            imagePaths: input.imagePaths ?? [],
            specs: input.specs ?? null,
            createdAt: '2020-01-01T00:00:00.000Z',
            };
         rows.push(row);
         return row;
         },
    };
}

function catalog(n = 3): CatalogEntry[] {
   return Array.from({ length: n }, (_, i) => ({
      id: `slug-${i}`,
      name: `Item ${i}`,
      category: 'top' as ItemCategory,
      color: 'white',
      imagePaths: ['assets/store/placeholder-top.png'],
      specs: null,
    }));
}

describe('planIngest', () => {
   it('returns entries not present, in manifest order', () => {
      const manifest = catalog(3);
      const out = planIngest(manifest, new Set());
      expect(out.map((e) => e.id)).toEqual(['slug-0', 'slug-1', 'slug-2']);
    });

   it('drops names already present in the store', () => {
      const manifest = catalog(3);
      const out = planIngest(manifest, new Set(['Item 1']));
      expect(out.map((e) => e.id)).toEqual(['slug-0', 'slug-2']);
   });

   it('drops duplicate names within the manifest itself', () => {
      const manifest: CatalogEntry[] = [
         { id: 'a', name: 'Dup', category: 'top', color: 'x', imagePaths: [] },
         { id: 'b', name: 'Dup', category: 'top', color: 'y', imagePaths: [] },
        ];
      const out = planIngest(manifest, new Set());
      expect(out).toHaveLength(1);
      expect(out[0].id).toBe('a');
      });
});

describe('runIngest', () => {
   it('ingests every entry on first run and sets the version flag', async () => {
      const repo = makeFakeRepo();
      const res = await runIngest(repo, catalog(3));
      expect(res.ingested).toBe(3);
      expect(res.upToDate).toBe(false);
      expect(repo.rows).toHaveLength(3);
      expect(await repo.getSetting('catalog_ingested')).toBe(String(CATALOG_VERSION));
   });

   it('is a no-op when the flag already matches the version', async () => {
      const repo = makeFakeRepo();
      await repo.setSetting('catalog_ingested', String(CATALOG_VERSION));
      const res = await runIngest(repo, catalog(3));
      expect(res.upToDate).toBe(true);
      expect(res.ingested).toBe(0);
      expect(repo.rows).toHaveLength(0);
   });

   it('does not duplicate on re-run even when the flag is stale (crash-safe)', async () => {
      const repo = makeFakeRepo();
      // Simulate a boot that ingested all rows but died before writing the flag:
      const res = await runIngest(repo, catalog(3));
      expect(res.ingested).toBe(3);
      expect(repo.rows).toHaveLength(3);
      // Wipe the version flag to imitate the crash — the next boot must still
      // dedupe by name rather than re-insert.
      await repo.setSetting('catalog_ingested', '0');
      const again = await runIngest(repo, catalog(3));
      expect(again.ingested).toBe(0); // already present → nothing new
      expect(repo.rows).toHaveLength(3); // no duplication
       });
});
