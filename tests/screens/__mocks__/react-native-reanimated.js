// Fully manual Reanimated mock — avoids importing any real Reanimated code so
// the worklet runner is not required in Jest. StudioScreen uses:
//   useSharedValue, useAnimatedStyle, useAnimatedReaction, withTiming, runOnJS, Animated.View.
'use strict';
const ReactNative = require('react-native');

const useSharedValue = (init) => ({ value: init });
const useAnimatedStyle = (_fn) => ({});
const useAnimatedReaction = (_deps, _effect) => {};
const withTiming = (val) => val;
const runOnJS = (fn) => fn;
const cancelAnimation = () => {};
const useDerivedValue = (fn) => ({ value: fn() });
const interpolate = (val, _inRange, outRange) => outRange[0];
const Extrapolate = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };

const Animated = {
  View: ReactNative.View,
  Text: ReactNative.Text,
  Image: ReactNative.Image,
  ScrollView: ReactNative.ScrollView,
  FlatList: ReactNative.FlatList,
  createAnimatedComponent: (C) => C,
};

module.exports = {
  __esModule: true,
  default: Animated,
  Animated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withSpring: withTiming,
  withDecay: withTiming,
  withSequence: (...args) => args[args.length - 1],
  withDelay: (_delay, anim) => anim,
  runOnJS,
  runOnUI: (fn) => fn,
  cancelAnimation,
  useDerivedValue,
  interpolate,
  Extrapolate,
  useAnimatedGestureHandler: () => ({}),
  useAnimatedScrollHandler: () => ({}),
  makeMutable: (init) => ({ value: init }),
  useAnimatedRef: () => ({ current: null }),
};
