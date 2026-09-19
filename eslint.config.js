const expoConfig = require('eslint-config-expo/flat.js');

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
