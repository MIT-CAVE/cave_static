# cave_static: Development Guide

## Project Purpose

`cave_static` is a React-based single-page application (SPA) that serves as the frontend for the `cave_app` platform. Core capabilities:

- **Real-time data consumption** — connects to `cave_app` via WebSocket, receiving data mutations and overwrites keyed by version numbers
- **Interactive map views** — renders nodes, arcs, and geographies using Mapbox GL / MapLibre GL with dynamic color, size, and height encoding
- **Chart dashboard** — ECharts-based visualizations (bar, line, scatter, box, heatmap, treemap, sunburst, waterfall, gauge, and more) plus a custom table chart
- **Configurable prop panels** — server-driven UI controls (number fields, dropdowns, toggles, sliders, date pickers, etc.) laid out via a server-defined grid schema
- **Draggable overlays** — floating panels for time control, session selection, global outputs, and map labels
- **Virtual keyboard support** — on-screen numeric keyboard for touch/tablet environments

The app has no standalone mode. It must be accessed through `cave_app` at `localhost:8000`.

---

## Directory Layout (relevant files only)

```
src/
  index.js               # Entry point: WebSocket init, Redux Provider, StrictMode mount
  App.js                 # Root component: defines caveTheme, top-level layout shell
  index.css              # Global CSS reset / base styles
  App.css                # App-level CSS (minimal — most styling is via Emotion/sx)

  data/
    data/
      index.js           # Server-synced Redux slice: nodes, arcs, geos, stats, appBar,
                         #   settings, versions. Actions: mutateData, overwriteData, sendCommand
      utils.js           # Data-layer utilities
    local/
      index.js           # Client-only Redux slice: mutateLocal, deleteLocal
      actions.js         # overrideSync action creator (cross-slice coordination)
      globalOutputsSlice.js
      settingsSlice.js
    utilities/
      index.js           # Combines all utility slices
      loadingSlice.js    # Global loading indicator state
      messagesSlice.js   # Snackbar message queue
      sessionsSlice.js   # Available session list
      timeSlice.js       # Time control state
      tokensSlice.js     # Auth tokens (Mapbox, etc.)
      virtualKeyboardSlice.js  # Caret position + input value for virtual keyboard
    selectors/
      index.js           # All memoized selectors (createSelector / lruMemoize).
                         #   Components read state exclusively through selectors here.

  ui/
    compound/            # Reusable prop control components
      Prop*.js           # One file per prop type/variant (PropNumberField, PropToggle, etc.)
      *Base.js           # Headless primitives (CheckboxBase, RadioBase, StepperBase, ComboboxBase)
      index.js           # Re-exports all compound components
      useNumberInput.js  # Shared hook for number input behavior
    prototypes/          # Next-gen components targeting Base UI (v5+ design system)
      NumberField.js     # Hybrid Base UI + MUI number input with virtual keyboard support
      Spinner.js         # Increase/decrease spinner buttons for NumberField
    draggables/
      Draggables.js      # Mounts all active draggable panels
      TimeDraggable.js
      SessionDraggable.js
      GlobalOutputsDraggable.js
      MapNameDraggable.js
      index.js
    views/
      common/
        renderProp.js    # Maps propId + propVariant → Prop* component via R.cond
        renderLayout.js  # Recursively renders grid/item layout trees
        renderAppBar.js  # LeftAppBar, RightAppBar, Panes
        AppBar.js        # Individual app bar tab component
        AppSettingsPane.js
        BaseModal.js
        Modal.js         # AppModal with routing to specific modal types
        Pane.js          # Collapsible side pane shell
        OptionsPane.js
        SessionPane.js
        Loader.js        # Full-screen loading overlay
        SnackBar.js      # Message snackbar
        VirtualKeyboard.js
        useVirtualKeyboard.js
        useVirtualKeyboardAlt.js
        TimeControl.js
        FilterModal.js
        ChartToolsModal.js
        ColorChangeModal.js
        GroupsFilter.js
        GridFilter.js
        GridEditMultiSelectCell.js
        GridEditTimeCell.js
        EnhancedEditSingleSelect.js
      dashboard/
        Dashboard.js     # Dashboard view root; react-grid-layout grid of charts
        DashboardChart.js
        DashboardGlobalOutputs.js
        ChartMenu.js
        ChartTypeSelector.js
        ChartDropdownWrapper.js
        MapToolbar.js
        GlobalOutputsToolbar.js
        GroupedOutputsToolbar.js
      map/
        Map.js           # Map view root (react-map-gl)
        MapControls.js
        MapPortal.js
        MapModal.js
        MapLegend.js
        Legend.js / FullLegend.js / CompactLegend.js
        ColorLegend.js / HeightLegend.js / SizeLegend.js
        CustomLayers.js
        layers.js        # MapLibre/Mapbox layer definitions for nodes, arcs, geos
        useMapApi.js
        useMapFilter.js
    charts/
      chart-types/
        echarts/         # ECharts-based chart components (BarPlot, LinePlot, etc.)
          BaseChart.js   # Shared ECharts wrapper (echarts-for-react)
          FlexibleContainer.js
          ChartControls.js
          BarPlot.js / LinePlot.js / ScatterPlot.js / BubblePlot.js
          BoxPlot.js / Heatmap.js / Sunburst.js / Treemap.js
          GaugeChart.js / WaterfallChart.js / DistributionChart.js
          CumulativeLineChart.js / MixedChart.js
          index.js
        cave/
          TableChart.js  # Custom table chart (MUI DataGrid-based)
          index.js
        index.js
      index.js

  utils/
    store.js             # Redux store: combineReducers + asyncDispatchMiddleware
    websockets.js        # WebSocket singleton (socket class); JSON + msgpack support
    onMessage.js         # WebSocket message router → Redux dispatch
    enums.js             # All enum objects (propId, propVariant, paneId, draggableId, etc.)
    constants.js         # App-wide constants (dimensions, defaults, limits)
    scales.js            # Value scaling utilities (linear, log, categorical)
    stats.js             # Statistical aggregation functions
    hooks.js             # Custom React hooks
    ColorGen.js          # Deterministic color generation from string keys
    NumberFormat.js      # Number formatting (precision, units, locale)
    quantile.js          # Quantile computation
    supercluster.js      # Supercluster wrapper for map point clustering
    ThreadMaxWorkers.js  # Web Worker pool size detection
    computationWorker.js # Web Worker for off-thread computation
    svgBuilder.js        # SVG shape path generation
    downloadFile.js      # Trigger browser file download
    index.js             # Re-exports all utilities

public/                  # Static assets served as-is
vite.config.js           # Vite config: jsxInJs plugin, React Compiler (Babel), envPrefix
.eslintrc.cjs            # ESLint config (react-app + import + ramda + emotion + compat)
prettier.config.js       # Prettier: no semis, single quotes, ES5 trailing commas
lint-staged.config.js    # Pre-commit: prettier + eslint on staged .js/.jsx files
.simple-git-hooks.js     # Git hook: pre-commit → lint-staged
.browserslistrc          # Target browser support (used by eslint-plugin-compat)
.env                     # Local env vars (not committed): BASE_URL, BUILD_PATH, etc.
deploy.sh                # AWS S3 + CloudFront deployment script
```

---

## Development Commands

| Command             | What it does                                               |
| ------------------- | ---------------------------------------------------------- |
| `npm run setup`     | Remove `node_modules`, install deps, install git hooks     |
| `npm start`         | Vite dev server at `localhost:3000`                        |
| `npm run lint`      | Prettier + ESLint with auto-fix across all source files    |
| `npm run build`     | Production build → `BUILD_PATH` (from `.env`)              |
| `npm run build:dev` | Development build → `BUILD_PATH`                           |
| `npm run preview`   | Serve the last build at `localhost:3000`                   |
| `npm run reset`     | Remove `package-lock.json` + `node_modules`, then re-setup |
| `./deploy.sh`       | Deploy build to S3 and invalidate CloudFront cache         |

> **Important:** `npm start` / `npm run preview` serve on `localhost:3000`, but the app requires an active `cave_app` backend. Access it through `cave_app` at `localhost:8000`, not directly.

**Pre-commit hook**: lint-staged runs `prettier --write` + `eslint --max-warnings=0 --fix` on all staged `.js`/`.jsx` files automatically.

**Bundle analysis:**

```sh
npm install -g source-map-explorer
# in .env: GENERATE_SOURCEMAP=true
npm run build
source .env && source-map-explorer $(find $BUILD_PATH/static/js* -name "main*.js")
```

---

## Core Architecture

### Redux Store (`src/utils/store.js`)

Three top-level slices combined with Redux Toolkit's `combineReducers`:

```
store
├── data        # Server-synced state
├── local       # Client-only state
└── utilities   # UI utility state
```

A custom `asyncDispatchMiddleware` enriches every action with an `asyncDispatch` method, allowing reducers to queue additional dispatches that fire after the current synchronous action completes. This is how `mutateLocal` with `sync: true` triggers a `sendCommand` from inside a reducer.

Redux DevTools are enabled when `REACT_APP_USE_REDUX_DEVTOOLS=true` in `.env` and the build is a dev build.

### State Slices

**`data` slice** (`src/data/data/index.js`) — Server-synced data. Shape:

```js
{
  settings: {},      // App configuration from server
  appBar: {},        // Navigation / view definitions
  categories: {},    // Categorical data definitions
  nodes: {},         // Map node objects
  arcs: {},          // Map arc objects
  geos: {},          // Map geography objects
  stats: {},         // Grouped output statistics
  globalOutputs: {}, // Global KPI outputs
  versions: {},      // Version map for conflict detection
  ignore: {},        // Flags for suppressing loading indicators
  associated: {},    // Associated data
}
```

Key async thunks:

- `mutateData` — applies a single path/value mutation from the server, after version-checking
- `overwriteData` — replaces entire data subtrees, handles sync path overrides
- `sendCommand` — sends a JSON command over WebSocket (e.g., `get_session_data`, `mutate_session`)

**`local` slice** (`src/data/local/index.js`) — Client-only state. Combines `settingsSlice` and `globalOutputsSlice` as nested reducers:

```js
mutateLocal({ path: ['settings', 'open'], value: true })
// sync: true → also calls sendCommand to persist to server
mutateLocal({ path: [...], value: ..., sync: true })
deleteLocal({ path: [...] })
```

**`utilities` slice** (`src/data/utilities/`) — Supporting state:

- `loadingSlice` — tracks pending WebSocket requests
- `messagesSlice` — snackbar message queue
- `sessionsSlice` — available session list
- `timeSlice` — time index and playback state
- `tokensSlice` — Mapbox token storage
- `virtualKeyboardSlice` — virtual keyboard caret position and current input value

### WebSocket (`src/utils/websockets.js`)

A singleton `socket` instance. Lifecycle:

```
window 'message' event (event === 'initialize')
  → tokensSet(mapboxToken)
  → websocket.connect(token, onMessage, wsPath, wsEncoding)
  → sendCommand({ command: 'get_session_data', data: {} })
```

Supports `json` (default) and `msgpack` wire encoding, controlled by `ws_encoding` from the `initialize` payload. Auto-reconnects on close with a 1-second delay. Sends data as `JSON.stringify`.

### Message Router (`src/utils/onMessage.js`)

Routes incoming WebSocket payloads by `event` field:

| `event`          | Action                                                 |
| ---------------- | ------------------------------------------------------ |
| `mutation`       | `dispatch(mutateData(payload))`                        |
| `overwrite`      | `dispatch(overwriteData(payload))`                     |
| `updateSessions` | `dispatch(updateSessions(payload))`                    |
| `updateLoading`  | `dispatch(updateLoading(payload))`                     |
| `message`        | `dispatch(addMessage(payload))` — shows a snackbar     |
| `export`         | `downloadFile(data, name)` — triggers browser download |

### Selectors (`src/data/selectors/index.js`)

All memoized with `createSelector` / `lruMemoize` from Redux Toolkit. Components never read raw Redux state — they always go through a selector. When adding new derived state, add a selector here rather than computing inside the component.

### Prop System (`src/ui/views/common/renderProp.js`, `renderLayout.js`)

The server sends a `props` dict (keyed by prop ID) and an optional `layout` tree. The prop system renders these as UI controls:

1. `renderLayout.js` walks the layout tree — `grid` nodes auto-compute column/row counts; `item` nodes resolve to a specific prop.
2. `renderProp.js` maps each prop's `type` (from `propId`) + `variant` (from `propVariant`) to the correct `Prop*` component using `R.cond` chains.
3. Each `Prop*` component reads the prop object, renders the control, and calls `onChange` when committed.

`renderPropsLayout` is the main entry point used by panes and panels.

### Theme (`src/App.js`)

Dark-mode MUI theme created with `createTheme`. Key customizations:

```js
const caveTheme = createTheme({
  palette: {
    mode: 'dark',
    greyscale: { main, light, dark, contrastText }, // custom palette key
    background: { paper: '#4a4a4a' },
  },
  components: {
    MuiDataGrid: { styleOverrides: { ... } },
  },
  typography: { fontFamily: 'inherit' },
})
```

All components are wrapped in `<ThemeProvider theme={caveTheme}>`.

### Prototypes (`src/ui/prototypes/`)

Hybrid Base UI + MUI components intended as the foundation for a future pure-Base-UI design system (v5+). Do not use prototypes outside of `compound/` components that wrap them. The `NumberField` prototype combines:

- `@base-ui/react/number-field` — accessible number input primitive with spinner support
- MUI `OutlinedInput` / `FormControl` — visual shell and labeling
- `KeyboardToggle` — virtual numeric keyboard attachment

---

## Coding Conventions

### File Extensions

All source files use `.js` — including files with JSX. There are no `.jsx` files. Vite's custom `jsxInJs` plugin (using OXC) handles the JSX transform for `.js` files in `src/`.

### Type Checking

No TypeScript. Runtime type-checking with `prop-types`. Every exported React component must include a `ComponentName.propTypes = { ... }` block directly after the component definition.

```js
const MyComp = ({ label, value, onChange }) => { ... }

MyComp.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  onChange: PropTypes.func,
}

export default MyComp
```

### Styling

Emotion CSS-in-JS with **object syntax only** — template literal syntax is banned by `@emotion/syntax-preference`.

Define a top-level `styles` object per file. Pass style objects via MUI's `sx` prop:

```js
const styles = {
  root: {
    display: 'flex',
    gap: 1, // MUI spacing unit
  },
  label: {
    color: 'text.secondary',
    fontWeight: 'bold',
  },
}

// Usage
<Box sx={styles.root}>
  <Typography sx={styles.label}>{label}</Typography>
</Box>
```

When composing multiple style sources (e.g., external `sx` prop + internal styles), use an array:

```js
<Box sx={[styles.root, disabled && styles.disabled, ...forceArray(sx)]} />
```

**Rules:**

- No inline `style={{ ... }}` objects — use `sx` instead
- No deep MUI imports (`@mui/*/*/*` is banned) — import from `@mui/material` or `@mui/x-*` directly
- Emotion `styled()` components are allowed but `@emotion/css` (vanilla) is not

### Import Order

ESLint enforces strict ordering. Groups separated by blank lines, alphabetical within each group:

```js
// 1. External packages (npm)
import * as R from 'ramda'
import { useSelector } from 'react-redux'

// 2. Sibling / index imports
import { mutateLocal } from './data/local'
import { selectFoo } from './data/selectors'

// 3. Parent imports
import { forceArray } from '../../utils'
import { propId } from '../../utils/enums'
```

**Rules:**

- No anonymous default exports — all default exports must be named
- No `import 'something'` unassigned imports except CSS files
- No circular imports (`import/no-cycle`)
- No path segments like `../../foo/index.js` — use `../../foo` instead

### Functional Programming (Ramda)

Ramda is the standard data-manipulation library. `eslint-plugin-ramda` enforces idiomatic usage.

```js
import * as R from 'ramda'

// Prefer R.pipe over chained calls
const result = R.pipe(
  R.filter(R.propEq('active', true)),
  R.pluck('id'),
  R.uniq
)(items)

// Prefer R.pathOr over manual null checks
const name = R.pathOr('Unknown', ['settings', 'name'], data)

// Prefer R.cond over if/else chains
const getRenderer = R.cond([
  [R.equals('bar'), R.always(BarPlot)],
  [R.equals('line'), R.always(LinePlot)],
  [R.T, R.always(BaseChart)],
])
```

### Enums (`src/utils/enums.js`)

All string constants used as identifiers are collected here as plain objects:

```js
export const propId = {
  NUMBER: 'num',
  TEXT: 'text',
  TOGGLE: 'toggle',
  // ...
}
```

Import specific enums by name — never hardcode their string values in components.

### Comments

Write comments only where the **why** is non-obvious: a hidden constraint, a workaround for a specific bug, or behavior that would surprise a reader.

Recognized comment tags:

- `// TODO:` — planned future change
- `// NOTE:` — non-obvious behavior or constraint
- `// REVIEW:` — open design question
- `// eslint-disable-next-line` — only when there is no better option

Do not write comments that restate what the code does, reference the current task, or describe callers.

### Component Pattern

```js
import PropTypes from 'prop-types'
import { useState } from 'react'
import { useSelector } from 'react-redux'

import { selectFoo } from '../../data/selectors'

import { forceArray } from '../../../utils'

// 1. Styles object (before component)
const styles = {
  root: { display: 'flex' },
}

// 2. Functional component, props destructured in signature
const MyComponent = ({ label, value, sx = [], onChange }) => {
  const foo = useSelector(selectFoo)

  return <Box sx={[styles.root, ...forceArray(sx)]}>{label}</Box>
}

// 3. PropTypes block (after component)
MyComponent.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

// 4. Default export (last line)
export default MyComponent
```

### Other Rules

- **No unnecessary abstractions** — don't extract a helper unless the same logic appears 3+ times
- **Template literals** — prefer `` `Hello ${name}` `` over `'Hello ' + name` (`prefer-template` lint rule)
- **No semicolons** — Prettier config: `semi: false`
- **Single quotes** — Prettier config: `singleQuote: true`
- **Trailing commas** — ES5 style (Prettier config: `trailingComma: 'es5'`)

---

## Adding a New Prop Component

Prop components are server-driven UI controls. To add a new one:

1. **Create** `src/ui/compound/PropMyThing.js` with the standard component pattern (default export, PropTypes block).

2. **Export** it from `src/ui/compound/index.js`.

3. **Register enum values** in `src/utils/enums.js` if the new prop needs a new `propId` or `propVariant`.

4. **Wire into the renderer** in `src/ui/views/common/renderProp.js` by adding a branch to the appropriate `R.cond` chain:

   ```js
   const getMyTypePropRenderFn = R.cond([
     [R.equals(propVariant.MY_VARIANT), R.always(PropMyThing)],
     [R.T, invalidVariant('myType')],
   ])
   ```

   Then add a case for the new `propId` in `getPropRenderFn`.

5. **Run `npm run lint`** before committing.

---

## Environment Variables

Stored in `.env` (not committed). Vite only exposes variables prefixed with `REACT_APP_` to client code.

| Variable                       | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `BASE_URL`                     | URL base path for production builds              |
| `BUILD_PATH`                   | Output directory for `npm run build`             |
| `GENERATE_SOURCEMAP`           | `true` to emit source maps (for bundle analysis) |
| `REACT_APP_USE_REDUX_DEVTOOLS` | `true` to enable Redux DevTools in dev builds    |

---

## Deployment

`./deploy.sh` automates production deployment.

Only a maintainer should ever run this script. It should be manually fired from the command line after running `npm run build` and verifying the output. Do not automate this in CI or run it without verifying the build first.

It does the following:

1. Reads `.env` for `S3_BUCKET`, `BUILD_PATH`, and `BUILD_VERSION`
2. Creates the S3 bucket if it doesn't exist
3. Creates a CloudFront distribution pointing at the bucket if one doesn't exist
4. Uploads the build output to `s3://$S3_BUCKET/$BUILD_VERSION/`
5. If overwriting an existing version, invalidates the CloudFront cache
6. Prints S3 and CDN URLs

Requires AWS CLI v2+ and appropriate IAM permissions. After first deploy, [route a Route 53 subdomain to the CloudFront distribution](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-cloudfront-distribution.html).
