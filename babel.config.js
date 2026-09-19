module.exports = function (api) {
   api.cache(true);
   return {
      presets: ['babel-preset-expo'],
      // react-native-reanimated/plugin added in M2 when the composer uses animated values.
      // Omitted in M0 because no M0 code uses Reanimated, and the worklets babel plugin
      // currently fails the web Metro bundler ("Unknown option: .name"). Re-enable for M2.
      plugins: [],
     };
};
