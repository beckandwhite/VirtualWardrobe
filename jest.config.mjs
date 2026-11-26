/** @type {import('jest').Config} */
export default {
  // Full production coverage denominator: every TS/TSX file under src/, app/, and
  // modules/ is counted whether or not a test imports it.  Exclusions are narrow
  // and documented:
  //   *.d.ts  — ambient type declarations only; no executable statements.
  // Platform variants (*.web.ts/tsx) are kept in scope: they are production code
  // for the web target and their uncovered state is visible rather than hidden.
  // Native-language sources (Swift/Kotlin) are tracked separately (see #84).
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'modules/**/*.ts',
    '!**/*.d.ts',
  ],

  // Thresholds set 1-2 % below the measured baseline (2026-10-07):
  //   statements 40.03 → 38, branches 49.74 → 48,
  //   functions  38.73 → 37, lines   45.44 → 43.
  // Raise these as new tests are added; never lower them.
  coverageThreshold: {
    global: {
      statements: 38,
      branches: 48,
      functions: 37,
      lines: 43,
    },
  },

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
