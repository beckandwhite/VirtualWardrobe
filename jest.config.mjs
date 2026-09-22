/** @type {import('jest').Config} */
export default {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
    // The app uses `@/` path aliases (see tsconfig `paths`); map them so tests can
    // import the real screen/logic modules the way the app does.
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
};
