// eslint-disable-next-line import/no-unresolved
import react from '@vitejs/plugin-react'
// eslint-disable-next-line import/no-unresolved
import { defineConfig, loadEnv, transformWithOxc } from 'vite'

const jsxInJs = () => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.match(/src\/.*\.js$/)) return null

    return await transformWithOxc(code, id, {
      lang: 'jsx',
      target: 'es2022',
      reactCompiler: true,
    })
  },
})

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
    plugins: [jsxInJs(), react()],
    legacy: {
      // See: https://vite.dev/guide/migration#consistent-commonjs-interop
      inconsistentCjsInterop: true,
    },
    optimizeDeps: {
      force: true,
      rolldownOptions: {
        moduleTypes: {
          '.js': 'jsx',
        },
      },
    },
    server: commonServerConfig,
    preview: commonServerConfig,
    envPrefix: ['REACT_APP_'],
    define: {
      'process.env.DRAGGABLE_DEBUG': JSON.stringify(
        process.env.DRAGGABLE_DEBUG ?? false
      ),
    },
    base: mode === 'development' || isPreview ? '/' : env.BASE_URL,
    build: {
      outDir: env.BUILD_PATH || 'build',
      sourcemap: env.GENERATE_SOURCEMAP === 'true',
    },
  }
})
