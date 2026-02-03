// eslint-disable-next-line import/no-unresolved
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, transformWithEsbuild } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode, isPreview }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // Common server configuration for both `vite dev` and `vite preview`
  const commonServerConfig = {
    port: 3000,
    host: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-site',
    },
  }

  return {
    plugins: [
      {
        name: 'treat-js-files-as-jsx',
        async transform(code, id) {
          if (!id.match(/src\/.*\.js$/)) return null

          // Use the exposed transform from vite, instead of directly
          // transforming with esbuild
          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          })
        },
      },
      react(),
    ],
    optimizeDeps: {
      force: true,
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: commonServerConfig,
    preview: commonServerConfig,
    envPrefix: ['REACT_APP_'],
    base: mode === 'development' || isPreview ? '/' : env.BASE_URL,
    build: {
      outDir: env.BUILD_PATH || 'build',
      sourcemap: env.GENERATE_SOURCEMAP === 'true',
    },
  }
})
