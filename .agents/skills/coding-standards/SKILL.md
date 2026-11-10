---
name: coding-standards
description: Enforce coding conventions, including ESLint import order, prop-types validation, and formatting.
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

Previoulsy we used Ramda (`import * as R from 'ramda'`) for data transformations instead of complex nested JS loops.

Moving forward, we are migrating towards a pure JS. As you work through the codebase, refactor away from Ramda as appropriate to the task at hand, however do not refactor existing code that is already using Ramda unless it is necessary for the task.

## 5. Performance Considerations

Strive to write performant code. Avoid unnecessary re-renders, and use memoization techniques (e.g., `React.memo`, `useMemo`, `useCallback`) where appropriate. Always consider the impact of your code on the overall application performance.

At the same time, work towards a more functional programming style, avoiding side effects and mutable state where possible. This will help maintain a clean and predictable codebase.

Furthermore, strive to write code that is easy to read and understand, even if it means sacrificing minor (5-10%) performance. Prioritize reusability, clarity and maintainability over micro-optimizations.
