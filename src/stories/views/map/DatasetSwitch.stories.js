import { configureStore } from '@reduxjs/toolkit'
import React, { useState, useEffect } from 'react'
import { Provider } from 'react-redux'
import { userEvent, within, expect } from 'storybook/test'

import dataReducer, { overwriteData } from '../../../data/data'
import localReducer from '../../../data/local'
import utilitiesReducer from '../../../data/utilities'
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

const dataset1 = {
  settings: {
    iconUrl: 'https://react-icons.mitcave.com/5.4.0',
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
          longitude: -75.447,
          latitude: 40.345,
          zoom: 4.66,
          pitch: 0,
          bearing: 0,
          maxZoom: 12,
          minZoom: 2,
        },
        legendGroups: {
          transportation: {
            name: 'Transportation',
            data: {
              geoJsonRoutes: {
                value: true,
                colorBy: 'preferredRoute',
                colorByOptions: ['capacity', 'preferredRoute'],
                sizeBy: 'capacity',
                sizeByOptions: ['capacity'],
              },
              customRoutes: {
                value: true,
                colorBy: 'preferredRoute',
                colorByOptions: ['capacity', 'preferredRoute'],
                sizeBy: 'capacity',
                sizeByOptions: ['capacity'],
              },
            },
          },
        },
      },
    },
  },
  mapFeatures: {
    data: {
      geoJsonRoutes: {
        type: 'arc',
        name: 'GeoJson Routes',
        geoJson: {
          geoJsonLayer:
            'https://raw.githubusercontent.com/MIT-CAVE/cave_app_extras/main/example_data/example.geojson',
          geoJsonProp: 'arc_id',
        },
        props: {
          capacity: {
            name: 'Capacity',
            type: 'num',
            unit: 'Cubic Feet',
            help: 'The route capacity in shipments possible per week.',
            gradient: {
              notation: 'precision',
              precision: 0,
              data: [
                {
                  value: 'min',
                  size: '5px',
                  color: 'rgb(233 0 0)',
                },
                {
                  value: 'max',
                  size: '10px',
                  color: 'rgb(96 2 2)',
                },
              ],
            },
          },
          preferredRoute: {
            name: 'Preferred Route',
            type: 'toggle',
            help: 'Whether the route is preferred',
            options: {
              false: { color: 'rgb(255 0 0)' },
              true: { color: 'rgb(0 255 0)' },
            },
          },
          name: {
            name: 'Name',
            type: 'text',
            help: 'The name of the route',
          },
        },
        data: {
          location: {
            geoJsonValue: [
              'toronto-pittsburgh-indianapolis',
              'souix-falls-little-rock-memphis',
            ],
          },
          valueLists: {
            capacity: [65, 85],
            preferredRoute: [true, false],
            name: [
              'Toronto to Pittsburgh to Indianapolis',
              'Souix Falls to Little Rock to Memphis',
            ],
          },
        },
      },
      customRoutes: {
        type: 'arc',
        name: 'Custom Routes',
        props: {
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
                  value: 0,
                  size: '5px',
                  color: 'rgb(233 0 0)',
                },
                {
                  value: 105,
                  size: '10px',
                  color: 'rgb(96 2 2)',
                },
              ],
            },
          },
          preferredRoute: {
            name: 'Preferred Route',
            type: 'toggle',
            help: 'Whether the route is preferred',
            options: {
              false: { color: 'rgb(255 0 0)' },
              true: { color: 'rgb(0 255 0)' },
            },
          },
        },
        data: {
          location: {
            path: [
              [
                [-71.0589, 42.3601],
                [-73.7562, 42.6526],
                [-74.0059, 40.7128],
              ],
              [
                [-83.9207, 35.9606],
                [-84.2533, 30.4383],
                [-81.3792, 28.5383],
              ],
            ],
          },
          valueLists: {
            capacity: [75, 105],
            preferredRoute: [true, false],
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

const dataset2 = {
  settings: {
    iconUrl: 'https://react-icons.mitcave.com/5.4.0',
  },
  appBar: {
    order: {
      data: ['myCommandButton'],
    },
    data: {
      myCommandButton: {
        icon: 'md/MdLightbulbOutline',
        apiCommand: 'myCommand',
        type: 'button',
        bar: 'upperLeft',
      },
    },
  },
}

const createTestStore = () =>
  configureStore({
    reducer: combineReducers({
      data: dataReducer,
      local: localReducer,
      utilities: utilitiesReducer,
    }),
  })

const DatasetSwitcher = () => {
  const [activeDataset, setActiveDataset] = useState(1)
  const [storeInstance] = useState(createTestStore)

  useEffect(() => {
    storeInstance.dispatch(
      overwriteData({
        data: activeDataset === 1 ? dataset1 : dataset2,
        versions:
          activeDataset === 1
            ? { settings: 1, appBar: 1, maps: 1, mapFeatures: 1, pages: 1 }
            : { settings: 2, appBar: 2 },
      })
    )
  }, [activeDataset, storeInstance])

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
          <button
            id="switch-btn"
            data-testid="switch-btn"
            onClick={() => setActiveDataset((d) => (d === 1 ? 2 : 1))}
          >
            Switch to Dataset {activeDataset === 1 ? 2 : 1}
          </button>
          <div style={{ marginTop: 20 }}>
            <CompactLegend />
            <FullLegend />
            <MapControls mapId="exampleMap" />
            <MapLayers />
            <Geos />
            <Arcs />
            <Nodes />
            <Arcs3D />
          </div>
        </div>
      </MapContext.Provider>
    </Provider>
  )
}

const StoryMeta = {
  title: 'Views/Map/DatasetSwitch',
  component: DatasetSwitcher,
}

export default StoryMeta

export const SwitchDatasetsInteraction = {
  render: () => <DatasetSwitcher />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const btn = canvas.getByTestId('switch-btn')
    expect(btn).toBeDefined()
    // Click to switch to dataset 2
    await userEvent.click(btn)
    // Click again to switch back to dataset 1
    await userEvent.click(btn)
    // Click again to dataset 2
    await userEvent.click(btn)
  },
}
