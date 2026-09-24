# Translation workflow (M6)

VirtualWardrobe ships a zero-dependency, type-checked i18n catalog. This is the
contributor guide for adding or completing a locale.

## Where things live

- `src/i18n/locales/en.ts` — the **canonical English catalog**. This is the
  source of truth. Every key that exists anywhere must exist here first.
- `src/i18n/locales/<locale>.ts` — one file per locale (`hu`, `de`, `es`, `it`,
  `fr`, `vi`, `zh-CN`, `zh-TW`). Each exports a `Dict` with the same keys as
  English. One file per locale means translators never collide on the same file.
- `src/i18n/strings.ts` — assembles the catalog and holds the pure helpers
  (`translate`, `resolveLocale`, `catalogCoverage`, `placeholderMismatches`).
- `src/i18n/useI18n.tsx` — the React hook. Screens call `t('some.key')`.
- `tests/i18n/strings.test.ts` — the automated gates (coverage + placeholders).

## Rules for translators

1. **Never change key names.** Translate values only.
2. **Preserve every `{token}` placeholder exactly.** `Look #{id}` may become
   `Look Nr. {id}` but must keep `{id}`. A renamed or dropped token silently
   swallows the substituted value — the `placeholderMismatches` gate fails the
   build if you break this.
3. **Keep the product name `VirtualWardrobe` untranslated** (`app.title`).
4. **Preserve leading glyphs** where they carry meaning: the `✓` in
   `onboarding.camera.granted`, the `→` in `onboarding.start`.
5. Prefer natural, idiomatic wording over literal translation. Match the app's
   concise, friendly tone.
6. Use single quotes to match the file style; run `npm run format` if unsure.
7. A missing key is **not** a crash — it falls back to English — but coverage is
   still a required gate, so fill every key.

## Terminology (keep consistent within a locale)

| English | Meaning in-app |
| --- | --- |
| wardrobe | the user's own saved garments |
| catalog | the bundled/curated garment collection |
| look | a saved try-on composite |
| try on | overlay a garment on a body photo |
| capture | photograph or pick a garment image |
| garment / item | a single piece of clothing |

## Adding a brand-new locale

1. Add the code to `LOCALES` and a display name to `LOCALE_LABELS` in
   `src/i18n/strings.ts`.
2. Import its dict in `strings.ts` and add it to `CATALOG`.
3. Create `src/i18n/locales/<locale>.ts` exporting a full `Dict`.
4. The coverage test iterates every locale automatically — no test edit needed.

## Verifying

```bash
npm run typecheck
npm run lint
npm test            # coverage + placeholder gates live in tests/i18n
```

`catalogCoverage(locale)` reports `{ missing, unexpected }` keys and
`placeholderMismatches(locale)` reports keys whose tokens diverge from English.
