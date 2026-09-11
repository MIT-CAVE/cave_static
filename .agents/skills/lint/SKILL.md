---
name: lint
description: Formats code and checks for syntax errors, styling violations, and unused directives.
---

# Linting and Formatting

The codebase uses Prettier and ESLint (incorporating plugins for React, Emotion object styles, and imports) to maintain cleanliness.

## Formatting Commands

- **Run Lint Check & Fix**:

  ```sh
  npm run lint
  ```

  This runs Prettier and ESLint with auto-fix across all source code.

- **Pre-commit Hooks**:
  Pre-commit hooks are configured via `simple-git-hooks` and `lint-staged`. When you commit, files will be formatted automatically. Ensure they pass lint check with `0` warnings before staging. You do not need to run the linter (`npm run lint`) for every intermediate change during development; it is only forced before commits.
