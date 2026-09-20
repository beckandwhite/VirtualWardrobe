module.exports = function (api) {
   api.cache(true);
   return {
      presets: ['babel-preset-expo'],
       // M2-2 re-enables the Reanimated/worklets plugin: the studio now drives the
       // garment overlay through useSharedValue + useAnimatedStyle on the UI thread
       // (D19.7). Must be the last plugin.
      plugins: ['react-native-reanimated/plugin'],
      };
};
