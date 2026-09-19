/** @type {import('jest').Config} */
export default {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
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
