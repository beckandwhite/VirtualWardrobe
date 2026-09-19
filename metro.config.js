const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
   extra: {
      ...config.extra,
      babelInlineSources: false,
      },
   config: {
      resolver: {
        assetExts: [
           ...config.resolver.assetExts,
           'wasm',
        ],
        sourceExts: [
           ...config.resolver.sourceExts,
           'node',
        ],
    },
 },
};
