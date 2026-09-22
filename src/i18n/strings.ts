// M6-1 i18n foundation (pure, expo-free, jest-runnable).
//
// The catalog is intentionally dependency-free and type-checked: the canonical
// English strings are the source-of-truth, and each locale is a complete record.
// This keeps the app logic simple and makes coverage checks easy to automate.

export const LOCALES = [
  'en',
  'hu',
  'de',
  'es',
  'it',
  'fr',
  'vi',
  'zh-CN',
  'zh-TW',
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hu: 'Magyar',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  fr: 'Français',
  vi: 'Tiếng Việt',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

export type Dict = Record<string, string>;

export const CATALOG: Record<Locale, Dict> = {
  en: {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': 'Welcome to VirtualWardrobe',
    'onboarding.body': 'Try on clothes from photos you take and a curated catalog — all on ' +
      'your device, nothing uploaded.',
    'onboarding.camera': 'Camera',
    'onboarding.camera.granted': '✓ Camera access enabled',
    'onboarding.camera.denied': 'Camera permission denied. Re-enable it in your device settings ' +
      'to use the camera; you can still open photos.',
    'onboarding.camera.notgranted': 'Camera access not granted. You can re-enable it anytime from here.',
    'onboarding.camera.enable': 'Enable camera',
    'onboarding.camera.hint': 'Camera lets you photograph clothes. The wardrobe works without it.',
    'onboarding.start': 'Start →',
    'tabs.wardrobe': 'Wardrobe',
    'tabs.catalog': 'Catalog',
    'tabs.looks': 'Looks',
    'language.title': 'Language',
  },
  hu: {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': 'Üdvözöljük a VirtualWardrobe-ben',
    'onboarding.body': 'Próbáljon ki ruhákat a fényképeiből és egy válogatott katalógusból — mindezt ' +
      'az eszközén, semmi sem kerül feltöltésre.',
    'onboarding.camera': 'Kamera',
    'onboarding.camera.granted': '✓ Kamera hozzáférés engedélyezve',
    'onboarding.camera.denied': 'A kamera engedélye megtagadva. Engedélyezze újra az eszköz beállításaiban, ' +
      'ha használni szeretné a kamerát; a képek továbbra is megnyithatók.',
    'onboarding.camera.notgranted': 'A kamera hozzáférése nem engedélyezett. Bármikor újra engedélyezheti innen.',
    'onboarding.camera.enable': 'Kamera engedélyezése',
    'onboarding.camera.hint': 'A kamera segítségével fényképezheti le a ruhákat. A szekrény működik nélküle is.',
    'onboarding.start': 'Kezdés →',
    'tabs.wardrobe': 'Szekrény',
    'tabs.catalog': 'Katalógus',
    'tabs.looks': 'Lookok',
    'language.title': 'Nyelv',
  },
  de: {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': 'Willkommen bei VirtualWardrobe',
    'onboarding.body': 'Probieren Sie Kleidung mit Fotos aus, die Sie aufnehmen, und einem kuratierten Katalog — alles auf ' +
      'Ihrem Gerät, ohne Upload.',
    'onboarding.camera': 'Kamera',
    'onboarding.camera.granted': '✓ Kamerazugriff aktiviert',
    'onboarding.camera.denied': 'Kameraberechtigung verweigert. Aktivieren Sie sie in den Geräteeinstellungen erneut, ' +
      'um die Kamera zu verwenden; Sie können weiterhin Fotos öffnen.',
    'onboarding.camera.notgranted': 'Kamerazugriff nicht gewährt. Sie können ihn jederzeit hier erneut aktivieren.',
    'onboarding.camera.enable': 'Kamera aktivieren',
    'onboarding.camera.hint': 'Mit der Kamera können Sie Kleidung fotografieren. Das Kleiderschrank-Feature funktioniert auch ohne sie.',
    'onboarding.start': 'Starten →',
    'tabs.wardrobe': 'Kleiderkammer',
    'tabs.catalog': 'Katalog',
    'tabs.looks': 'Looks',
    'language.title': 'Sprache',
  },
  es: {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': 'Bienvenido a VirtualWardrobe',
    'onboarding.body': 'Prueba ropa con fotos que tomes y de un catálogo curado — todo en tu ' +
      'dispositivo, sin subidas.',
    'onboarding.camera': 'Cámara',
    'onboarding.camera.granted': '✓ Acceso a la cámara activado',
    'onboarding.camera.denied': 'Permiso de cámara denegado. Vuelve a activarlo en la configuración ' +
      'de tu dispositivo para usar la cámara; aún puedes abrir fotos.',
    'onboarding.camera.notgranted': 'Acceso a la cámara no concedido. Puedes reactivarlo cuando quieras.',
    'onboarding.camera.enable': 'Activar cámara',
    'onboarding.camera.hint': 'La cámara te permite fotografiar ropa. El armario funciona sin ella.',
    'onboarding.start': 'Comenzar →',
    'tabs.wardrobe': 'Guardarropa',
    'tabs.catalog': 'Catálogo',
    'tabs.looks': 'Looks',
    'language.title': 'Idioma',
  },
  it: {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': 'Benvenuto in VirtualWardrobe',
    'onboarding.body': 'Prova i vestiti con foto che scatti e un catalogo curato — tutto sul tuo ' +
      'dispositivo, senza upload.',
    'onboarding.camera': 'Fotocamera',
    'onboarding.camera.granted': '✓ Accesso alla fotocamera abilitato',
    'onboarding.camera.denied': 'Autorizzazione alla fotocamera negata. Riattivala nelle impostazioni del dispositivo ' +
      'per usarla; puoi comunque aprire le foto.',
    'onboarding.camera.notgranted': 'Accesso alla fotocamera non consentito. Puoi riattivarlo in qualsiasi momento da qui.',
    'onboarding.camera.enable': 'Abilita fotocamera',
    'onboarding.camera.hint': 'La fotocamera ti consente di fotografare gli abiti. L’armadio funziona anche senza.',
    'onboarding.start': 'Inizia →',
    'tabs.wardrobe': 'Armadio',
    'tabs.catalog': 'Catalogo',
    'tabs.looks': 'Look',
    'language.title': 'Lingua',
  },
  fr: {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': 'Bienvenue dans VirtualWardrobe',
    'onboarding.body': 'Essayez des vêtements à partir de photos que vous prenez et d’un catalogue sélectionné — tout sur ' +
      'votre appareil, sans téléchargement.',
    'onboarding.camera': 'Caméra',
    'onboarding.camera.granted': '✓ Accès à la caméra activé',
    'onboarding.camera.denied': 'Autorisation de la caméra refusée. Réactivez-la dans les paramètres de votre appareil ' +
      'pour utiliser la caméra; vous pouvez toujours ouvrir des photos.',
    'onboarding.camera.notgranted': 'Accès à la caméra non autorisé. Vous pouvez le réactiver à tout moment ici.',
    'onboarding.camera.enable': 'Activer la caméra',
    'onboarding.camera.hint': 'La caméra vous permet de photographier les vêtements. Le dressing fonctionne aussi sans elle.',
    'onboarding.start': 'Commencer →',
    'tabs.wardrobe': 'Garde-robe',
    'tabs.catalog': 'Catalogue',
    'tabs.looks': 'Looks',
    'language.title': 'Langue',
  },
  vi: {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': 'Chào mừng bạn đến với VirtualWardrobe',
    'onboarding.body': 'Thử quần áo từ ảnh bạn chụp và danh mục được tuyển chọn — mọi thứ đều trên ' +
      'thiết bị của bạn, không có gì được tải lên.',
    'onboarding.camera': 'Máy ảnh',
    'onboarding.camera.granted': '✓ Đã bật quyền truy cập máy ảnh',
    'onboarding.camera.denied': 'Quyền máy ảnh bị từ chối. Kích hoạt lại trong cài đặt thiết bị của bạn ' +
      'để sử dụng máy ảnh; bạn vẫn có thể mở ảnh.',
    'onboarding.camera.notgranted': 'Chưa cấp quyền truy cập máy ảnh. Bạn có thể kích hoạt lại bất cứ lúc nào ở đây.',
    'onboarding.camera.enable': 'Bật máy ảnh',
    'onboarding.camera.hint': 'Máy ảnh giúp bạn chụp ảnh quần áo. Tủ quần áo vẫn hoạt động nếu không có nó.',
    'onboarding.start': 'Bắt đầu →',
    'tabs.wardrobe': 'Tủ quần áo',
    'tabs.catalog': 'Danh mục',
    'tabs.looks': 'Looks',
    'language.title': 'Ngôn ngữ',
  },
  'zh-CN': {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': '欢迎使用 VirtualWardrobe',
    'onboarding.body': '使用您拍摄的照片和精选目录试穿服装——一切都在您的设备上完成，不会上传任何内容。',
    'onboarding.camera': '相机',
    'onboarding.camera.granted': '✓ 已启用相机访问权限',
    'onboarding.camera.denied': '相机权限被拒绝。请在设备设置中重新启用该权限以使用相机；您仍然可以打开照片。',
    'onboarding.camera.notgranted': '尚未授予相机访问权限。您可随时在此处重新启用。',
    'onboarding.camera.enable': '启用相机',
    'onboarding.camera.hint': '相机可让您拍摄衣服照片。即使没有相机，衣橱也能正常使用。',
    'onboarding.start': '开始 →',
    'tabs.wardrobe': '衣橱',
    'tabs.catalog': '目录',
    'tabs.looks': '造型',
    'language.title': '语言',
  },
  'zh-TW': {
    'app.title': 'VirtualWardrobe',
    'onboarding.welcome': '歡迎使用 VirtualWardrobe',
    'onboarding.body': '使用您拍攝的照片和精選目錄試穿服裝——一切都在您的裝置上完成，不會上傳任何內容。',
    'onboarding.camera': '相機',
    'onboarding.camera.granted': '✓ 已啟用相機存取權限',
    'onboarding.camera.denied': '相機權限被拒絕。請在裝置設定中重新啟用該權限以使用相機；您仍可開啟照片。',
    'onboarding.camera.notgranted': '尚未授予相機存取權限。您可隨時在此處重新啟用。',
    'onboarding.camera.enable': '啟用相機',
    'onboarding.camera.hint': '相機可讓您拍攝衣服照片。即使沒有相機，衣櫥也能正常使用。',
    'onboarding.start': '開始 →',
    'tabs.wardrobe': '衣櫃',
    'tabs.catalog': '目錄',
    'tabs.looks': '造型',
    'language.title': '語言',
  },
};

export function catalogCoverage(locale: string): { missing: string[]; unexpected: string[] } {
  const target = resolveLocale(locale) as Locale;
  const expected = Object.keys(CATALOG[DEFAULT_LOCALE]);
  const actual = Object.keys(CATALOG[target] ?? {});

  return {
    missing: expected.filter((key) => !(key in (CATALOG[target] ?? {}))),
    unexpected: actual.filter((key) => !(key in CATALOG[DEFAULT_LOCALE])),
  };
}

// Resolve a locale with fallback to English, then to the key itself — so a
// missing key never renders blank (the common i18n footgun).
export function resolveLocale(input: string | null | undefined): Locale {
  const raw = input?.trim();
  if (!raw) return DEFAULT_LOCALE;

  const normalized = raw.replace(/_/g, '-');
  if (normalized in CATALOG) return normalized as Locale;

  const base = normalized.split('-')[0].toLowerCase();
  if (base in CATALOG) return base as Locale;

  return DEFAULT_LOCALE;
}

export function isValidLocale(input: string): input is Locale {
  return input.replace(/_/g, '-') in CATALOG;
}

export function translate(locale: Locale, key: string): string {
  const dict = CATALOG[locale] ?? CATALOG[DEFAULT_LOCALE];
  return dict[key] ?? CATALOG[DEFAULT_LOCALE][key] ?? key;
}
