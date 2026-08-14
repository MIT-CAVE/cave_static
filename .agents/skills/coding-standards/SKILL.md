---
name: coding-standards
description: Enforce coding conventions, including ESLint import order, prop-types validation, Ramda usage, and formatting.
---

# Coding Standards

Follow these strict patterns to maintain codebase consistency and ensure the automated pre-commit hooks pass.

## 1. File Extensions & Types

- **File Extensions**: Use `.js` for all source files, including those with JSX. Do not use `.jsx`.
- **Runtime Type Checking**: Every exported React component must define a `ComponentName.propTypes` block directly below it:

  ```js
  import PropTypes from 'prop-types'

  const MyComp = ({ label }) => <Box>{label}</Box>

  MyComp.propTypes = {
    label: PropTypes.string.isRequired,
  }
  ```

## 2. Formatting (Prettier & ESLint)

- **Semicolons**: Do not use semicolons (enforced by Prettier `semi: false`).
- **Quotes**: Use single quotes (`singleQuote: true`).
- **Trailing Commas**: ES5 trailing commas (`trailingComma: 'es5'`).
- **No Anonymous Exports**: Every default export must be named:

  ```js
  // Banned
  export default () => { ... }

  // Allowed
  const MyComponent = () => { ... }
  export default MyComponent
  ```

## 3. Import Order

Imports must be grouped in alphabetical order, with a blank line separating the groups:

1. External packages (npm libraries like `react`, `ramda`, `@mui/material`).
2. Sibling / Index imports (files in the same directory, e.g. `./data/local`, `./selectors`).
3. Parent imports (files in parent directories, e.g. `../../utils`, `../../../utils/enums`).

No circular imports or paths pointing directly to `index.js` (e.g. use `../../utils` instead of `../../utils/index.js`).

## 4. Functional Programming (Ramda)

Use Ramda (`import * as R from 'ramda'`) for data transformations instead of complex nested lodash or raw JS loops:

- Use `R.pipe` instead of nested functional calls.
- Use `R.pathOr` to safely traverse deeply nested objects.
- Use `R.cond` instead of long if/else chains.
