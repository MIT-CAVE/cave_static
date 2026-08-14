import React from 'react'

import MapToolbar from '../../../ui/views/dashboard/MapToolbar'

const mapToolbarStories = {
  title: 'Views/Dashboard/MapToolbar',
  component: MapToolbar,
  parameters: {
    layoutWidth: '500px',
    layoutHeight: '300px',
  },
}

export default mapToolbarStories

export const MultipleMaps = {
  render: () => <MapToolbar chartObj={{ mapId: 'map_1' }} index="chart_1" />,
  parameters: {
    preloadedState: {
      data: {
        maps: {
          data: {
            map_1: { name: 'San Francisco Logistics' },
            map_2: { name: 'East Coast Distribution' },
            map_3: { name: 'Global Supply Chain' },
          },
        },
        pages: {
          currentPage: 'page_1',
          data: {
            page_1: {
              charts: {
                chart_1: {
                  chartType: 'bar',
                  type: 'map',
                  mapId: 'map_1',
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

export const SingleMap = {
  render: () => <MapToolbar chartObj={{ mapId: 'map_1' }} index="chart_1" />,
  parameters: {
    preloadedState: {
      data: {
        maps: {
          data: {
            map_1: { name: 'Warehouse Network' },
          },
        },
        pages: {
          currentPage: 'page_1',
          data: {
            page_1: {
              charts: {
                chart_1: {
                  chartType: 'bar',
                  type: 'map',
                  mapId: 'map_1',
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

export const NoMaps = {
  render: () => <MapToolbar chartObj={{}} index="chart_1" />,
  parameters: {
    preloadedState: {
      data: {
        maps: {
          data: {},
        },
        pages: {
          currentPage: 'page_1',
          data: {
            page_1: {
              charts: {
                chart_1: {
                  chartType: 'bar',
                  type: 'map',
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
