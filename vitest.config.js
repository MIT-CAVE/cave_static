import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.js'

export default defineConfig((env) => {
  const baseConfig =
    typeof viteConfig === 'function' ? viteConfig(env) : viteConfig

  return mergeConfig(
    baseConfig,
    defineConfig({
      optimizeDeps: {
        include: [
          '@emotion/react/jsx-runtime',
          '@mui/material/Paper',
          '@mui/material/Table',
          '@mui/material/TableBody',
          '@mui/material/TableCell',
          '@mui/material/TableContainer',
          '@mui/material/TableHead',
          '@mui/material/TablePagination',
          '@mui/material/TableRow',
          '@mui/material/styles',
          '@mui/x-data-grid',
          'earcut',
          'echarts-for-react/lib/core',
          'echarts/charts',
          'echarts/components',
          'echarts/core',
          'echarts/renderers',
          'maplibre-gl',
          'mui-color-input',
          'react-draggable',
          'react-grid-layout',
          'react-icons/ai',
          'react-icons/bs',
          'react-icons/fa',
          'react-icons/io',
          'react-icons/lu',
          'react-icons/pi',
          'react-icons/ri',
          'react-markdown',
          'react-simple-keyboard',
          'react-syntax-highlighter',
          'react-syntax-highlighter/dist/esm/styles/prism',
          'react-transition-group',
          'react-virtualized-auto-sizer',
          'react-window',
          'rehype-katex',
          'rehype-raw',
          'remark-gfm',
          'remark-math',
          'three',
        ],
      },
      test: {
        projects: [
          {
            extends: true,
            plugins: [
              storybookTest({
                configDir: '.storybook',
              }),
            ],
            test: {
              name: 'storybook',
              browser: {
                enabled: true,
                provider: playwright(),
                instances: [{ browser: 'chromium' }],
              },
            },
          },
        ],
      },
    })
  )
})
