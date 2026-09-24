import { describe, it, expect } from 'vitest'

import {
  selectAllGlobalIcons,
  selectAllGlobalNodeIcons,
  selectMapStyleOptions,
} from './index'

import {
  extractIconsFromState,
  getSvgMarkup,
  includesPath,
  isMapboxStyle,
  normalizeFog,
  renderIconTreeToSvg,
} from '../../utils'

describe('includesPath', () => {
  it('returns true for exact path matches in array of paths', () => {
    const paths = [
      ['pages', 'currentPage'],
      ['panes', 'paneState', 'left'],
    ]
    expect(includesPath(paths, ['pages', 'currentPage'])).toBe(true)
    expect(includesPath(paths, ['panes', 'paneState', 'left'])).toBe(true)
  })

  it('returns true when candidate path is a child of a path in the list', () => {
    const paths = [['panes', 'paneState']]
    expect(includesPath(paths, ['panes', 'paneState', 'left'])).toBe(true)
    expect(includesPath(paths, ['panes', 'paneState', 'right', 'open'])).toBe(
      true
    )
  })

  it('returns false for non-matching or sibling paths', () => {
    const paths = [['panes', 'paneState', 'left']]
    expect(includesPath(paths, ['panes', 'paneState', 'right'])).toBe(false)
    expect(includesPath(paths, ['pages', 'currentPage'])).toBe(false)
    expect(includesPath(paths, ['panes'])).toBe(false)
  })
})

describe('isMapboxStyle', () => {
  it('identifies Mapbox URLs', () => {
    expect(isMapboxStyle('mapbox://styles/mapbox/dark-v11')).toBe(true)
    expect(isMapboxStyle('mapbox://styles/mapbox/streets-v12')).toBe(true)
    expect(
      isMapboxStyle(
        'https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=pk.xxx'
      )
    ).toBe(true)
  })

  it('identifies non-Mapbox URLs (Carto, Stadia, OSM)', () => {
    expect(
      isMapboxStyle(
        'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      )
    ).toBe(false)
    expect(
      isMapboxStyle(
        'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      )
    ).toBe(false)
    expect(
      isMapboxStyle('https://tiles.stadiamaps.com/styles/alidade_smooth.json')
    ).toBe(false)
  })

  it('identifies style spec objects', () => {
    expect(
      isMapboxStyle({
        version: 8,
        glyphs:
          'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
        sources: {
          'osm-raster-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          },
        },
      })
    ).toBe(false)

    expect(
      isMapboxStyle({
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
      })
    ).toBe(true)
  })
})

describe('node layer toggling with local overrides', () => {
  const createMockState = (localLegendGroups = {}) => ({
    data: {
      maps: {
        data: {
          map1: {
            name: 'Map 1',
            currentStyle: 'osmRasterTiles',
            legendGroups: {
              lga: {
                data: {
                  nodeTypeA: {
                    value: true,
                    colorBy: 'propA',
                    sizeBy: 'propA',
                    icon: 'md/MdHome',
                  },
                },
              },
              lgb: {
                data: {
                  nodeTypeB: {
                    value: true,
                    colorBy: 'propB',
                    sizeBy: 'propB',
                    icon: 'md/MdWork',
                  },
                },
              },
            },
          },
        },
      },
      mapFeatures: {
        data: {
          nodeTypeA: {
            type: 'node',
            name: 'Node Type A',
            data: {
              location: {
                latitude: [40],
                longitude: [-74],
              },
              valueLists: {
                propA: [10],
              },
            },
            props: {
              propA: {
                type: 'num',
                fallback: { color: '#ff0000', size: '20px' },
                gradient: {
                  scale: 'linear',
                  data: [
                    { value: 0, color: '#ff0000', size: 10 },
                    { value: 100, color: '#880000', size: 30 },
                  ],
                },
              },
            },
          },
          nodeTypeB: {
            type: 'node',
            name: 'Node Type B',
            data: {
              location: {
                latitude: [41],
                longitude: [-75],
              },
              valueLists: {
                propB: [20],
              },
            },
            props: {
              propB: {
                type: 'num',
                fallback: { color: '#00ff00', size: '20px' },
                gradient: {
                  scale: 'linear',
                  data: [
                    { value: 0, color: '#00ff00', size: 10 },
                    { value: 100, color: '#008800', size: 30 },
                  ],
                },
              },
            },
          },
        },
      },
      settings: {},
    },
    local: {
      maps: {
        data: {
          map1: {
            legendGroups: localLegendGroups,
          },
        },
      },
    },
  })

  it('keeps untoggled node types enabled when one node type is toggled off locally', async () => {
    const { selectEnabledNodesFunc, selectNodeDataFunc } =
      await import('./index')

    // Initially both enabled
    const stateInitial = createMockState({})
    const enabledInitial = selectEnabledNodesFunc(stateInitial)('map1')
    expect(enabledInitial.nodeTypeA).toBeTruthy()
    expect(enabledInitial.nodeTypeB).toBeTruthy()
    const nodeDataInitial = selectNodeDataFunc(stateInitial)('map1')
    expect(nodeDataInitial.nodeTypeA).toBeDefined()
    expect(nodeDataInitial.nodeTypeB).toBeDefined()

    // Toggle nodeTypeA off in local state
    const stateToggled = createMockState({
      lga: {
        data: {
          nodeTypeA: {
            value: false,
          },
        },
      },
    })
    const enabledToggled = selectEnabledNodesFunc(stateToggled)('map1')
    expect(enabledToggled.nodeTypeA).toBe(false)
    const nodeDataToggled = selectNodeDataFunc(stateToggled)('map1')
    expect(nodeDataToggled.nodeTypeA).toBeUndefined()
    expect(nodeDataToggled.nodeTypeB).toBeDefined()

    // Verify geojson output
    const { selectNodeLayerGeoJsonFunc } = await import('./index')
    const geoJsonToggled = selectNodeLayerGeoJsonFunc(stateToggled)('map1')
    expect(
      geoJsonToggled.some((f) => f.properties?.cave_name?.includes('nodeTypeA'))
    ).toBe(false)
    expect(
      geoJsonToggled.some((f) => f.properties?.cave_name?.includes('nodeTypeB'))
    ).toBe(true)

    // Toggle nodeTypeA back on
    const stateRestored = createMockState({
      lga: {
        data: {
          nodeTypeA: {
            value: true,
          },
        },
      },
    })
    const enabledRestored = selectEnabledNodesFunc(stateRestored)('map1')
    expect(enabledRestored.nodeTypeA).toBeTruthy()
    expect(enabledRestored.nodeTypeB).toBeTruthy()
    const geoJsonRestored = selectNodeLayerGeoJsonFunc(stateRestored)('map1')
    expect(
      geoJsonRestored.some((f) =>
        f.properties?.cave_name?.includes('nodeTypeA')
      )
    ).toBe(true)
    expect(
      geoJsonRestored.some((f) =>
        f.properties?.cave_name?.includes('nodeTypeB')
      )
    ).toBe(true)
  })
})

describe('normalizeFog', () => {
  it('converts camelCase fog properties to kebab-case', () => {
    const rawFog = {
      range: [0.5, 10],
      color: 'rgb(255, 255, 255)',
      highColor: 'rgb(36, 92, 223)',
      spaceColor: ['interpolate', ['linear'], ['zoom'], 2, 'orange', 4, 'blue'],
      horizonBlend: [
        'interpolate',
        ['exponential', 1.2],
        ['zoom'],
        5,
        0.02,
        7,
        0.08,
      ],
      starIntensity: ['interpolate', ['linear'], ['zoom'], 5, 0.35, 6, 0],
      verticalRange: [0, 100],
    }
    const normalized = normalizeFog(rawFog)
    expect(normalized['high-color']).toBe('rgb(36, 92, 223)')
    expect(normalized['space-color']).toEqual([
      'interpolate',
      ['linear'],
      ['zoom'],
      2,
      'orange',
      4,
      'blue',
    ])
    expect(normalized['horizon-blend']).toEqual([
      'interpolate',
      ['exponential', 1.2],
      ['zoom'],
      5,
      0.02,
      7,
      0.08,
    ])
    expect(normalized['star-intensity']).toEqual([
      'interpolate',
      ['linear'],
      ['zoom'],
      5,
      0.35,
      6,
      0,
    ])
    expect(normalized['vertical-range']).toEqual([0, 100])
  })

  it('preserves existing kebab-case properties', () => {
    const rawFog = {
      'high-color': '#245cdf',
      'space-color': '#010b19',
    }
    const normalized = normalizeFog(rawFog)
    expect(normalized['high-color']).toBe('#245cdf')
    expect(normalized['space-color']).toBe('#010b19')
  })

  it('handles null and undefined gracefully', () => {
    expect(normalizeFog(null)).toBeNull()
    expect(normalizeFog(undefined)).toBeUndefined()
  })
})

describe('selectMapStyleOptions with fog normalization', () => {
  it('normalizes fog in additionalMapStyles', () => {
    const mockState = {
      data: {
        maps: {
          additionalMapStyles: {
            customFogStyle: {
              name: 'Custom Fog Style',
              spec: {
                version: 8,
                sources: {},
                layers: [],
              },
              fog: {
                highColor: 'red',
                spaceColor: 'blue',
              },
            },
          },
        },
      },
    }
    const styleOptions = selectMapStyleOptions(mockState)
    expect(styleOptions.customFogStyle.fog['high-color']).toBe('red')
    expect(styleOptions.customFogStyle.fog['space-color']).toBe('blue')
    expect(styleOptions.mapboxDark.fog).toBeDefined()
  })
})

describe('renderIconTreeToSvg and getSvgMarkup', () => {
  it('renders AST tree to SVG markup correctly with size and fill', () => {
    const iconTree = {
      tag: 'svg',
      attr: { viewBox: '0 0 24 24' },
      child: [
        {
          tag: 'path',
          attr: { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
        },
      ],
    }
    const svg = renderIconTreeToSvg(iconTree, '#ff0000', 48)
    expect(svg).toContain('viewBox="0 0 24 24"')
    expect(svg).toContain('width="48"')
    expect(svg).toContain('height="48"')
    expect(svg).toContain('fill="#ff0000"')
    expect(svg).toContain(
      '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path>'
    )
  })

  it('renders SVG markup via getSvgMarkup for AST object', () => {
    const iconTree = {
      tag: 'svg',
      attr: { viewBox: '0 0 24 24' },
      child: [],
    }
    const markup = getSvgMarkup(iconTree, '#00ff00', 32)
    expect(markup).toContain('fill="#00ff00"')
    expect(markup).toContain('width="32"')
  })
})

describe('selectAllGlobalIcons and extractIconsFromState', () => {
  it('extracts all icons from across the entire state tree', () => {
    const mockState = {
      data: {
        appBar: {
          data: {
            page1: { icon: 'md/MdMap' },
            page2: { icon: 'md/MdDashboard' },
          },
        },
        panes: {
          data: {
            pane1: { icon: 'md/MdSettings' },
          },
        },
        maps: {
          data: {
            map1: {
              legendGroups: {
                lg1: {
                  data: {
                    nodeTypeA: { icon: 'md/MdHome' },
                    nodeTypeB: { icon: 'md/MdWork' },
                  },
                },
              },
            },
          },
          additionalMapStyles: {
            style1: { icon: 'md/MdBrush' },
          },
        },
      },
    }
    const extracted = extractIconsFromState(mockState.data)
    expect(extracted).toContain('md/MdMap')
    expect(extracted).toContain('md/MdDashboard')
    expect(extracted).toContain('md/MdSettings')
    expect(extracted).toContain('md/MdHome')
    expect(extracted).toContain('md/MdWork')
    expect(extracted).toContain('md/MdBrush')

    const globalIcons = selectAllGlobalIcons(mockState)
    expect(globalIcons).toEqual(expect.arrayContaining(extracted))

    const globalNodeIcons = selectAllGlobalNodeIcons(mockState)
    expect(globalNodeIcons).toEqual(globalIcons)
  })

  it('updates extracted icons dynamically when redux state changes without reload', () => {
    const initialState = {
      data: {
        maps: {
          data: {
            map1: {
              legendGroups: {
                lg1: {
                  data: {
                    nodeA: { icon: 'fa/FaCar' },
                  },
                },
              },
            },
          },
        },
      },
    }
    const icons1 = selectAllGlobalIcons(initialState)
    expect(icons1).toEqual(['fa/FaCar'])

    // Mutate state with new map and features
    const updatedState = {
      data: {
        maps: {
          data: {
            map2: {
              legendGroups: {
                lg2: {
                  data: {
                    nodeB: { icon: 'fa/FaTruck' },
                    nodeC: { icon: 'fa/FaBicycle' },
                  },
                },
              },
            },
          },
        },
      },
    }
    const icons2 = selectAllGlobalIcons(updatedState)
    expect(icons2).toContain('fa/FaTruck')
    expect(icons2).toContain('fa/FaBicycle')
    expect(icons2).not.toContain('fa/FaCar')
  })
})
