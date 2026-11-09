---
name: lint
description: Formats code and checks for syntax errors, styling violations, and unused directives.
---

# Linting and Formatting

The codebase uses Prettier and Oxlint (native React/import rules plus JS plugins for Emotion object styles, Ramda, import order, browser compat, and Storybook) to maintain cleanliness.

## Formatting Commands

- **Run Lint Check & Fix**:

  ```sh
  npm run lint
  ```

  This runs Prettier and Oxlint with auto-fix across all source code. Config lives in `.oxlintrc.json`; `eslint-disable` comments are honored, and JS-plugin rules use the `import-js/` (not `import/`) prefix for `import-js/order`, `import-js/no-useless-path-segments` and `import-js/no-extraneous-dependencies`.

  **Do not remove the `eslint` devDependency.** Oxlint never runs ESLint itself, but the JS plugins (`eslint-plugin-import`, `-compat`, `-storybook`) `require('eslint')` at load time, and Oxlint crashes without it. It is only a plugin host, so keep it on the newest major that every plugin's `eslint` peer range allows. Currently that is `eslint@^9`: `eslint-plugin-import` (latest 2.32) caps its peer range at `^9`, which blocks ESLint 10, and `eslint-plugin-compat@^7` requires `^9 || ^10`. Before bumping ESLint or any `eslint-plugin-*`, check the peer ranges (`npm view <pkg> peerDependencies`), then run `npm run lint` plus a deliberate-violation file to confirm the plugin rules still fire.

- **Pre-commit Hooks**:
  Pre-commit hooks are configured via `simple-git-hooks` and `lint-staged`. When you commit, files will be formatted automatically. Ensure they pass lint check with `0` warnings before staging. You do not need to run the linter (`npm run lint`) for every intermediate change during development; it is only forced before commits.
