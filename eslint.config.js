import * as emotion from '@emotion/eslint-plugin'
import { fixupPluginRules } from '@eslint/compat'
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import compat from 'eslint-plugin-compat'
import importPlugin, { createNodeResolver } from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import ramda from 'eslint-plugin-ramda'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import { configs as storybookConfigs } from 'eslint-plugin-storybook'
import globals from 'globals'

import reactAppRules from './eslint.rules.js'

export default defineConfig([
  // `node_modules` is ignored by default; dotfiles are linted by default (no `!.*.js` needed)
  globalIgnores(['build/**', 'dist/**', 'storybook-static/**']),

  js.configs.recommended,
  compat.configs['flat/recommended'],
  ...storybookConfigs['flat/recommended'],

  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      // ES built-ins come from `ecmaVersion`; Node globals are scoped to tooling files below
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' },
      'import-x/resolver-next': [createNodeResolver()],
    },
    plugins: {
      'import-x': importPlugin,
      react: fixupPluginRules(react),
      'jsx-a11y': fixupPluginRules(jsxA11y),
      '@emotion': fixupPluginRules(emotion),
      ramda: fixupPluginRules(ramda),
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh.plugin,
    },
    rules: {
      ...reactAppRules,
      ...ramda.configs.recommended.rules,

      /* Rules react-app enabled that we keep */
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'import-x/first': 'error',
      'import-x/no-amd': 'error',
      'import-x/no-webpack-loader-syntax': 'error',

      /* ESLint (core) rules */
      'prefer-template': 'warn',
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          // ESLint 9 changed the default to 'all'; keep the ESLint 8 behavior
          caughtErrors: 'none',
          ignoreRestSiblings: false,
          argsIgnorePattern: 'props',
        },
      ],
      'no-restricted-imports': ['error', { patterns: ['@mui/*/*/*'] }],

      /* `eslint-plugin-import` rules */
      'import-x/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: [
            ['builtin', 'external', 'internal'],
            ['index', 'sibling'],
            'parent',
          ],
          pathGroups: [
            { pattern: '../../*', group: 'parent', position: 'after' },
            { pattern: '../../../*', group: 'parent', position: 'after' },
          ],
          'newlines-between': 'always',
        },
      ],
      'import-x/named': 'error',
      'import-x/namespace': 'error',
      'import-x/no-absolute-path': 'error',
      'import-x/no-dynamic-require': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/no-named-as-default': 'error',
      'import-x/no-deprecated': 'warn',
      'import-x/no-extraneous-dependencies': [
        'error',
        { peerDependencies: true },
      ],
      'import-x/no-mutable-exports': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-named-default': 'error',
      'import-x/no-unassigned-import': ['error', { allow: ['**/*.css'] }],
      'import-x/no-anonymous-default-export': 'error',
      'import-x/no-cycle': 'error',

      /* `@emotion/eslint-plugin` rules */
      '@emotion/no-vanilla': 'error',
      '@emotion/import-from-emotion': 'error',
      '@emotion/styled-import': 'error',
      '@emotion/syntax-preference': ['error', 'object'],

      /* `eslint-plugin-react-refresh` rules */
      'react-refresh/only-export-components': 'error',
    },
  },

  {
    files: ['src/stories/**/*.js', 'vitest.config.js', '.storybook/**/*.js'],
    rules: { 'import-x/no-unresolved': 'off' },
  },

  {
    // Tooling, tests and benchmarks run in Node
    files: [
      '*.{js,cjs,mjs}',
      '.storybook/**/*.js',
      'src/**/*.test.js',
      'src/benchmarks/**/*.js',
    ],
    languageOptions: { globals: globals.node },
  },

  {
    // Flat config files import package subpaths via `exports`, which eslint-plugin-import can't resolve
    files: ['eslint.config.js', 'eslint.rules.js'],
    rules: {
      'import-x/no-unresolved': 'off',
      'import-x/no-anonymous-default-export': 'off',
    },
  },

  // Must stay last so it can turn off formatting rules that conflict with Prettier
  prettierRecommended,
])
