/** @type {import('jest').Config} */
export default {
  projects: [
    {
      // Existing pure logic tests (unchanged behavior).
      displayName: 'logic',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            target: 'es2019',
            module: 'commonjs',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            types: ['node', 'jest'],
          },
        }],
      },
    },
    {
      // Screen / component integration tests using React Native Testing Library.
      // Dependency justification: jest-expo handles Babel+Expo/RN transforms so
      // native JSX (View, Text, …) renders via react-test-renderer in Jest;
      // @testing-library/react-native provides render() and user-event helpers.
      displayName: 'screens',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/tests/screens/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/tests/screens/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Reanimated ships worklet code that can't run in Jest; use a manual mock
        // that avoids importing real Reanimated code (the official /mock entry chains
        // into worklet infrastructure that also fails in Jest without a native runtime).
        '^react-native-reanimated$': '<rootDir>/tests/screens/__mocks__/react-native-reanimated.js',
        '^react-native-worklets$': '<rootDir>/tests/screens/__mocks__/react-native-worklets.js',
        // Static asset imports (png/jpg) return a numeric stub from jest-expo;
        // re-state here so our moduleNameMapper doesn't shadow the preset's.
      },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|' +
        'expo(-[a-z0-9-]+)?|@expo(-[a-z0-9-]+)?|@expo/vector-icons|' +
        'react-navigation|@react-navigation|react-native-screens|' +
        'react-native-safe-area-context|react-native-reanimated)/)',
      ],
    },
  ],
};
