const { withInfoPlist, createRunOncePlugin } = require('expo/config-plugins');

/**
 * Config plugin for vw-background-removal.
 *
 * NOTE: Native code linking is handled automatically by Expo's autolinking for
 * local modules (via expo-module.config.json) once `expo prebuild` / a custom
 * dev build is enabled (#75). This plugin only covers the extra native project
 * concerns autolinking does not: Info.plist usage strings on iOS and the
 * Android min SDK floor required by ML Kit Subject Segmentation (API 24).
 */

const MIN_SDK_VERSION = 24;

/**
 * iOS: add usage-description strings only if they are not already present.
 * Background removal itself needs no permission, but images typically come from
 * the camera / photo library, so we ensure sane defaults exist.
 */
function withIosUsageStrings(config) {
  return withInfoPlist(config, (cfg) => {
    const plist = cfg.modResults;
    if (!plist.NSCameraUsageDescription) {
      plist.NSCameraUsageDescription =
        'This app uses the camera to capture clothing photos for background removal.';
    }
    if (!plist.NSPhotoLibraryUsageDescription) {
      plist.NSPhotoLibraryUsageDescription =
        'This app accesses your photo library to select clothing images for background removal.';
    }
    return cfg;
  });
}

/**
 * Android: ensure the effective minSdkVersion is at least 24. We only raise it;
 * we never lower a higher value already set by the app.
 */
function withAndroidMinSdk(config) {
  const existing = config.android?.minSdkVersion ?? 0;
  if (existing < MIN_SDK_VERSION) {
    config.android = { ...(config.android ?? {}), minSdkVersion: MIN_SDK_VERSION };
  }
  return config;
}

const withVwBackgroundRemoval = (config) => {
  config = withIosUsageStrings(config);
  config = withAndroidMinSdk(config);
  return config;
};

module.exports = createRunOncePlugin(withVwBackgroundRemoval, 'vw-background-removal', '0.1.0');
