const expoConfig = require('eslint-config-expo/flat.js');
const globals = require('globals');

module.exports = [
    ...expoConfig,
    // react-hooks/set-state-in-effect is a strict React-19 rule that flags the common
    // async initial-load pattern (useEffect: load().then(setX)). For MVP scaffolding
    // this is a false positive; revisit when we add a proper data-loading hook (M1).
    {
      name: 'vw/rules',
     rules: {
         'react-hooks/set-state-in-effect': 'off',
     },
    },
      // Dev/build scripts run under Node and use Buffer/process; give them node globals.
      // import/no-unresolved is off here: the e2e harness does an optional dynamic
      // import of @playwright/test (only present when the browser pass is enabled),
      // so a static "unresolved" error would false-positive on a clean checkout.
      {
       name: 'vw/node-scripts',
       files: ['scripts/**/*.mjs'],
       languageOptions: { globals: { ...globals.node } },
       rules: { 'import/no-unresolved': 'off' },
      },
      // Jest screen tests use two patterns that conflict with standard lint rules:
      // 1. require() inside jest.mock() factories — import is not allowed in factory
      //    functions; synchronous require() is the only option.
      // 2. Imports after jest.mock() calls — babel-jest-hoist requires jest.mock()
      //    before module imports; then the mocked modules are imported afterwards to
      //    get typed references to their mock instances.
      {
        name: 'vw/test-screens',
        files: ['tests/screens/**/*.{ts,tsx}'],
        rules: {
          '@typescript-eslint/no-require-imports': 'off',
          'import/first': 'off',
        },
      },
    {
      ignores: [
        'node_modules/**',
        '.expo/**',
        'dist/**',
        'web-build/**',
        'android/**',
        'ios/**',
        'expo-env.d.ts',
        'package-lock.json',
        'babel.config.js',
        'jest.config.mjs',
     ],
     },
];
