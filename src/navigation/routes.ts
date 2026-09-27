// M3-17 (#47) canonical route + navigation-decision helpers.
//
// Extracted pure (like welcomeGate.ts / draft.ts) so the route-ownership rules from
// the M3-14 page map (Plans/05-storyboard-user-journey.md) are unit-testable without
// expo-router. Screens stay thin views that call these helpers; every navigation
// decision that matters — canonical deep-link params, invalid-id resolution, and
// where a modal/return exit lands — lives here as the single source of truth.
//
// Only a *type* is imported from expo-router, so this module stays runtime-free and
// jest-loadable in the node test environment.
import type { Href } from 'expo-router';

// Canonical, always-registered destinations used as literals so they satisfy the
// typed-routes `Href` without a cast.
export const WARDROBE_HREF = '/wardrobe' as const;
export const CAPTURE_HREF = '/capture' as const;

// Canonical item-id resolution for the two id-bearing routes (`/studio`, `/item`).
// A deep link's `id` is whatever expo-router parsed off the URL: a string, an array
// (a repeated `?id=&id=` param), or undefined. Canonical == a single positive
// integer; anything else (missing, array, blank, non-numeric, zero/negative,
// fractional, unsafe-large) resolves to `null` so the screen falls back
// deterministically instead of querying a junk id. This is the one place a
// user-facing route reads an id, so deep links can never bypass it.
export function parseItemId(
  param: string | string[] | undefined | null,
): number | null {
  if (typeof param !== 'string') return null;
  const trimmed = param.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// Canonical studio deep link: `/studio?id=<n>` for a real garment, bare `/studio`
// when there is no valid id (the studio then resolves first-wardrobe / first-catalog
// so the stage is never blank — Q2/Q3). Accepts a raw id or a pre-parsed one.
export function studioHref(id: number | null | undefined): Href {
  return (id != null && id > 0 ? `/studio?id=${id}` : '/studio') as Href;
}

// Canonical item-detail deep link.
export function itemHref(id: number): Href {
  return `/item?id=${id}` as Href;
}

// Deterministic modal / return exit (#47 D-4). Pop back to the originating surface
// when there is history, else replace to a canonical fallback so a deep-linked or
// cold-started modal (e.g. `/item?id=…` opened directly) never dead-ends on a screen
// with nothing behind it. The screen wires `router.canGoBack()` in and dispatches.
export type ExitDecision =
  | { action: 'back' }
  | { action: 'replace'; route: Href };

export function exitTo(
  canGoBack: boolean,
  fallback: Href = WARDROBE_HREF,
): ExitDecision {
  return canGoBack ? { action: 'back' } : { action: 'replace', route: fallback };
}
