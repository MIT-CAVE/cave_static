/**
 * Uncomment and rename to `eslint.config.js` when upgrading to ESLint v9+.
 * @see https://github.com/emotion-js/emotion/pull/3248
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 */

// import { defineConfig, globalIgnores } from 'eslint/config'
// import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
// import eslintPluginImport from 'eslint-plugin-import'
// import eslintPluginCompat from 'eslint-plugin-compat'
// // import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
// import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

// export default defineConfig([
//   globalIgnores(['build/**', '!.*.js']),
//   eslintPluginImport.flatConfigs.errors,
//   eslintPluginImport.flatConfigs.warnings,
//   eslintPluginCompat.configs.recommended,
// //   eslintPluginReactHooks.configs.flat.recommended,
//   eslintPluginReactRefresh.configs.recommended,
//   eslintPluginPrettierRecommended,
//   {
//     env: {
//       es2022: true,
//     },
//     plugins: ['@emotion', 'ramda'],
//     extends: ['react-app', 'plugin:ramda/recommended'],
//     rules: {
//       /* ESLint (core) rules */
//       'prefer-template': 'warn',
//       'no-unused-vars': [
//         'error',
//         {
//           vars: 'all',
//           args: 'after-used',
//           ignoreRestSiblings: false,
//           argsIgnorePattern: 'props',
//           // "varsIgnorePattern": ""
//         },
//       ],
//       'no-restricted-imports': [
//         'error',
//         {
//           patterns: ['@mui/*/*/*'],
//         },
//       ],

//       /* `eslint-plugin-import` rules */
//       'import/order': [
//         'error',
//         {
//           alphabetize: {
//             order: 'asc',
//             caseInsensitive: true,
//           },
//           groups: [
//             ['builtin', 'external', 'internal'],
//             ['index', 'sibling'],
//             'parent',
//           ],
//           pathGroups: [
//             {
//               pattern: '../../*',
//               group: 'parent',
//               position: 'after',
//             },
//             {
//               pattern: '../../../*',
//               group: 'parent',
//               position: 'after',
//             },
//           ],
//           'newlines-between': 'always',
//         },
//       ],
//       'import/named': 'error',
//       'import/namespace': 'error',
//       'import/no-absolute-path': 'error',
//       'import/no-dynamic-require': 'error',
//       'import/no-self-import': 'error',
//       'import/no-useless-path-segments': 'error',
//       'import/no-named-as-default': 'error',
//       'import/no-deprecated': 'warn',
//       'import/no-extraneous-dependencies': [
//         'error',
//         {
//           peerDependencies: true,
//         },
//       ],
//       'import/no-mutable-exports': 'error',
//       'import/newline-after-import': 'error',
//       'import/no-named-default': 'error',
//       'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],
//       'import/no-anonymous-default-export': 'error',
//       'import/no-cycle': 'error',
//       // 'import/exports-last': 'error',
//       // 'import/prefer-default-export': 'error',
//       // 'import/group-exports': 'error',

//       /* `@emotion/eslint-plugin` rules */
//       '@emotion/no-vanilla': 'error',
//       '@emotion/import-from-emotion': 'error',
//       '@emotion/styled-import': 'error',
//       '@emotion/syntax-preference': ['error', 'object'],
//     },
//     root: true,
//   },
// ])
