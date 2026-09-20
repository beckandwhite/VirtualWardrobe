import type { ItemCategory } from '@/store';

// The shape shipped inside the app as `assets/store.json` — the catalog *source*,
// not the DB row. The DB row (`StoreItem`, src/store/db.ts) adds a DB-assigned
// numeric `id` + `createdAt`; this manifest `id` (a stable slug) is the authoring
// key used to dedupe across runs, and is intentionally NOT persisted as the row id.
export interface CatalogEntry {
   id: string;
   name: string;
   category: ItemCategory;
   color: string;
   imagePaths: string[];
   specs?: string | null;
}
