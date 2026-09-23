import React from 'react'
import { expect, within, userEvent } from 'storybook/test'

import App from '../../App'

const initData = {
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
    order: {
      additionalMapStyles: [
        'squareGrid',
        'landscapeGrid',
        'portraitGrid',
        'warehouse',
      ],
    },
    additionalMapStyles: {
      squareGrid: {
        name: 'Square Grid',
        icon: 'md/MdBrush',
        spec: {
          version: 8,
          sources: {
            grid: {
              type: 'raster',
              tiles: [
                'https://raw.githubusercontent.com/MIT-CAVE/cave_app_extras/refs/heads/main/example_data/square_grid_tiles/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster',
              source: 'grid',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
      },
      landscapeGrid: {
        name: 'Landscape Grid',
        icon: 'md/MdBrush',
        spec: {
          version: 8,
          sources: {
            grid: {
              type: 'raster',
              tiles: [
                'https://raw.githubusercontent.com/MIT-CAVE/cave_app_extras/refs/heads/main/example_data/landscape_grid_tiles/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster',
              source: 'grid',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
      },
      portraitGrid: {
        name: 'Portrait Grid',
        icon: 'md/MdBrush',
        spec: {
          version: 8,
          sources: {
            grid: {
              type: 'raster',
              tiles: [
                'https://raw.githubusercontent.com/MIT-CAVE/cave_app_extras/refs/heads/main/example_data/portrait_grid_tiles/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster',
              source: 'grid',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
      },
      warehouse: {
        name: 'Warehouse',
        icon: 'md/MdBrush',
        spec: {
          version: 8,
          sources: {
            grid: {
              type: 'raster',
              tiles: [
                'https://raw.githubusercontent.com/MIT-CAVE/cave_app_extras/refs/heads/main/example_data/warehouse_grid_tiles/{z}/{x}/{y}.png',
              ],
              tileSize: 512,
            },
          },
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster',
              source: 'grid',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
      },
    },
    data: {
      squareMap: {
        name: 'Square Map',
        currentProjection: 'mercator',
        lockProjection: true,
        currentStyle: 'squareGrid',
        lockStyle: true,
        defaultViewport: {
          longitude: 0,
          latitude: 0,
          zoom: 0,
          pitch: 0,
          bearing: 0,
          maxZoom: 12,
          minZoom: 0,
        },
        legendGroups: {
          items: {
            name: 'Points',
            data: {
              squareGridPoint: {
                value: true,
                colorBy: 'availability',
                colorByOptions: ['amount', 'availability'],
                sizeBy: 'amount',
                sizeByOptions: ['amount'],
                icon: 'fa/FaCircle',
              },
            },
          },
        },
      },
      landscapeMap: {
        name: 'Landscape Map',
        currentProjection: 'mercator',
        lockProjection: true,
        currentStyle: 'landscapeGrid',
        lockStyle: true,
        defaultViewport: {
          longitude: 0,
          latitude: 0,
          zoom: 0,
          pitch: 0,
          bearing: 0,
          maxZoom: 12,
          minZoom: 0,
        },
        legendGroups: {
          items: {
            name: 'Points',
            data: {
              landscapeGridPoint: {
                value: true,
                colorBy: 'availability',
                colorByOptions: ['amount', 'availability'],
                sizeBy: 'amount',
                sizeByOptions: ['amount'],
                icon: 'fa/FaCircle',
              },
            },
          },
        },
      },
      portraitMap: {
        name: 'Portrait Map',
        currentProjection: 'mercator',
        lockProjection: true,
        currentStyle: 'portraitGrid',
        lockStyle: true,
        defaultViewport: {
          longitude: 0,
          latitude: 0,
          zoom: 0,
          pitch: 0,
          bearing: 0,
          maxZoom: 12,
          minZoom: 0,
        },
        legendGroups: {
          items: {
            name: 'Points',
            data: {
              portraitGridPoint: {
                value: true,
                colorBy: 'availability',
                colorByOptions: ['amount', 'availability'],
                sizeBy: 'amount',
                sizeByOptions: ['amount'],
                icon: 'fa/FaCircle',
              },
            },
          },
        },
      },
      warehouseMap: {
        name: 'Warehouse Map',
        currentProjection: 'mercator',
        lockProjection: true,
        currentStyle: 'warehouse',
        lockStyle: true,
        defaultViewport: {
          longitude: 0,
          latitude: 0,
          zoom: 0,
          pitch: 0,
          bearing: 0,
          maxZoom: 12,
          minZoom: 0,
        },
        legendGroups: {
          robot: {
            name: 'Robot',
            data: {
              robot: {
                value: true,
                colorBy: 'availability',
                colorByOptions: ['amount', 'availability'],
                sizeBy: 'amount',
                sizeByOptions: ['amount'],
                icon: 'fa/FaRobot',
              },
              robotPath: {
                value: true,
                colorBy: 'preferredRoute',
                colorByOptions: ['capacity', 'preferredRoute'],
                sizeBy: 'capacity',
                sizeByOptions: ['capacity'],
              },
            },
          },
          regions: {
            name: 'Regions',
            data: {
              region: {
                value: true,
                icon: 'bi/BiPolygon',
                colorBy: 'isAvailable',
                colorByOptions: ['isAvailable'],
              },
            },
          },
        },
      },
    },
  },
  mapFeatures: {
    data: {
      squareGridPoint: {
        type: 'node',
        name: 'Square Grid Point',
        props: {
          amount: {
            name: 'Amount',
            type: 'num',
            unit: 'Example Unit',
            help: 'Example Amount',
            gradient: {
              notation: 'precision',
              precision: 0,
              data: [
                {
                  value: 'min',
                  size: '35px',
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
          availability: {
            name: 'Availability',
            type: 'toggle',
            help: 'Whether the space is available',
            options: {
              false: { color: 'rgb(255 0 0)' },
              true: { color: 'rgb(0 255 0)' },
            },
          },
        },
        data: {
          location: {
            latitude: [0.2, 0.4, 0.6],
            longitude: [0.2, 0.4, 0.6],
          },
          valueLists: {
            amount: [100, 100, 100],
            availability: [false, true, false],
          },
        },
      },
      landscapeGridPoint: {
        type: 'node',
        name: 'Landscape Grid Point',
        props: {
          amount: {
            name: 'Amount',
            type: 'num',
            unit: 'Example Unit',
            help: 'Example Amount',
            gradient: {
              notation: 'precision',
              precision: 0,
              data: [
                {
                  value: 'min',
                  size: '35px',
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
          availability: {
            name: 'Availability',
            type: 'toggle',
            help: 'Whether the space is available',
            options: {
              false: { color: 'rgb(255 0 0)' },
              true: { color: 'rgb(0 255 0)' },
            },
          },
        },
        data: {
          location: {
            latitude: [0.1, 0.3],
            longitude: [0.1, 0.3],
          },
          valueLists: {
            amount: [100, 100],
            availability: [false, false],
          },
        },
      },
      portraitGridPoint: {
        type: 'node',
        name: 'Portrait Grid Point',
        props: {
          amount: {
            name: 'Amount',
            type: 'num',
            unit: 'Example Unit',
            help: 'Example Amount',
            gradient: {
              notation: 'precision',
              precision: 0,
              data: [
                {
                  value: 'min',
                  size: '35px',
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
          availability: {
            name: 'Availability',
            type: 'toggle',
            help: 'Whether the space is available',
            options: {
              false: { color: 'rgb(255 0 0)' },
              true: { color: 'rgb(0 255 0)' },
            },
          },
        },
        data: {
          location: {
            latitude: [0.1, 0.5],
            longitude: [0.1, 0.5],
          },
          valueLists: {
            amount: [100, 100],
            availability: [false, false],
          },
        },
      },
      robot: {
        type: 'node',
        name: 'Robot',
        props: {
          amount: {
            name: 'Amount',
            type: 'num',
            unit: 'Example Unit',
            help: 'Example Amount',
            gradient: {
              notation: 'precision',
              precision: 0,
              data: [
                {
                  value: 'min',
                  size: '50px',
                  color: 'rgb(233 0 0)',
                },
                {
                  value: 'max',
                  size: '100px',
                  color: 'rgb(96 2 2)',
                },
              ],
            },
          },
          availability: {
            name: 'Availability',
            type: 'toggle',
            help: 'Whether the space is available',
            options: {
              false: { color: 'rgb(255 0 0)' },
              true: { color: 'rgb(0 255 0)' },
            },
          },
        },
        data: {
          location: {
            latitude: [0.5],
            longitude: [0.5],
          },
          valueLists: {
            amount: [100],
            availability: [false],
          },
        },
      },
      robotPath: {
        type: 'arc',
        name: 'Robot Path',
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
            latitude: [[0.1, 0.2, 0.3, 0.4]],
            longitude: [[0.1, 0.2, 0.3, 0.4]],
          },
          valueLists: {
            capacity: [100],
            preferredRoute: [true],
          },
        },
      },
      region: {
        type: 'geo',
        name: 'Warehouse Region',
        props: {
          isAvailable: {
            name: 'Is Available',
            type: 'toggle',
            help: 'Whether this area is available',
            options: {
              false: { color: 'rgb(255 0 0)' },
              true: { color: 'rgb(0 255 0)' },
            },
          },
        },
        data: {
          location: {
            latitude: [[[0.1, 0.5, 0.5, 0.1, 0.1]]],
            longitude: [[[0.1, 0.1, 0.5, 0.5, 0.1]]],
          },
          valueLists: {
            isAvailable: [true],
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
          square: {
            type: 'map',
            mapId: 'squareMap',
          },
          landscape: {
            type: 'map',
            mapId: 'landscapeMap',
          },
          portrait: {
            type: 'map',
            mapId: 'portraitMap',
          },
          warehouse: {
            type: 'map',
            mapId: 'warehouseMap',
          },
        },
        pageLayout: ['square', 'landscape', 'portrait', 'warehouse'],
      },
    },
  },
}

const customMapTilesStories = {
  title: 'Workspaces/CustomMapTiles',
  component: App,
  parameters: {
    initData,
    layout: 'fullscreen',
    layoutWidth: 'full',
  },
}

export default customMapTilesStories

export const Default = {
  render: () => <App />,
  play: async () => {
    // Wait for initial render of all 4 maps
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const body = within(document.body)

    // Assert that the app loaded successfully and did NOT fall back to Sessions Pane.
    expect(body.queryByText('Sessions Pane')).toBeNull()

    // Verify that layers are present on initial load across all maps
    const getSourceFeaturesCount = (mapGl, sourceId) => {
      const source = mapGl?.getSource?.(sourceId)
      const data =
        source?._data ||
        source?._options?.data ||
        source?.serialize?.()?.data ||
        mapGl?.getStyle?.()?.sources?.[sourceId]?.data
      return data?.features?.length
    }

    const squareMap = window.__maps?.squareMap?.current
    const squareMapGl = squareMap?.getMap ? squareMap.getMap() : squareMap
    expect(
      squareMapGl?.getLayer('nodeIconLayer-squareMap-squareGridPoint')
    ).toBeDefined()
    expect(
      getSourceFeaturesCount(
        squareMapGl,
        'nodeIconLayer-squareMap-squareGridPoint'
      )
    ).toBe(3)

    const landscapeMap = window.__maps?.landscapeMap?.current
    const landscapeMapGl = landscapeMap?.getMap
      ? landscapeMap.getMap()
      : landscapeMap
    expect(
      landscapeMapGl?.getLayer('nodeIconLayer-landscapeMap-landscapeGridPoint')
    ).toBeDefined()
    expect(
      getSourceFeaturesCount(
        landscapeMapGl,
        'nodeIconLayer-landscapeMap-landscapeGridPoint'
      )
    ).toBe(2)

    const portraitMap = window.__maps?.portraitMap?.current
    const portraitMapGl = portraitMap?.getMap
      ? portraitMap.getMap()
      : portraitMap
    expect(
      portraitMapGl?.getLayer('nodeIconLayer-portraitMap-portraitGridPoint')
    ).toBeDefined()
    expect(
      getSourceFeaturesCount(
        portraitMapGl,
        'nodeIconLayer-portraitMap-portraitGridPoint'
      )
    ).toBe(2)

    const warehouseMap = window.__maps?.warehouseMap?.current
    const warehouseMapGl = warehouseMap?.getMap
      ? warehouseMap.getMap()
      : warehouseMap
    expect(
      getSourceFeaturesCount(warehouseMapGl, 'nodeIconLayer-warehouseMap-robot')
    ).toBe(1)
    const robotPathCount =
      (getSourceFeaturesCount(
        warehouseMapGl,
        'multiArcLayerSolid-warehouseMap-robotPath'
      ) || 0) +
      (getSourceFeaturesCount(
        warehouseMapGl,
        'arcLayerSolid-warehouseMap-robotPath'
      ) || 0)
    expect(robotPathCount).toBe(1)
    const regionCount =
      (getSourceFeaturesCount(
        warehouseMapGl,
        'includedGeographyLayer-warehouseMap-region'
      ) || 0) +
      (getSourceFeaturesCount(
        warehouseMapGl,
        'geographyLayer-warehouseMap-region'
      ) || 0)
    expect(regionCount).toBe(1)

    // Find all switches across the 4 map legends
    const initialSwitches = document.querySelectorAll('input[type="checkbox"]')
    expect(initialSwitches.length).toBeGreaterThanOrEqual(6)

    // Loop through all layer switches and toggle each off and back on twice
    for (let round = 0; round < 2; round++) {
      const switches = document.querySelectorAll('input[type="checkbox"]')
      for (let i = 0; i < switches.length; i++) {
        const currentSwitch = document.querySelectorAll(
          'input[type="checkbox"]'
        )[i]
        if (!currentSwitch) continue
        const wasChecked = currentSwitch.checked

        // Toggle layer
        await userEvent.click(currentSwitch)
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Assert that toggling layer did NOT crash or fall back to Sessions Pane
        expect(body.queryByText('Sessions Pane')).toBeNull()
        expect(document.body.textContent).not.toContain('Sessions Pane')

        // Toggle back to restore original state
        const switchAfter =
          document.querySelectorAll('input[type="checkbox"]')[i] ||
          currentSwitch
        if (switchAfter && switchAfter.checked !== wasChecked) {
          await userEvent.click(switchAfter)
          await new Promise((resolve) => setTimeout(resolve, 300))
        }

        // Assert that restoring did NOT crash or fall back to Sessions Pane
        expect(body.queryByText('Sessions Pane')).toBeNull()
        expect(document.body.textContent).not.toContain('Sessions Pane')
      }
    }
  },
}
