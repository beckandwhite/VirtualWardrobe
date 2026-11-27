const {
  withGradleProperties,
  withInfoPlist,
  createRunOncePlugin,
} = require('expo/config-plugins');

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
 * Android: ensure the Gradle minSdkVersion property is at least 24 while
 * preserving any higher value already configured.
 */
function withAndroidMinSdk(config) {
  return withGradleProperties(config, (cfg) => {
    const minSdkProperties = cfg.modResults.filter(
      (property) =>
        property.type === 'property' && property.key === 'android.minSdkVersion',
    );
    const minSdkVersion = Math.max(
      MIN_SDK_VERSION,
      ...minSdkProperties.map((property) => Number(property.value) || 0),
    );

    if (minSdkProperties.length === 0) {
      cfg.modResults.push({
        type: 'property',
        key: 'android.minSdkVersion',
        value: String(minSdkVersion),
      });
    } else {
      for (const property of minSdkProperties) {
        property.value = String(minSdkVersion);
      }
    }

    return cfg;
  });
}

const withVwBackgroundRemoval = (config) => {
  config = withIosUsageStrings(config);
  config = withAndroidMinSdk(config);
  return config;
};

module.exports = createRunOncePlugin(withVwBackgroundRemoval, 'vw-background-removal', '0.1.0');
