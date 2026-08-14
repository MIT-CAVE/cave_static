import { Box } from '@mui/material'
import React from 'react'

import ChartMenu from '../../../ui/views/dashboard/ChartMenu'
import { chartVariant } from '../../../utils/enums'

const chartMenuStories = {
  title: 'Views/Dashboard/ChartMenu',
  component: ChartMenu,
  parameters: {
    layoutWidth: '400px',
    layoutHeight: '400px',
    preloadedState: {
      local: {
        settings: {
          editLayout: false,
          sync: {},
        },
      },
    },
  },
}

export default chartMenuStories

export const BarChart = {
  render: (args) => (
    <Box sx={{ position: 'relative', height: 300, width: '100%' }}>
      <ChartMenu {...args} />
    </Box>
  ),
  args: {
    isMaximized: false,
    chartType: chartVariant.BAR,
    vizType: 'groupedOutput',
    defaultToZero: false,
    showNA: false,
    chartHoverOrder: 'seriesDesc',
    numFilters: 2,
    onToggleDefaultToZero: () => {},
    onToggleShowNA: () => {},
    onRemoveChart: () => {},
    onToggleMaximize: () => {},
    onChartHover: () => {},
    onOpenFilter: () => {},
    onOpenChartTools: () => {},
    onOpenColorChange: () => {},
  },
}

export const TableChart = {
  render: (args) => (
    <Box sx={{ position: 'relative', height: 300, width: '100%' }}>
      <ChartMenu {...args} />
    </Box>
  ),
  args: {
    isMaximized: false,
    chartType: chartVariant.TABLE,
    vizType: 'groupedOutput',
    defaultToZero: true,
    showNA: true,
    chartHoverOrder: 'valueDesc',
    numFilters: 0,
    onToggleDefaultToZero: () => {},
    onToggleShowNA: () => {},
    onRemoveChart: () => {},
    onToggleMaximize: () => {},
    onChartHover: () => {},
    onOpenFilter: () => {},
    onOpenChartTools: () => {},
    onOpenColorChange: () => {},
  },
}

export const MapViz = {
  render: (args) => (
    <Box sx={{ position: 'relative', height: 300, width: '100%' }}>
      <ChartMenu {...args} />
    </Box>
  ),
  args: {
    isMaximized: false,
    chartType: chartVariant.BAR,
    vizType: 'map',
    defaultToZero: false,
    showNA: false,
    chartHoverOrder: 'seriesAsc',
    numFilters: 0,
    onToggleDefaultToZero: () => {},
    onToggleShowNA: () => {},
    onRemoveChart: () => {},
    onToggleMaximize: () => {},
    onChartHover: () => {},
    onOpenFilter: () => {},
    onOpenChartTools: () => {},
    onOpenColorChange: () => {},
  },
}

export const Maximized = {
  render: (args) => (
    <Box sx={{ position: 'relative', height: 300, width: '100%' }}>
      <ChartMenu {...args} />
    </Box>
  ),
  args: {
    isMaximized: true,
    chartType: chartVariant.LINE,
    vizType: 'groupedOutput',
    defaultToZero: false,
    showNA: false,
    chartHoverOrder: 'seriesDesc',
    numFilters: 5,
    onToggleDefaultToZero: () => {},
    onToggleShowNA: () => {},
    onRemoveChart: () => {},
    onToggleMaximize: () => {},
    onChartHover: () => {},
    onOpenFilter: () => {},
    onOpenChartTools: () => {},
    onOpenColorChange: () => {},
  },
}
