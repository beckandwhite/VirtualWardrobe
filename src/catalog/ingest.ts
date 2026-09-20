import type { StoreItem, NewStoreEntry } from '@/store';
import type { CatalogEntry } from './types';

export type { CatalogEntry } from './types';

// Bumped on each catalog release. The `catalog_ingested` flag in app_settings
// stores this string; a re-run whose flag already equals CATALOG_VERSION is a
// no-op. Raising it makes a new catalog release supersede the old one on existing
// installs (re-ingest once, then quiesce).
export const CATALOG_VERSION = 1;
export const CATALOG_FLAG = 'catalog_ingested';

// The minimal repo surface ingestion touches. Narrow + structural so a fake
// repo can stand in for the real one in tests — no SQLite, no Expo required.
// The concrete `r` (a full `Repo`) structurally satisfies this.
export interface IngestRepo {
   getSetting(key: string): Promise<string | undefined>;
   setSetting(key: string, value: string): Promise<void>;
   listStoreItems(): Promise<StoreItem[]>;
   insertStoreItem(input: NewStoreEntry): Promise<StoreItem>;
}

export interface IngestResult {
   ingested: number; // rows written this call
   skipped: number; // already-present / in-manifest dupes not written
   upToDate: boolean; // flag gate tripped → nothing done, early return
}

// Pure selection step: which manifest entries still need inserting. Drops any
// entry whose name is already present (dedupe across runs) and any name seen
// earlier in the same manifest (defense-in-depth within a run). No I/O, no
// flags — this is the decision record for "what does this run add."
export function planIngest(
   manifest: readonly CatalogEntry[],
   presentNames: ReadonlySet<string>,
): CatalogEntry[] {
   const seen = new Set<string>();
   const out: CatalogEntry[] = [];
   for (const entry of manifest) {
      if (presentNames.has(entry.name)) continue;
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);
      out.push(entry);
   }
   return out;
}

// Boot-time ingestion — the single catalog mechanism (D19.6): replaces M0.4's
// in-code `seedCatalog` and routes seeding through the bundled manifest.
// Idempotent in two layers:
//   1. version-flag gate: if the flag already equals CATALOG_VERSION, no-op.
//   2. per-name dedupe: even past the gate, only insert names not already in the
//      store, so a crash mid-run next time can't double-insert.
export async function runIngest(
   repo: IngestRepo,
   manifest: readonly CatalogEntry[],
): Promise<IngestResult> {
   const flag = await repo.getSetting(CATALOG_FLAG);
   if (flag === String(CATALOG_VERSION)) {
      return { ingested: 0, skipped: 0, upToDate: true };
   }

   const presentNames = new Set((await repo.listStoreItems()).map((s) => s.name));
   const toInsert = planIngest(manifest, presentNames);

   for (const entry of toInsert) {
      await repo.insertStoreItem(entry);
   }
   await repo.setSetting(CATALOG_FLAG, String(CATALOG_VERSION));

   return {
      ingested: toInsert.length,
      skipped: manifest.length - toInsert.length,
      upToDate: false,
   };
}
