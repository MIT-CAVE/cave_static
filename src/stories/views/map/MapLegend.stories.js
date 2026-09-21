import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import CompactLegend from '../../../ui/views/map/CompactLegend'
import FullLegend from '../../../ui/views/map/FullLegend'
import MapLegend from '../../../ui/views/map/MapLegend'
import { MapContext } from '../../../ui/views/map/useMapApi'
import { legendViews, propId } from '../../../utils/enums'

const mockStore = configureStore({
  reducer: {
    data: (
      state = {
        maps: {
          data: {
            map_1: {
              name: 'Logistics Network',
              currentStyle: 'cartoDarkMatter',
              legendView: legendViews.COMPACT,
              legendGroups: {
                group_1: {
                  id: 'group_1',
                  name: 'Facilities & Routes',
                  data: {
                    warehouse: {
                      id: 'warehouse',
                      value: true,
                      name: 'Warehouses',
                      colorBy: 'capacity',
                      sizeBy: 'throughput',
                      icon: 'md/MdWarehouse',
                      props: {
                        capacity: {
                          name: 'Storage Capacity',
                          type: propId.NUMBER,
                          unit: 'k sqft',
                          precision: 1,
                          gradient: {
                            scale: 'linear',
                            data: [
                              { value: 'min', color: '#3f51b5' },
                              { value: 'max', color: '#f44336' },
                            ],
                          },
                        },
                        throughput: {
                          name: 'Daily Throughput',
                          type: propId.NUMBER,
                          unit: 'tons',
                          precision: 0,
                          gradient: {
                            scale: 'linear',
                            data: [
                              { value: 'min', size: 10 },
                              { value: 'max', size: 30 },
                            ],
                          },
                        },
                      },
                      values: {
                        capacity: 150,
                        throughput: 500,
                      },
                    },
                    freightRoute: {
                      id: 'freightRoute',
                      value: true,
                      name: 'Freight Routes',
                      colorBy: 'flow',
                      sizeBy: 'traffic',
                      heightBy: 'altitude',
                      lineStyle: 'solid',
                      props: {
                        flow: {
                          name: 'Route Flow',
                          type: propId.NUMBER,
                          unit: 'TEU',
                          precision: 0,
                          gradient: {
                            scale: 'linear',
                            data: [
                              { value: 'min', color: '#00e676' },
                              { value: 'max', color: '#ff9100' },
                            ],
                          },
                        },
                        traffic: {
                          name: 'Daily Trips',
                          type: propId.NUMBER,
                          precision: 0,
                          gradient: {
                            scale: 'linear',
                            data: [
                              { value: 'min', size: 2 },
                              { value: 'max', size: 8 },
                            ],
                          },
                        },
                      },
                      values: {
                        flow: 2500,
                        traffic: 45,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        nodes: {
          types: {
            warehouse: { name: 'Warehouses', icon: 'md/MdWarehouse' },
          },
          data: {
            wh_1: {
              type: 'warehouse',
              name: 'Oakland Hub',
              latitude: 37.8,
              longitude: -122.27,
              values: { capacity: 150, throughput: 500 },
            },
          },
        },
        arcs: {
          types: {
            freightRoute: { name: 'Freight Routes' },
          },
          data: {
            arc_1: {
              type: 'freightRoute',
              name: 'Oakland to SF',
              path: [
                [-122.27, 37.8],
                [-122.41, 37.77],
              ],
              values: { flow: 2500, traffic: 45 },
            },
          },
        },
        geos: {
          types: {},
          data: {},
        },
        settings: {},
      }
    ) => state,
    local: (
      state = {
        maps: {
          data: {},
          mapLegend: {
            map_1: { isOpen: true },
          },
        },
      }
    ) => state,
    utilities: (
      state = {
        virtualKeyboard: {
          isOpen: false,
          lastKeyPress: '',
          inputValue: '',
        },
      }
    ) => state,
  },
})

const mapDecorator = (Story) => (
  <Provider store={mockStore}>
    <MapContext.Provider
      value={{
        mapId: 'map_1',
        mapRef: { current: null },
        containerRef: { current: null },
        mapLoaded: true,
      }}
    >
      <div style={{ padding: 24, minHeight: 400, backgroundColor: '#212121' }}>
        <Story />
      </div>
    </MapContext.Provider>
  </Provider>
)

const mapLegendStories = {
  title: 'Map/MapLegend',
  component: MapLegend,
  decorators: [mapDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default mapLegendStories

export const Compact = {
  render: () => <CompactLegend />,
}

export const Full = {
  render: () => <FullLegend />,
}

export const DefaultMapLegend = {
  render: () => <MapLegend />,
}
