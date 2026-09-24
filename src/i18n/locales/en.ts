import type { Dict } from '../strings';

// Canonical English (M6-2). This is the source-of-truth catalog: every other
// locale is measured for completeness against these keys, and any key missing in
// a locale falls back to the English value here (never a blank UI).
//
// Interpolation: `{token}` placeholders are substituted at render time by
// `translate(locale, key, params)`. Translators MUST preserve every `{token}`
// exactly (same names) so the substituted value still lands. See
// `Plans/translation-workflow.md`.
export const en: Dict = {
  // App-level
  'app.title': 'VirtualWardrobe',

  // Shared / reusable actions and states
  'common.loading': 'Loading…',
  'common.saving': 'Saving…',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.share': 'Share',
  'common.back': 'Back',
  'common.dismiss': 'Dismiss',
  'common.tryOn': 'Try on',

  // Entry / routing
  'index.loading': 'Loading your wardrobe…',

  // Onboarding
  'onboarding.welcome': 'Welcome to VirtualWardrobe',
  'onboarding.body':
    'Try on clothes from photos you take and a curated catalog — all on your device, nothing uploaded.',
  'onboarding.camera': 'Camera',
  'onboarding.camera.granted': '✓ Camera access enabled',
  'onboarding.camera.denied':
    'Camera permission denied. Re-enable it in your device settings to use the camera; you can still open photos.',
  'onboarding.camera.notgranted':
    'Camera access not granted. You can re-enable it anytime from here.',
  'onboarding.camera.enable': 'Enable camera',
  'onboarding.camera.hint':
    'Camera lets you photograph clothes. The wardrobe works without it.',
  'onboarding.start': 'Start →',

  // Tabs
  'tabs.wardrobe': 'Wardrobe',
  'tabs.catalog': 'Catalog',
  'tabs.looks': 'Looks',

  // Language switcher
  'language.title': 'Language',

  // Wardrobe screen
  'wardrobe.header': 'Your wardrobe',
  'wardrobe.search': 'Search name or tags',
  'wardrobe.count': '{visible} of {total}',
  'wardrobe.empty': 'No items yet. Tap the + to add your first one.',
  'wardrobe.emptyFiltered': 'Nothing matches your filters.',
  'wardrobe.clearFilters': 'Clear filters',
  'wardrobe.addItem': 'Add an item',

  // Catalog screen
  'catalog.header': 'Catalog',
  'catalog.empty': 'Nothing in the catalog yet.',
  'catalog.add': 'Add',
  'catalog.added': 'Added ✓',

  // Capture screen
  'capture.title': 'Add a garment',
  'capture.body':
    'Pick a photo from your library or photograph it with the camera. Type it later.',
  'capture.hint': 'Hint (optional)',
  'capture.photo': 'Photo',
  'capture.camera': 'Camera',

  // Item detail / edit screen
  'item.notFound': 'Item not found.',
  'item.label.type': 'Type',
  'item.label.color': 'Color',
  'item.label.tags': 'Tags (comma separated)',
  'item.tags.placeholder': 'e.g. casual, summer',

  // Studio screen
  'studio.status.autoPlaced': 'Auto-placed from detected pose',
  'studio.status.manual': 'Auto-drape unavailable — adjusting manually',
  'studio.banner.manual': 'Auto-drape unavailable here — adjusting manually.',
  'studio.slider.scale': 'Scale',
  'studio.slider.rotate': 'Rotate',
  'studio.slider.opacity': 'Opacity',
  'studio.reset': 'Reset',
  'studio.skeleton.on': 'Skeleton: on',
  'studio.skeleton.off': 'Skeleton: off',
  'studio.pickPhoto': 'Pick photo',
  'studio.saveShare': 'Save & share',
  'studio.recent': 'Recent',
  'studio.lookNumber': 'Look #{id}',
  'studio.reopened': 'Reopened look #{id}',

  // Looks gallery
  'looks.header': 'Your looks',
  'looks.empty': 'No looks yet. Try on something in the wardrobe.',
  'looks.shared': 'Look shared.',
  'looks.shareFailed': 'Share failed: {error}',
  'looks.caption': 'Look #{id} · {date}',

  // Garment categories (bounded enum, user-visible in chips + captions)
  'category.top': 'Top',
  'category.bottom': 'Bottom',
  'category.dress': 'Dress',
  'category.outerwear': 'Outerwear',
  'category.shoes': 'Shoes',
  'category.other': 'Other',

  // Colors (bounded enum, user-visible in swatches + captions)
  'color.white': 'White',
  'color.black': 'Black',
  'color.gray': 'Gray',
  'color.red': 'Red',
  'color.blue': 'Blue',
  'color.green': 'Green',
  'color.brown': 'Brown',
  'color.pink': 'Pink',
  'color.yellow': 'Yellow',
  'color.unknown': 'Unknown',
};
