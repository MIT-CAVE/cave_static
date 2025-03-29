module.exports = {
  env: {
    es2021: true,
  },
  plugins: ['@emotion', 'ramda'],
  extends: [
    'react-app',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:compat/recommended',
    'plugin:ramda/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    /* ESLint (core) rules */
    'prefer-template': 'warn',
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
        argsIgnorePattern: 'props',
        // "varsIgnorePattern": ""
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: ['@mui/*/*/*'],
      },
    ],

    /* `eslint-plugin-import` rules */
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        groups: [
          ['builtin', 'external', 'internal'],
          ['index', 'sibling'],
          'parent',
        ],
        pathGroups: [
          {
            pattern: '../../*',
            group: 'parent',
            position: 'after',
          },
          {
            pattern: '../../../*',
            group: 'parent',
            position: 'after',
          },
        ],
        'newlines-between': 'always',
      },
    ],
    'import/named': 'error',
    'import/namespace': 'error',
    'import/no-absolute-path': 'error',
    'import/no-dynamic-require': 'error',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'error',
    'import/no-named-as-default': 'error',
    'import/no-deprecated': 'warn',
    'import/no-extraneous-dependencies': [
      'error',
      {
        peerDependencies: true,
      },
    ],
    'import/no-mutable-exports': 'error',
    'import/newline-after-import': 'error',
    'import/no-named-default': 'error',
    'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],
    'import/no-anonymous-default-export': 'error',
    'import/no-cycle': 'error',
    // 'import/exports-last': 'error',
    // 'import/prefer-default-export': 'error',
    // 'import/group-exports': 'error',

    /* `@emotion/eslint-plugin` rules */
    '@emotion/no-vanilla': 'error',
    '@emotion/import-from-emotion': 'error',
    '@emotion/styled-import': 'error',
    '@emotion/syntax-preference': ['error', 'object'],
  },
  root: true,
}
