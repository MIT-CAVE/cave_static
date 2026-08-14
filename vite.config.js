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
      // Re-enable (or run `npx vite --force` once) if the dep cache goes
      // stale and modules fail to resolve after dependency/config changes.
      // force: true,
      include: [
        '@emotion/styled',
        '@mui/material/Paper',
        '@mui/material/Table',
        '@mui/material/TableBody',
        '@mui/material/TableCell',
        '@mui/material/TableContainer',
        '@mui/material/TableHead',
        '@mui/material/TablePagination',
        '@mui/material/TableRow',
        '@mui/material/styles',
        '@emotion/react/jsx-runtime',
        '@reduxjs/toolkit',
        'react-redux',
        'ramda',
        'prop-types',
      ],
      rolldownOptions: {
        moduleTypes: {
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
