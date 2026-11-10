import { configureStore } from '@reduxjs/toolkit'
import React, { useState } from 'react'
import { Provider } from 'react-redux'
import { expect } from 'storybook/test'

import dataReducer, { overwriteData } from '../../../data/data'
import localReducer from '../../../data/local'
import {
  timeAdvanceContinuous,
  timeSetStart,
} from '../../../data/local/settingsSlice'
import utilitiesReducer from '../../../data/utilities'
import TimeControl from '../../../ui/views/common/TimeControl'
import CompactLegend from '../../../ui/views/map/CompactLegend'
import FullLegend from '../../../ui/views/map/FullLegend'
import {
  MapLayers,
  Geos,
  Arcs,
  Nodes,
  Arcs3D,
} from '../../../ui/views/map/layers'
import MapControls from '../../../ui/views/map/MapControls'
import { MapContext } from '../../../ui/views/map/useMapApi'

import { combineReducers } from '../../../utils'

const animationDataset = {
  settings: {
    iconUrl: 'https://react-icons.mitcave.com/5.4.0',
    time: { timeLength: 15, timeUnits: 'seconds', looping: false, speed: 1 },
  },
  appBar: {
    order: {
      data: ['mapPage'],
    },
    data: {
      mapPage: {
        icon: 'md/MdMap',
        type: 'page',
        bar: 'upperLeft',
      },
    },
  },
  maps: {
    data: {
      exampleMap: {
        name: 'Example Map',
        currentProjection: 'globe',
        defaultViewport: {
          longitude: 0,
          latitude: 0,
          zoom: 3,
          pitch: 0,
          bearing: 0,
          maxZoom: 12,
          minZoom: 2,
        },
        legendGroups: {
          facilities: {
            name: 'Facilities',
            data: {
              warehouse: {
                value: true,
                colorBy: 'includesAutomation',
                colorByOptions: ['capacity', 'includesAutomation'],
                sizeBy: 'capacity',
                sizeByOptions: ['capacity'],
                icon: 'fa6/FaWarehouse',
              },
              robot: {
                value: true,
                colorBy: 'isAvailable',
                colorByOptions: ['capacity', 'isAvailable'],
                sizeBy: 'capacity',
                sizeByOptions: ['capacity'],
                icon: 'fa/FaRobot',
              },
            },
          },
        },
      },
    },
  },
  mapFeatures: {
    data: {
      warehouse: {
        type: 'node',
        name: 'Warehouse',
        props: {
          scenario: {
            name: 'Scenario',
            type: 'text',
            enabled: false,
            display: false,
            help: 'The scenario name',
          },
          capacity: {
            name: 'Capacity',
            type: 'num',
            unit: 'Cubic Feet',
            help: 'The warehouse capacity in cubic feet',
            gradient: {
              notation: 'precision',
              precision: 0,
              data: [
                {
                  value: 'min',
                  size: '30px',
                  color: 'rgb(233 0 0)',
                },
                {
                  value: 'max',
                  size: '45px',
                  color: 'rgb(96 2 2)',
                },
              ],
            },
          },
          includesAutomation: {
            name: 'Includes Automation',
            type: 'toggle',
            help: 'Whether the warehouse includes automation',
            options: {
              false: { color: 'rgb(255 0 0)' },
              true: { color: 'rgb(0 255 0)' },
            },
          },
        },
        data: {
          location: {
            latitude: [[43.78], [39.82]],
            longitude: [[-79.63], [-86.18]],
            timeValues: {
              0: {
                latitude: [[43.78], [39.82]],
              },
              4: {
                latitude: [[44.78], [39.82]],
              },
              5: {
                latitude: [[45.78], [39.82]],
              },
              6: {
                latitude: [[46.78], [39.82]],
              },
              7: {
                latitude: [[46.78], [40.82]],
              },
              8: {
                latitude: [[46.78], [40.82]],
              },
            },
          },
          valueLists: {
            capacity: [80, 100],
            includesAutomation: [true, false],
            scenario: ['Scenario 1', 'Scenario 2'],
          },
        },
      },
      robot: {
        type: 'node',
        name: 'Robot',
        props: {
          scenario: {
            name: 'Scenario',
            type: 'text',
            enabled: false,
            display: false,
            help: 'The scenario name',
          },
          capacity: {
            name: 'Capacity',
            type: 'num',
            unit: 'Cubic Feet',
            help: 'The robot carrying capacity in cubic feet',
            gradient: {
              notation: 'precision',
              precision: 0,
              data: [
                {
                  value: 'min',
                  size: '30px',
                  color: 'rgb(233 0 0)',
                },
                {
                  value: 'max',
                  size: '45px',
                  color: 'rgb(96 2 2)',
                },
              ],
            },
          },
          isAvailable: {
            name: 'Is Available',
            type: 'toggle',
            help: 'Whether the robot is available',
            options: {
              false: { color: 'rgb(255 0 0)' },
              true: { color: 'rgb(0 255 0)' },
            },
          },
        },
        data: {
          location: {
            latitude: [
              [38.78, 38.78, 38.78],
              [25, 25, 15],
            ],
            longitude: [
              [-79.63, -78.6, -77.55],
              [-75, -70, -70],
            ],
            animationTime: [
              [0, 3, 5],
              [0, 4, 7],
            ],
            visibilityIndex: [[0]],
            visibilityTime: [[1.4, 2, 4, 10]],
          },
          valueLists: {
            capacity: [80, 100],
            isAvailable: [true, false],
            scenario: ['Scenario 1', 'Scenario 2'],
          },
        },
      },
    },
  },
  pages: {
    currentPage: 'mapPage',
    data: {
      mapPage: {
        charts: {
          map: {
            type: 'map',
            mapId: 'exampleMap',
            maximized: true,
          },
        },
        pageLayout: ['map', null, null, null],
      },
    },
  },
}

let testStoreInstance = null

const createTestStore = () => {
  const store = configureStore({
    reducer: combineReducers({
      data: dataReducer,
      local: localReducer,
      utilities: utilitiesReducer,
    }),
  })
  store.dispatch(
    overwriteData({
      data: animationDataset,
      versions: { settings: 1, appBar: 1, maps: 1, mapFeatures: 1, pages: 1 },
    })
  )
  testStoreInstance = store
  return store
}

const AnimationViewer = () => {
  const [storeInstance] = useState(createTestStore)

  return (
    <Provider store={storeInstance}>
      <MapContext.Provider
        value={{
          mapId: 'exampleMap',
          mapLoaded: true,
          mapRef: { current: null },
        }}
      >
        <div>
          <TimeControl />
          <CompactLegend />
          <FullLegend />
          <MapControls mapId="exampleMap" />
          <MapLayers />
          <Geos />
          <Arcs />
          <Nodes />
          <Arcs3D />
        </div>
      </MapContext.Provider>
    </Provider>
  )
}

const StoryMeta = {
  title: 'Views/Map/NodeAnimation',
  component: AnimationViewer,
}

export default StoryMeta

export const PlayAnimationInteraction = {
  render: () => <AnimationViewer />,
  play: async () => {
    expect(testStoreInstance).toBeDefined()
    testStoreInstance.dispatch(timeSetStart())
    testStoreInstance.dispatch(timeAdvanceContinuous(1))
    await new Promise((r) => setTimeout(r, 50))
    testStoreInstance.dispatch(timeAdvanceContinuous(2))
    await new Promise((r) => setTimeout(r, 50))
    testStoreInstance.dispatch(timeAdvanceContinuous(4))
    await new Promise((r) => setTimeout(r, 50))
    testStoreInstance.dispatch(timeAdvanceContinuous(8))
    await new Promise((r) => setTimeout(r, 50))
    testStoreInstance.dispatch(timeAdvanceContinuous(12))
    await new Promise((r) => setTimeout(r, 50))
  },
}
