import { NativeModule, requireNativeModule } from 'expo-modules-core';

interface HelloNativeModuleType extends NativeModule {
  greeting(): string;
}

// requireNativeModule throws on web/Expo Go; the graceful fallback is intentional
// for dev use — never ship this JS-fallback path in production.
let HelloNative: HelloNativeModuleType;
try {
  HelloNative = requireNativeModule<HelloNativeModuleType>('HelloNative');
} catch {
  HelloNative = {
    greeting: () => 'Hello from JS fallback (not a native dev build)',
  } as HelloNativeModuleType;
}

export default HelloNative;
