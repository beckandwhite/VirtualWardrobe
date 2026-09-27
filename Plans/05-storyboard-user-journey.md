# Storyboard: the core wardrobe-to-try-on user journey

> **Issue:** M3-14 (#34) · **Milestone:** M3 Native+Polish · **Type:** product-planning / docs
> **State reflected:** POST-M7 navigation reality (as of 2026-09-27).
> **Purpose:** make the primary journey and the pages that own it explicit, so route/nav
> work (M3-17 / #47) and any follow-up items can be decomposed from a single source of truth.
> This is a planning artifact — it defines no features and invents no implementation tasks.

## Current navigation reality (the surfaces this storyboard maps onto)

Five-icon persistent bottom tab bar (`app/(tabs)/_layout.tsx`), left to right:

1. **welcome** — first-run orientation; a permanent, footer-less reference page after first use.
2. **me** — profile + settings; **the sole body-photo capture surface** (`person_photo_uri`).
3. **wardrobe** — own-clothes grid **plus** the catalog as a second section in one scroll
   (`CatalogSection` is the list footer). The standalone catalog tab was retired in M7-2b.
4. **studio** — the try-on stage (garment overlay on a body photo, auto/manual placement, save/share).
5. **looks** — saved try-on gallery; reopen / re-share / delete.

Two flat modal routes live outside the tab group (`app/_layout.tsx`, `presentation: 'modal'`):

- **`/capture`** — add-a-garment: hint chip + Photo/Camera → inserts a draft Item → `replace('/wardrobe')`.
- **`/item`** — item detail/edit: type / color / tags, Save (generates thumbnail) / Delete.

Entry routing (`app/index.tsx` + `src/onboarding/welcomeGate.ts`) is a pure function of two inputs:

- `has_seen_welcome` not set → **`/welcome`** (shown at most once, D44.1).
- seen welcome, **no** `person_photo_uri` → **`/me`** (capture your body photo).
- seen welcome, photo present → **`/wardrobe`**.

The M0-4 `/onboarding` camera flow was retired in M7-1; there is no `/onboarding` route.

---

## Primary user journey (happy path)

From first launch / empty wardrobe → a saved-or-shared look.

1. **First launch → orientation.** App opens on **welcome** (`/welcome`). The user reads the
   four-step "what this is" and the honest manual-fallback note, then taps **Continue**.
   Continue persists `has_seen_welcome` and routes on photo-presence: no photo yet → **me**.
2. **Set a body photo.** On **me** the user taps *Set photo*, picks from the library (native copies
   into the docs dir; web keeps the object URL). The preview updates. This photo becomes the
   default try-on body the studio reads. (Optional but strongly recommended; the studio degrades
   to a bundled sample body if skipped — see returning/edge paths.)
3. **Get a garment into play.** The user opens **wardrobe**. Two ways forward, both first-class:
   - **Add own clothes:** tap the **+** FAB → **`/capture`** → Photo/Camera → a draft Item is
     inserted and the user lands back in **wardrobe**. (Optionally open the item via **`/item`**
     to set type/color/tags.)
   - **Use the catalog:** scroll to the **Catalog** section and pick a bundled garment. Each card
     offers *Add to wardrobe* (copies to a real Item, stays in wardrobe) or *Try on* (copies then
     deep-links the studio).
4. **Create the try-on.** From a wardrobe thumbnail's **Try on** button, a catalog card's **Try on**,
   or by opening **studio** directly, the user reaches **studio** with the garment preselected
   (`/studio?id=<itemId>`). The garment auto-places over the body photo (web pose auto-drape;
   native shows the "adjusting manually" banner). The user fine-tunes with scale / rotate / opacity
   sliders and drag, and can toggle the skeleton or reset to the auto-fit.
5. **Review.** The user inspects the composite on the stage. A status line states whether placement
   was automatic or manual. They keep adjusting until satisfied.
6. **Save / share.** The user taps **Save & share**. The composite is exported and a `TryOn` row is
   persisted, then the system share sheet opens (same pipeline the Looks gallery re-uses). Success
   or failure surfaces as a visible notice — never silent.
7. **Revisit.** The saved look appears in **looks**, where the user can reopen it into the studio,
   re-share, or delete it.

**Happy-path steps:** 1 (orientation), 3 (get a garment — either sub-path), 4 (try-on), 5 (review),
6 (save/share). **Recommended-but-skippable:** 2 (body photo — studio falls back to a sample) and
the `/item` typing step in 3. **Follow-up/optional:** 7 (revisit) and catalog *Add to wardrobe*
(a curation action rather than a try-on step).

---

## Storyboard frames

Each frame: **goal → primary action → next transition.** Frames are page-level, not pixel mockups.

### Frame A — Orientation (`/welcome`)
- **Goal:** understand what the app does and the manual-fallback honesty.
- **Primary action:** *Continue*.
- **Next transition:** photo present → **wardrobe**; no photo → **me**. (Returning users see this as
  a footer-less reference page reachable from the tab bar.)

### Frame B — Set your body photo (`me` tab)
- **Goal:** give the studio a body to drape garments on.
- **Primary action:** *Set photo* (library picker; *Change* once set).
- **Next transition:** stays on **me** (preview updates). User then taps the **wardrobe** tab. No
  auto-advance — this is a persistent settings tab, not a wizard step.

### Frame C — Wardrobe browse + catalog (`wardrobe` tab)
- **Goal:** find or add a garment to try on.
- **Primary action:** pick a garment's **Try on**, OR tap **+** to add, OR use a **Catalog** card.
- **Next transition:** *Try on* → **studio** (`?id=`); **+** → **`/capture`** modal; item thumbnail
  body → **`/item`** modal; catalog *Add to wardrobe* → stays in wardrobe (item copied).

### Frame D — Add a garment (`/capture` modal)
- **Goal:** get a real garment image into the wardrobe with minimal friction.
- **Primary action:** *Photo* (library) or *Camera* (native only), with an optional type hint chip.
- **Next transition:** success → `replace('/wardrobe')` (draft Item inserted); cancel/denial/error →
  stays on the modal, no insert, no navigation.

### Frame E — Type the item (`/item` modal) — optional
- **Goal:** turn a raw draft into a typed item (type / color / tags).
- **Primary action:** *Save* (generates thumbnail) or *Delete*.
- **Next transition:** `router.back()` to wardrobe.

### Frame F — Try-on studio (`studio` tab, usually `/studio?id=`)
- **Goal:** place the garment on the body and get a look worth keeping.
- **Primary action:** adjust (drag + scale/rotate/opacity sliders); optionally *Pick photo*,
  *Reset*, toggle *Skeleton*.
- **Next transition:** *Save & share* → export + persist `TryOn` + system share sheet → notice.

### Frame G — Saved looks (`looks` tab)
- **Goal:** revisit, re-share, or prune saved try-ons.
- **Primary action:** tap a look to **reopen** (→ studio `?id=`), or *Share* / *Delete*.
- **Next transition:** reopen → **studio**; share → share sheet; delete → list reloads.

Frame flow (happy path): **A → B → C → (D→E) → F → G**, with C→F the shortest loop for a
returning user who already has clothes.

---

## Page map (route ownership — source of truth for #47)

| # | Journey step | Owning route | Kind | Entry paths (in) | Exit paths (out) |
|---|--------------|--------------|------|------------------|------------------|
| 1 | First-run orientation | `app/(tabs)/welcome.tsx` (`/welcome`) | tab | `app/index.tsx` redirect on first launch; welcome tab icon | *Continue* → `replace('/me')` or `replace('/wardrobe')` (photo-presence); tab bar to any tab |
| 2 | Set body photo | `app/(tabs)/me.tsx` (`/me`) | tab | `index` redirect (seen welcome, no photo); welcome *Continue*; me tab icon | stays on `/me`; user taps another tab |
| 3 | Browse + catalog | `app/(tabs)/wardrobe.tsx` (`/wardrobe`) + `src/catalog/CatalogSection.tsx` (embedded) | tab | `index` redirect (photo present); welcome/capture `replace`; catalog *Add to wardrobe* `replace`; wardrobe tab icon | *Try on*/catalog *Try on* → `push('/studio?id=')`; **+** FAB / empty-state *Add item* → `push('/capture')`; thumbnail → `push('/item?id=')` |
| 3a | Add a garment | `app/capture.tsx` (`/capture`) | flat modal | wardrobe **+** FAB; wardrobe filtered-empty *Add item* link | success → `replace('/wardrobe')`; cancel/error → stays |
| 3b | Type / edit item | `app/item.tsx` (`/item`) | flat modal | wardrobe thumbnail tap | Save/Delete → `router.back()` |
| 4/5 | Try-on + review | `app/(tabs)/studio.tsx` (`/studio`) | tab | wardrobe *Try on*; catalog *Try on*; looks *reopen*; studio tab icon (no id → resolves first wardrobe, else first catalog item) | *Save & share* → export + persist + share sheet (stays on studio, shows notice) |
| 6 | Save / share | (owned by studio; pipeline `src/composer/share.ts`) | action | *Save & share* button | share sheet result → notice; look now in looks |
| 7 | Saved looks | `app/(tabs)/looks.tsx` (`/looks`) | tab | looks tab icon; after a save (persisted `TryOn`) | reopen → `push('/studio?id=')`; re-share → share sheet; delete → reload |

### Genuinely missing pages / modals (flagged, not designed)

Called out for #47 to decide route ownership; **do not** treat as committed features.

1. **No standalone review/confirmation surface between studio edit and share.** Review happens
   in-place on the studio stage and save+share are fused in one button. If product wants an explicit
   "review before you commit" step (e.g. a preview modal with separate *Save* vs *Share*), that is a
   **new modal** with no current owner. *Decision needed — see D-6.*
2. **No first-class "try-on result" detail page.** Looks cards reopen straight into the editable
   studio; there is no read-only "view this saved look" page. Whether that gap matters depends on
   D-6. Currently **no missing route** if reopen-to-edit is the accepted model.
3. **No dedicated camera-permission / capture-failure screen.** Denials and errors are handled
   inline (capture modal stays put; camera button hidden when unavailable). This is intentional; a
   separate permission-rationale page is **not** currently needed but is a candidate if capture
   drop-off is observed. *Decision point — see D-3.*
4. **No explicit body-photo requirement gate before studio.** Studio silently falls back to the
   bundled sample body when `person_photo_uri` is unset, so a user can reach a try-on on a stock body
   without noticing. No missing *route*, but a possible in-studio prompt/CTA back to **me**.
   *Decision needed — see D-2.*

Everything else in the journey maps 1:1 onto an existing route. No other new pages are required for
the happy path.

---

## Key states covered

### Empty wardrobe
- `wardrobe` renders an empty own-clothes grid with an empty-state message; the **Catalog** section
  below is always populated (bundled store), so the user is never at a dead end — they can try on a
  catalog garment immediately or tap **+** to add their own. `emptyStateVariant` distinguishes
  *no items at all* (`none`) from *filtered to nothing* (`filtered`, which offers *Clear filters* and
  *Add item*).
- Studio with an empty wardrobe still resolves a garment: deep-linked id → first wardrobe item →
  first catalog item, so the stage always shows something (Q2/Q3).
- Looks empty: a plain "no looks yet" message until the first save.

### Camera permission / capture failure
- Capture is permission-aware: `useCapture` requests camera permission on native; a denial sets
  `cameraAvailable=false` and returns `null`. The capture modal treats cancel / denial / thrown-save
  identically — reset busy, **no insert, no navigation** (`buildDraftFromCapture` → `null`,
  `captureNextStep` → no-nav). The user stays on a usable capture screen.
- Web has no `expo-camera`: only the library file picker is shown; the Camera button is hidden.
- The library path (`me` photo, `capture` Photo) uses the platform-split picker so Safari opens the
  dialog inside the gesture.

### No-result try-on
- Native (no ML pose) returns zero keypoints → identity transform + the **"adjusting manually"**
  banner (M2-4); the user drapes the garment by hand. Same code path as auto; only provider differs.
- A failed export / share never fails silently: `EXPORT_ERROR_NOTICE` / `noticeForShare` surface a
  visible error notice in the studio controls (M2-3). The user can retry.
- Studio always has a body (sample fallback) and always resolves a garment, so "no result" means
  "placement not auto-solved" or "export failed", both handled visibly — never a blank stage.

### Returning-user paths
- Returning user with photo + clothes: `index` → **wardrobe** directly (welcome shown at most once).
- Returning user who skipped the body photo: `index` → **me** (nudge to set one) each launch until set.
- Reopening a saved look: `looks` → `push('/studio?id=')` restores body + garment and re-applies the
  stored transform (M2-2 / M3-2).
- Welcome remains reachable as a footer-less reference tab for a returning user.

---

## Open UX / product decisions

Recorded for consolidation; each has an owner or a next decision point. No implementation is implied.

| ID | Decision | Options / tension | Owner / next point |
|----|----------|-------------------|--------------------|
| D-1 | **Body-photo onboarding remains a passive nudge (me tab), not a blocking step.** | Wizard-style gate vs. current non-blocking `index`→`me` nudge. Current = non-blocking. | Product owner (Tamas). Revisit if analytics show users trying on with the sample body unintentionally. Consumed by #47. |
| D-2 | Should studio show an explicit "you're on a sample body — set your photo" CTA when `person_photo_uri` is unset? | Silent sample fallback (today) vs. in-studio prompt linking to **me**. | Next decision point: during #47 nav pass. |
| D-3 | Do we need a dedicated camera-permission rationale / recovery screen? | Inline handling (today) vs. a permission page. | Defer until capture drop-off is measurable; owner Product. Not needed for happy path. |
| D-4 | Back behavior for the flat modals (`/capture`, `/item`) and for `studio` reached via deep link. | `capture` uses `replace('/wardrobe')` (no back to a stale modal); `item` uses `router.back()`; studio is a tab (no natural back). Consistency of "where does back go from studio after a deep-link try-on?" is unresolved. | **#47 owns this** — this row is its explicit input. |
| D-5 | Catalog *Add to wardrobe* vs *Try on* — is "add" discoverable/necessary, or should catalog be try-on-first? | Two actions per card today. | Product; low priority. |
| D-6 | Is save and share correctly fused into one action, or should review → save and share be separable (needs a review modal / result page)? | Fused *Save & share* (today) vs. split with an explicit review surface (missing route #1/#2 above). | Product owner decision; blocks whether missing-route #1 is created. |
| D-7 | After a successful save/share, should the user be routed to **looks** (confirmation of the saved artifact) or stay in **studio**? | Stays in studio + notice (today) vs. auto-navigate to looks. | Next decision point: #47 nav pass. |
| D-8 | Welcome as a permanent tab — is a persistent "info" tab the right use of a bottom-bar slot, or should it move to a `me`/settings entry? | Permanent tab (today, five icons) vs. reclaiming the slot. | **#47 owns this** (tab-bar composition). |

---

## Ready to decompose

This artifact is ready to seed follow-up items. The page map's route-ownership table and the
entry/exit columns are the intended input for **M3-17 (#47, nav improvements)**, and the open-decision
list (especially D-4, D-7, D-8 for #47; D-2, D-6 for any review-surface work) enumerates the decisions
those items must resolve before touching navigation or adding pages.
