import React from 'react'

import GroupedOutputsToolbar from '../../../ui/views/dashboard/GroupedOutputsToolbar'
import { chartVariant } from '../../../utils/enums'

const groupedOutputsToolbarStories = {
  title: 'Views/Dashboard/GroupedOutputsToolbar',
  component: GroupedOutputsToolbar,
  parameters: {
    layoutWidth: '600px',
    layoutHeight: '600px',
  },
}

export default groupedOutputsToolbarStories

const baseGroupedOutputState = {
  groupedOutputs: {
    data: {
      demand: {
        name: 'Demand Metrics',
        groupLists: {
          region: ['Northeast', 'Southeast', 'Midwest', 'West'],
          product: ['Widget A', 'Widget B', 'Widget C'],
        },
      },
      supply: {
        name: 'Supply Metrics',
        groupLists: {
          warehouse: ['WH-1', 'WH-2', 'WH-3'],
          supplier: ['Supplier Alpha', 'Supplier Beta'],
        },
      },
    },
    types: {
      demand: {
        total_demand: { name: 'Total Demand', unit: 'units' },
        avg_demand: { name: 'Average Demand', unit: 'units' },
        peak_demand: { name: 'Peak Demand', unit: 'units' },
      },
      supply: {
        inventory: { name: 'Inventory Level', unit: 'units' },
        lead_time: { name: 'Lead Time', unit: 'days' },
      },
    },
  },
  statGroupings: {
    region: {
      name: 'Region',
      grouping: 'Geography',
      layoutDirection: 'vertical',
      data: {
        Northeast: { name: 'Northeast' },
        Southeast: { name: 'Southeast' },
        Midwest: { name: 'Midwest' },
        West: { name: 'West' },
      },
    },
    product: {
      name: 'Product',
      grouping: 'Category',
      layoutDirection: 'vertical',
      data: {
        widget_a: { name: 'Widget A' },
        widget_b: { name: 'Widget B' },
        widget_c: { name: 'Widget C' },
      },
    },
  },
  pages: {
    currentPage: 'page_1',
    data: {},
  },
}

export const Default = {
  render: () => <GroupedOutputsToolbar index="chart_1" />,
  parameters: {
    preloadedState: {
      data: {
        ...baseGroupedOutputState,
        pages: {
          currentPage: 'page_1',
          data: {
            page_1: {
              charts: {
                chart_1: {
                  chartType: chartVariant.BAR,
                  type: 'groupedOutput',
                  dataset: 'demand',
                  stats: [{ statId: 'total_demand', aggregationType: 'sum' }],
                  groupingId: ['region'],
                  groupingLevel: ['Northeast'],
                },
              },
            },
          },
        },
      },
      local: {
        settings: {
          sync: {},
        },
        panes: {
          data: {},
        },
      },
    },
  },
}

export const TableVariant = {
  render: () => <GroupedOutputsToolbar index="chart_1" />,
  parameters: {
    preloadedState: {
      data: {
        ...baseGroupedOutputState,
        pages: {
          currentPage: 'page_1',
          data: {
            page_1: {
              charts: {
                chart_1: {
                  chartType: chartVariant.TABLE,
                  type: 'groupedOutput',
                  dataset: 'demand',
                  stats: [
                    { statId: 'total_demand', aggregationType: 'sum' },
                    { statId: 'avg_demand', aggregationType: 'mean' },
                  ],
                  groupingId: ['region'],
                  groupingLevel: ['Northeast'],
                },
              },
            },
          },
        },
      },
      local: {
        settings: {
          sync: {},
        },
        panes: {
          data: {},
        },
      },
    },
  },
}

export const NoDataset = {
  render: () => <GroupedOutputsToolbar index="chart_1" />,
  parameters: {
    preloadedState: {
      data: {
        ...baseGroupedOutputState,
        pages: {
          currentPage: 'page_1',
          data: {
            page_1: {
              charts: {
                chart_1: {
                  chartType: chartVariant.BAR,
                  type: 'groupedOutput',
                  groupingId: [],
                  groupingLevel: [],
                },
              },
            },
          },
        },
      },
      local: {
        settings: {
          sync: {},
        },
        panes: {
          data: {},
        },
      },
    },
  },
}
