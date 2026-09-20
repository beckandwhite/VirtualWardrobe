import catalogManifest from '../../assets/store.json';
import type { CatalogEntry } from './types';
import { runIngest, type IngestResult } from './ingest';
import { r } from '@/store';

// The JSON module resolves to a typed `any[]` without a JSON-module ambient;
// narrow to the catalog shape at the boundary so the manifest is the only source
// of catalog rows and a bad entry fails loudly at import, not at insert.
const MANIFEST: CatalogEntry[] = catalogManifest as unknown as CatalogEntry[];

// Thin runtime wrapper: load the bundled manifest + call the idempotent core
// with the real repo. Called once at boot from the root layout.
export async function runCatalogIngest(): Promise<IngestResult> {
   return runIngest(r, MANIFEST);
}
