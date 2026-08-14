---
name: run
description: Run the development environment, reset node modules, preview builds, or manage dependencies.
---

# Running and Setting Up `cave_static`

This React single-page application is built with Vite. It runs locally but requires an active `cave_app` backend.

## Development Commands

| Command             | Action                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------- |
| `npm run setup`     | Clean install: removes `node_modules`, installs dependencies, and configures Git hooks. |
| `npm start`         | Launches the Vite dev server at `localhost:3000`.                                       |
| `npm run preview`   | Serves the production build locally at `localhost:3000`.                                |
| `npm run reset`     | Re-installs dependencies from scratch (deletes `package-lock.json` and `node_modules`). |
| `npm run build`     | Compiles the production bundle to `BUILD_PATH` (configured in `.env`).                  |
| `npm run build:dev` | Compiles the development bundle to `BUILD_PATH`.                                        |

## Core Lifecycle / Setup Guidelines

1. **Active Backend Required**:
   - Access the application through `cave_app` at `localhost:8000`, not `localhost:3000` directly.
   - The app establishes a WebSocket connection back to the backend.

2. **Re-installing Dependencies**:
   - If dependencies change or you experience build anomalies, run:
     ```sh
     npm run reset
     ```
