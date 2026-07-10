import React from 'react'

import GlobalOutputsToolbar from '../../../ui/views/dashboard/GlobalOutputsToolbar'
import { chartVariant } from '../../../utils/enums'

const globalOutputsToolbarStories = {
  title: 'Views/Dashboard/GlobalOutputsToolbar',
  component: GlobalOutputsToolbar,
  parameters: {
    layoutWidth: '500px',
    layoutHeight: '600px',
  },
}

export default globalOutputsToolbarStories

export const BarChart = {
  render: () => <GlobalOutputsToolbar index="chart_1" />,
  parameters: {
    preloadedState: {
      data: {
        globalOutputs: {
          props: {
            kpi_revenue: {
              type: 'num',
              name: 'Total Revenue',
              unit: '$',
              precision: 0,
              icon: 'md/MdTrendingUp',
              value: 1250000,
            },
            kpi_cost: {
              type: 'num',
              name: 'Total Cost',
              unit: '$',
              precision: 0,
              icon: 'md/MdTrendingDown',
              value: 950000,
            },
            kpi_margin: {
              type: 'num',
              name: 'Profit Margin',
              unit: '%',
              precision: 1,
              icon: 'md/MdPercent',
              value: 24.0,
            },
          },
          values: {
            kpi_revenue: { value: 1250000 },
            kpi_cost: { value: 950000 },
            kpi_margin: { value: 24.0 },
          },
        },
        associated: {
          session_a: {
            name: 'Production Run A',
            data: {
              globalOutputs: {
                props: {
                  kpi_revenue: {
                    type: 'num',
                    name: 'Total Revenue',
                    unit: '$',
                    precision: 0,
                  },
                  kpi_cost: {
                    type: 'num',
                    name: 'Total Cost',
                    unit: '$',
                    precision: 0,
                  },
                },
              },
            },
          },
          session_b: {
            name: 'Scenario Planning B',
            data: {
              globalOutputs: {
                props: {
                  kpi_revenue: {
                    type: 'num',
                    name: 'Total Revenue',
                    unit: '$',
                    precision: 0,
                  },
                  kpi_cost: {
                    type: 'num',
                    name: 'Total Cost',
                    unit: '$',
                    precision: 0,
                  },
                },
              },
            },
          },
        },
        pages: {
          currentPage: 'page_1',
          data: {
            page_1: {
              charts: {
                chart_1: {
                  chartType: chartVariant.BAR,
                  type: 'globalOutput',
                  sessions: [],
                  globalOutput: [],
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

export const OverviewChart = {
  render: () => <GlobalOutputsToolbar index="chart_1" />,
  parameters: {
    preloadedState: {
      data: {
        globalOutputs: {
          props: {
            kpi_throughput: {
              type: 'num',
              name: 'Throughput',
              unit: 'units/hr',
              precision: 1,
              icon: 'md/MdSpeed',
              value: 842.5,
            },
            kpi_utilization: {
              type: 'num',
              name: 'Utilization',
              unit: '%',
              precision: 1,
              icon: 'md/MdDonutSmall',
              value: 87.3,
            },
          },
          values: {
            kpi_throughput: { value: 842.5 },
            kpi_utilization: { value: 87.3 },
          },
        },
        associated: {},
        pages: {
          currentPage: 'page_1',
          data: {
            page_1: {
              charts: {
                chart_1: {
                  chartType: chartVariant.OVERVIEW,
                  type: 'globalOutput',
                  sessions: [],
                  globalOutput: [],
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
