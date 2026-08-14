---
name: state-management
description: Manage Redux Toolkit slices, async dispatch actions, WebSocket communications, and memoized selectors.
---

# State Management

`cave_static` divides state into three distinct Redux slices: `data` (server-synced), `local` (client-only), and `utilities` (transient UI states).

## 1. Redux Slices

- **`data` Slice** (`src/data/data/index.js`):
  - Server-synced state containing `settings`, `appBar`, `categories`, `nodes`, `arcs`, `geos`, `stats`, `globalOutputs`, and `versions`.
  - Driven by WebSocket events (`mutation`, `overwrite`).
- **`local` Slice** (`src/data/local/index.js`):
  - Stores local configuration states.
  - Call `mutateLocal` or `deleteLocal`. Setting `sync: true` automatically persistent changes to the server.
- **`utilities` Slice** (`src/data/utilities/`):
  - Manages UI helper states (e.g., loading spinners, error snackbars, session lists, time playback, on-screen virtual keyboard).

## 2. Async Dispatch Middleware

A custom middleware enables `asyncDispatch` inside reducers to queue further actions. This allows reducers to trigger side effects (like sending socket payloads) after state updates are synchronously completed.

## 3. WebSocket Communication

WebSocket communication is handled by the `socket` singleton (`src/utils/websockets.js`):

- Payloads can be JSON or msgpack encoded.
- Handled by `onMessage.js` which routes messages to Redux dispatch actions based on the payload `event` type.

## 4. Selectors

All reads from the Redux store must go through memoized selectors defined in `src/data/selectors/index.js`:

- Use RTK's `createSelector` and `lruMemoize` to optimize performance and prevent unnecessary re-renders.
- Components must never access raw state directly.
