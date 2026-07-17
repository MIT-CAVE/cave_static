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

## Skills

Refer to these skills in `.agents/skills/` for detailed guides and conventions:

| Skill                                                        | Use when                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| [run](.agents/skills/run/SKILL.md)                           | Setting up, running, or previewing the Vite development server.                                        |
| [coding-standards](.agents/skills/coding-standards/SKILL.md) | Writing JavaScript code, validating props, ordering imports, or using Ramda.                           |
| [styling](.agents/skills/styling/SKILL.md)                   | Styling components using Emotion JS object syntax, MUI `sx` prop, and dark mode theme variables.       |
| [state-management](.agents/skills/state-management/SKILL.md) | Reading/writing from the Redux store, defining slices, adding memoized selectors, or using WebSockets. |
| [add-prop](.agents/skills/add-prop/SKILL.md)                 | Implementing a new server-driven prop control component.                                               |
| [lint](.agents/skills/lint/SKILL.md)                         | Formatting and linting files using Prettier and ESLint.                                                |
| [deploy](.agents/skills/deploy/SKILL.md)                     | Compiling the app and deploying to AWS S3/CloudFront.                                                  |
| [testing](.agents/skills/testing/SKILL.md)                   | Writing component stories, testing components programmatically, and running Vitest browser tests.      |

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

  stories/               # Storybook component stories and integration tests
    Prop*.stories.js     # Component-specific stories using React local-state wrapping
    Draggables.stories.js # Story configuration for floating draggable panels

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

## Environment Variables

Stored in `.env` (not committed). Vite only exposes variables prefixed with `REACT_APP_` to client code.

| Variable                       | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `BASE_URL`                     | URL base path for production builds              |
| `BUILD_PATH`                   | Output directory for `npm run build`             |
| `GENERATE_SOURCEMAP`           | `true` to emit source maps (for bundle analysis) |
| `REACT_APP_USE_REDUX_DEVTOOLS` | `true` to enable Redux DevTools in dev builds    |
| `S3_BUCKET`                    | Target AWS S3 Bucket name for deployments        |
| `BUILD_VERSION`                | Target AWS S3 prefix folder name for deployments |

---

## Storybook and Testing

We use Storybook for visual development of UI components, combined with Vitest browser mode to run programmatically isolated tests for all component stories.

### Storybook UI Conventions

- All stories live under `src/stories/` and are named `*.stories.js`.
- Story components use React local-state wrapping for controlled MUI elements to allow instant UI updates upon interaction.
- The default layout width constraint (`400px` for controls, customized overrides for wider components) is controlled via `.storybook/preview.js`.

### Testing Workflow

- **Linting**: Formatting and syntax checks are run via `npm run lint`.
- **Unit Tests**: Headless browser test suite executes via `npm run test` or in watch mode via `npm run test:watch`.
- Vitest configuration is defined in `vitest.config.js` with dynamic dependency pre-bundling configured under `optimizeDeps` to prevent test-run reloads.

---

## Ignore

Gitignored paths are not relevant: `node_modules`, `build`, `dist`, `.agents`.
