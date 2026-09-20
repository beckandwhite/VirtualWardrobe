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
