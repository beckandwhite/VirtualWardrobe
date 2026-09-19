import { useCallback, useEffect, useState } from 'react';
import { r, type Item, type NewItem } from './index';

// M1-2: hooks over the M0-3 repo so UI stays stateless w.r.t. persistence — await
// the repo, then refresh local state. The screen never touches the db layer.

// Load + refresh the full list of wardrobe items.
export function useItems() {
   const [items, setItems] = useState<Item[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<unknown>(null);

   const load = useCallback(async () => {
      try {
         const list = await r.listItems();
         setItems(list);
         setError(null);
      } catch (e) {
         setError(e);
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      load();
   }, [load]);

   return { items, loading, error, reload: load };
}

// Load + refresh a single item by id. Refreshes when id changes.
export function useItem(id: number | null | undefined) {
   const [item, setItem] = useState<Item | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<unknown>(null);

   const load = useCallback(async () => {
      if (id == null) {
         setItem(null);
         setLoading(false);
         return;
         }
      try {
         const found = await r.getItem(id);
         setItem(found ?? null);
         setError(null);
         } catch (e) {
          setError(e);
          } finally {
          setLoading(false);
          }
   }, [id]);

   useEffect(() => {
      load();
   }, [load]);

   return { item, loading, error, reload: load };
}

// Persist edits to an existing item (no duplicate rows — updates in place).
export async function upsertItem(id: number, patch: Partial<NewItem>): Promise<void> {
   await r.updateItem(id, patch);
}

// Delete an item; the repo cascades its TryOn rows first (no orphans for M3-2).
export async function deleteItem(id: number): Promise<void> {
   await r.deleteItem(id);
}
