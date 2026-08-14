---
name: testing
description: Write component stories, test components programmatically, and run Vitest browser tests.
---

# Component Testing and Isolated Development

This project uses **Storybook (Vite edition)** for isolated component workshop development, and **Vitest** (running in Playwright browser mode) for programmatic component testing.

## 1. Directory Structure

- **Storybook Configurations**: Located in `.storybook/` (contains `main.js` and `preview.js`).
- **Component Stories**: Story files are placed in `src/stories/` or alongside the components themselves, named `*.stories.js` (using Component Story Format v3).
- **Test Files**: Stories are automatically detected and run as browser tests under Vitest.

## 2. Running Commands

| Command              | Action                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| `npm run storybook`  | Launch Storybook on `localhost:6006` for isolated component development. |
| `npm run test`       | Run the test suite via Vitest (browser mode with Playwright).            |
| `npm run test:watch` | Run Vitest in watch mode for hot-reloading test runs.                    |

## 3. Writing Stories (CSF v3)

Stories should export a default config referencing the component, and named exports representing states:

```js
import React from 'react'
import { PropToggleCheckbox } from '../ui/compound/PropToggle'

export default {
  title: 'Compound/PropToggle',
  component: PropToggleCheckbox,
}

export const Checkbox = {
  render: (args) => <PropToggleCheckbox {...args} />,
  args: {
    prop: {
      enabled: true,
      label: 'Feature Toggle',
      value: false,
    },
    currentVal: false,
    onChange: () => {},
  },
}
```

## 4. How Vitest Browser Mode Works

- Storybook addon-vitest (`@storybook/addon-vitest`) integrates with Vitest.
- When `npm run test` is executed, Vitest spins up Playwright to mount and run interaction tests inside a real browser (Chromium).
- Any custom assertions or interaction play functions (e.g. `play` methods in CSF stories) will execute programmatically.
