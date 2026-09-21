const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');
config.resolver.sourceExts.push('node');

module.exports = config;
