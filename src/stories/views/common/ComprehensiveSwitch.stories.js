import { configureStore } from '@reduxjs/toolkit'
import React, { useState, useEffect } from 'react'
import { Provider } from 'react-redux'
import { userEvent, within, expect } from 'storybook/test'

import dataReducer, { overwriteData } from '../../../data/data'
import localReducer from '../../../data/local'
import utilitiesReducer from '../../../data/utilities'

import App from '../../../App'
import { combineReducers } from '../../../utils'

const comprehensiveDataset = {
  settings: {
    demo: {
      map1: {
        scrollSpeed: 0.1,
      },
      dash1: {
        displayTime: 30,
      },
    },
    sync: {
      panes: {
        name: 'Open Pane',
        showToggle: true,
        value: true,
        data: {
          ab1: ['panes', 'paneState', 'left'],
          ab2: ['panes', 'paneState', 'right'],
        },
      },
      pageSelection: {
        name: 'Page Selection',
        showToggle: true,
        value: false,
        data: { ps1: ['pages', 'currentPage'] },
      },
      mapLayers: {
        name: 'Map Layers',
        showToggle: true,
        value: true,
        data: { ml1: ['maps', 'data', 'map1', 'legendGroups'] },
      },
      chartColors: {
        name: 'Chart Colors',
        showToggle: true,
        value: true,
        data: {
          go1: ['groupedOutputs', 'groupings'],
        },
      },
      modals: {
        name: 'Open Modal',
        showToggle: true,
        value: true,
        data: { pn1: ['panes', 'paneState', 'center'] },
      },
      draggables: {
        name: 'Draggables',
        showToggle: true,
        value: true,
        data: {
          dr1: ['draggables', 'data'],
        },
      },
      pages: {
        name: 'Dashboards',
        showToggle: true,
        value: true,
        data: { db1: ['pages', 'data'] },
      },
    },
    iconUrl: 'https://react-icons.mitcave.com/5.4.0',
    order: {
      sync: ['panes', 'modals', 'pageSelection', 'mapLayers', 'pages'],
    },
    time: {
      timeLength: 3,
      timeUnits: 'Century',
      looping: false,
      speed: 1,
    },
    defaults: {
      precision: 4,
      trailingZeros: true,
      unitPlacement: 'afterWithSpace',
    },
  },
  draggables: {
    data: {
      session: {
        open: true,
        position: {
          x: 8,
          y: 8,
        },
      },
      globalOutputs: {
        open: true,
        position: {
          x: 8,
          y: 68,
        },
      },
      mapNames: {
        open: true,
        hideCloseOption: true,
        hideDragOption: true,
        position: {
          x: 8,
          y: 8,
        },
      },
      time: {
        showDragHandle: true,
      },
    },
  },
  appBar: {
    order: {
      data: [
        'buttonSolve',
        'examplePropsPane',
        'buttonExport',
        'dash1',
        'dash2',
        'dash3',
      ],
    },
    data: {
      buttonSolve: {
        icon: 'bs/BsLightningFill',
        color: 'rgb(178 179 55)',
        apiCommand: 'solve',
        type: 'button',
        bar: 'upperLeft',
      },
      examplePropsPane: {
        icon: 'fa/FaCogs',
        type: 'pane',
        bar: 'upperLeft',
        variant: 'wall',
      },
      buttonExport: {
        icon: 'md/MdFileDownload',
        apiCommand: 'exportData',
        type: 'button',
        bar: 'upperLeft',
      },
      dash1: {
        type: 'page',
        icon: 'md/MdInsertChart',
        bar: 'lowerLeft',
      },
      dash2: {
        type: 'page',
        icon: 'md/MdInsertChartOutlined',
        bar: 'lowerLeft',
      },
      dash3: {
        type: 'page',
        icon: 'fa/FaChartArea',
        bar: 'lowerLeft',
      },
      exampleModal: {
        icon: 'md/MdInfo',
        color: 'rgb(195 164 222)',
        type: 'pane',
        bar: 'upperRight',
        variant: 'modal',
      },
    },
  },
  panes: {
    paneState: { left: {}, right: {}, center: {} },
    data: {
      exampleModal: {
        name: 'Example Modal',
        props: {
          buttonViewInfo: {
            name: 'Info Button',
            type: 'button',
            apiCommand: 'viewInfo',
            help: 'Press this button to view info',
          },
        },
        values: {
          buttonViewInfo: 'Press',
        },
        layout: {
          type: 'grid',
          numColumns: 1,
          numRows: 1,
          data: {
            col1Row1: {
              type: 'item',
              column: 1,
              row: 1,
              itemId: 'buttonViewInfo',
            },
          },
        },
      },
      examplePropsPane: {
        name: 'Example Props Pane',
        props: {
          numericHeader: {
            name: 'Numeric Props',
            type: 'head',
            help: 'Some help for numeric props',
          },
          numericInputExample: {
            name: 'Numeric Input Example',
            type: 'num',
            help: 'Help for the numeric input example',
            maxValue: 100,
            minValue: 0,
            notation: 'scientific',
            notationDisplay: 'x10^+',
            precision: 0,
            unit: 'units',
          },
          toggleHeader: {
            name: 'Toggle Props',
            type: 'head',
            help: 'Some help for toggle props',
          },
          toggleSwitchExample: {
            name: 'Toggle Switch Example',
            type: 'toggle',
            variant: 'switch',
            label: 'The switch is off',
            activeLabel: 'The switch is on',
            help: 'Help for the toggle switch example',
          },
        },
        values: {
          numericInputExample: 50,
          toggleSwitchExample: true,
        },
        layout: {
          type: 'grid',
          numColumns: 2,
          numRows: 'auto',
          data: {
            col1Row1: {
              type: 'item',
              column: 1,
              row: 1,
              itemId: 'numericHeader',
            },
            col1Row2: {
              type: 'item',
              column: 1,
              row: 2,
              itemId: 'numericInputExample',
            },
            col2Row1: {
              type: 'item',
              column: 2,
              row: 1,
              itemId: 'toggleHeader',
            },
            col2Row2: {
              type: 'item',
              column: 2,
              row: 2,
              itemId: 'toggleSwitchExample',
            },
          },
        },
      },
    },
  },
  pages: {
    currentPage: 'dash2',
    data: {
      dash1: {
        charts: {
          allBar: {
            dataset: 'locationGroup',
            chartType: 'bar',
            stats: [
              {
                statId: 'numericStatExampleB',
                aggregationType: 'mean',
              },
            ],
            groupingId: [],
            groupingLevel: [],
            showNA: true,
          },
          map1: {
            type: 'map',
            mapId: 'map1',
            maximized: true,
          },
          statBar: {
            dataset: 'locationGroup',
            chartType: 'bar',
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'sum',
              },
            ],
            groupingId: [],
            groupingLevel: [],
          },
        },
        pageLayout: ['allBar', 'map1', null, 'statBar'],
        lockedLayout: false,
      },
      dash2: {
        charts: {
          allBar: {
            dataset: 'locationGroup',
            chartType: 'bar',
            stats: [
              {
                statId: 'numericStatExampleB',
                aggregationType: 'mean',
              },
            ],
            groupingId: [],
            groupingLevel: [],
            showNA: true,
          },
          mixed: {
            type: 'groupedOutput',
            dataset: 'locationGroup',
            chartType: 'mixed',
            groupingId: ['location'],
            groupingLevel: ['state'],
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'sum',
              },
              {
                statId: 'numericStatExampleB',
                aggregationType: 'sum',
              },
            ],
            chartOptions: {
              leftChartType: 'bar',
              rightChartType: 'cumulative_line',
            },
          },
          boxPlot: {
            dataset: 'locationGroup',
            chartType: 'box_plot',
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'mean',
              },
            ],
            groupingId: ['sku'],
            groupingLevel: ['size'],
            showNA: true,
          },
          cumulativeLine: {
            dataset: 'locationGroup',
            chartType: 'cumulative_line',
            stats: [
              {
                statId: 'numericStatExampleB',
                aggregationType: 'sum',
              },
            ],
            groupingId: ['location', 'sku'],
            groupingLevel: ['state', 'sku'],
            defaultToZero: true,
          },
        },
        pageLayout: ['allBar', 'mixed', 'boxPlot', 'cumulativeLine'],
        lockedLayout: false,
      },
      dash3: {
        charts: {
          chart1: {
            type: 'groupedOutput',
            dataset: 'locationGroup',
            chartType: 'mixed',
            groupingId: ['sku', 'location'],
            groupingLevel: ['size', 'state'],
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'sum',
              },
              {
                statId: 'numericStatExampleB',
                aggregationType: 'sum',
              },
            ],
            chartOptions: {
              leftChartType: 'bar',
              rightChartType: 'cumulative_line',
            },
          },
          chart2: {
            type: 'groupedOutput',
            dataset: 'locationGroup',
            chartType: 'table',
            groupingId: ['sku'],
            groupingLevel: ['size'],
            stats: [
              {
                statId: 'numericStatExampleA',
                aggregationType: 'divisor',
                statIdDivisor: 'numericStatExampleB',
              },
              {
                statId: 'numericStatExampleB',
                aggregationType: 'sum',
              },
            ],
          },
        },
        pageLayout: ['chart1', 'chart2', null, null],
      },
    },
  },
  maps: {
    order: {
      additionalMapStyles: ['smoothLight', 'smoothDark'],
    },
    additionalMapStyles: {
      smoothLight: {
        name: 'Smooth Light',
        icon: 'fi/FiSun',
        spec: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
      },
      smoothDark: {
        name: 'Smooth Dark',
        icon: 'fi/FiMoon',
        spec: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
      },
    },
    data: {
      map1: {
        order: {
          optionalViewports: ['ov0', 'ov1'],
          legendGroups: ['lga', 'lgb'],
        },
        name: 'Example Map 1',
        defaultViewport: {
          longitude: -75.447,
          latitude: 40.345,
          zoom: 4.66,
          pitch: 0,
          bearing: 0,
          maxZoom: 12,
          minZoom: 2,
        },
        optionalViewports: {
          ov0: {
            icon: 'fa/FaGlobeAsia',
            name: 'Asia',
            zoom: 4,
            pitch: 0,
            bearing: 0,
            maxZoom: 12,
            minZoom: 2,
            latitude: 30,
            longitude: 121,
          },
          ov1: {
            icon: 'fa/FaGlobeEurope',
            name: 'EMEA',
            zoom: 4,
            pitch: 0,
            bearing: 0,
            maxZoom: 12,
            minZoom: 2,
            latitude: 47,
            longitude: 14,
          },
        },
        legendGroups: {
          lga: {
            name: 'Legend Group A',
            data: {
              nodeTypeA: {
                value: true,
                colorBy: 'booleanPropExample',
                sizeBy: 'numericPropExampleA',
                allowGrouping: true,
                group: false,
                groupCalcBySize: 'sum',
                groupCalcByColor: 'mode',
                icon: 'fa6/FaIgloo',
                colorByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                  'selectorPropExample',
                ],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                  'selectorPropExample',
                ],
              },
              T1: {
                colorBy: 'numericPropExampleB',
                sizeBy: 'numericPropExampleA',
                value: true,
                colorByOptions: ['numericPropExampleA', 'numericPropExampleB'],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
              },
            },
          },
          lgb: {
            name: 'Legend Group B',
            data: {
              nodeTypeB: {
                value: true,
                colorBy: 'numericPropExampleB',
                sizeBy: 'numericPropExampleA',
                allowGrouping: true,
                group: true,
                groupCalcBySize: 'count',
                groupCalcByColor: 'and',
                icon: 'bs/BsBuilding',
                colorByOptions: ['numericPropExampleA', 'numericPropExampleB'],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'booleanPropExample',
                ],
              },
              T2: {
                colorBy: 'selectorPropExample',
                sizeBy: 'numericPropExampleB',
                value: true,
                lineStyle: 'dotted',
                colorByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
                sizeByOptions: [
                  'numericPropExampleA',
                  'numericPropExampleB',
                  'selectorPropExample',
                ],
              },
              state: {
                value: true,
                colorBy: 'numericPropExampleC',
                icon: 'bs/BsHexagon',
                colorByOptions: ['numericPropExampleC', 'booleanPropExample'],
              },
              country: {
                value: false,
                colorBy: 'numericPropExampleC',
                icon: 'pi/PiMountains',
                colorByOptions: ['numericPropExampleC'],
              },
              customGeoJson: {
                value: false,
                colorBy: 'numericPropExampleC',
                icon: 'tb/TbLassoPolygon',
                colorByOptions: ['numericPropExampleC', 'booleanPropExample'],
              },
            },
          },
        },
      },
    },
  },
  mapFeatures: {
    data: {
      T1: {
        type: 'arc',
        name: 'Flow Type 1',
        geoJson: {
          geoJsonLayer:
            'https://raw.githubusercontent.com/MIT-CAVE/cave_app_extras/main/example_data/example.geojson',
          geoJsonProp: 'arc_id',
        },
        props: {
          numericPropExampleA: {
            name: 'Numeric Prop Example A',
            type: 'num',
            unit: 'A units',
            gradient: {
              scale: 'linear',
              notation: 'compact',
              data: [
                {
                  value: 'min',
                  color: 'rgb(233 0 0)',
                  size: '15px',
                  label: 'Small',
                },
                {
                  value: 'max',
                  color: 'rgb(96 2 2)',
                  size: '30px',
                },
              ],
            },
            help: 'Help for numeric prop example A',
          },
        },
        data: {
          location: {
            geoJsonValue: ['toronto-pittsburgh-indianapolis'],
          },
          valueLists: {
            numericPropExampleA: [15],
          },
        },
      },
      nodeTypeA: {
        type: 'node',
        name: 'Node Type A',
        props: {
          numericPropExampleA: {
            name: 'Numeric Prop Example A',
            type: 'num',
            unit: 'A units',
            gradient: {
              notation: 'precision',
              precision: 5,
              data: [
                {
                  value: 0,
                  color: 'rgb(233 0 0)',
                  size: '30px',
                },
                {
                  value: 80,
                  color: 'rgb(96 2 2)',
                  size: '45px',
                },
              ],
            },
            help: 'Help for numeric prop example A',
          },
        },
        data: {
          location: {
            latitude: [[43.78], [39.82]],
            longitude: [[-79.63], [-86.18]],
          },
          valueLists: {
            numericPropExampleA: [100, 80],
          },
        },
      },
    },
  },
  groupedOutputs: {
    order: {
      groupings: ['location', 'sku'],
    },
    groupings: {
      location: {
        order: {
          levels: ['region', 'country', 'state'],
        },
        data: {
          id: ['locUsMi', 'locUsMa', 'locUsFl', 'locUsIn', 'locCaOn'],
          region: [
            'North America',
            'North America',
            'North America',
            'North America',
            'North America',
          ],
          country: ['USA', 'USA', 'USA', 'USA', 'Canada'],
          state: ['Michigan', 'Massachusetts', 'Florida', 'Indiana', 'Ontario'],
        },
        name: 'Locations',
        levels: {
          region: {
            name: 'Regions',
            coloring: { 'North America': 'rgb(255 255 255)' },
          },
          country: {
            name: 'Countries',
            ordering: ['Canada', 'USA'],
            parent: 'region',
            coloring: {
              Canada: 'rgb(0 0 255)',
              USA: 'rgb(255 0 0)',
            },
          },
          state: {
            name: 'States',
            parent: 'country',
            ordering: [
              'Michigan',
              'Florida',
              'Indiana',
              'Massachusetts',
              'Ontario',
            ],
            orderWithParent: false,
          },
        },
        layoutDirection: 'horizontal',
        grouping: 'Solo',
      },
      sku: {
        order: {
          levels: ['type', 'size', 'sku'],
        },
        data: {
          id: ['SKU1', 'SKU2'],
          type: ['Type A', 'Type A'],
          size: ['Size A', 'Size B'],
          sku: ['SKU1', 'SKU2'],
        },
        name: 'SKUs',
        levels: {
          type: {
            name: 'Types',
          },
          size: {
            name: 'Sizing',
            ordering: ['Size B', 'Size A'],
          },
          sku: {
            name: 'SKU',
          },
        },
        layoutDirection: 'horizontal',
      },
    },
    data: {
      locationGroup: {
        order: {
          stats: ['numericStatExampleA', 'numericStatExampleB'],
        },
        stats: {
          numericStatExampleA: {
            name: 'Stat Example A',
            unit: 'units',
          },
          numericStatExampleB: {
            name: 'Stat Example B',
            unit: 'units',
          },
        },
        valueLists: {
          numericStatExampleA: [5, 4, 6, -3, -3, 1],
          numericStatExampleB: [10, 5, 7, 5, -2, -1],
        },
        groupLists: {
          location: [
            'locCaOn',
            'locCaOn',
            'locUsMi',
            'locUsMi',
            'locUsIn',
            'locUsFl',
          ],
          sku: ['SKU1', 'SKU2', 'SKU1', 'SKU2', 'SKU2', 'SKU2'],
        },
      },
    },
  },
  globalOutputs: {
    props: {
      kpiHeader1: {
        type: 'head',
        name: 'Example KPI Header 1',
        icon: 'bs/BsInboxes',
        variant: 'icon',
      },
      key1: {
        name: 'KPI Example 1',
        icon: 'bs/BsFillEmojiFrownFill',
        precision: 0,
        unit: 'frowns',
        type: 'num',
        variant: 'icon',
        draggable: true,
      },
    },
    values: {
      key1: 18,
    },
    layout: {
      type: 'grid',
      numColumns: 'auto',
      numRows: 'auto',
      data: {
        col1Row1: {
          type: 'item',
          itemId: 'kpiHeader1',
          column: 1,
          row: 1,
        },
        col1Row2: {
          type: 'item',
          itemId: 'key1',
          column: 1,
          row: 2,
        },
      },
    },
  },
  extraKwargs: {
    wipeExisting: true,
  },
}

const basicDataset = {
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

const ComprehensiveDatasetSwitcher = () => {
  const [activeDataset, setActiveDataset] = useState(1)
  const [storeInstance] = useState(createTestStore)

  useEffect(() => {
    storeInstance.dispatch(
      overwriteData({
        data: activeDataset === 1 ? comprehensiveDataset : basicDataset,
        versions:
          activeDataset === 1
            ? {
                settings: 1,
                draggables: 1,
                appBar: 1,
                panes: 1,
                pages: 1,
                maps: 1,
                mapFeatures: 1,
                groupedOutputs: 1,
                globalOutputs: 1,
              }
            : { settings: 2, appBar: 2 },
      })
    )
  }, [activeDataset, storeInstance])

  return (
    <Provider store={storeInstance}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <button
          id="comprehensive-switch-btn"
          data-testid="comprehensive-switch-btn"
          style={{
            position: 'fixed',
            zIndex: 9999,
            top: 10,
            right: 10,
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={() => setActiveDataset((d) => (d === 1 ? 2 : 1))}
        >
          Toggle to{' '}
          {activeDataset === 1 ? 'Basic Dataset' : 'Comprehensive Dataset'}
        </button>
        <App />
      </div>
    </Provider>
  )
}

const StoryMeta = {
  title: 'Views/Common/ComprehensiveSwitch',
  component: ComprehensiveDatasetSwitcher,
  parameters: {
    layout: 'fullscreen',
    layoutWidth: 'full',
  },
}

export default StoryMeta

export const SwitchComprehensiveInteraction = {
  render: () => <ComprehensiveDatasetSwitcher />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const btn = canvas.getByTestId('comprehensive-switch-btn')
    expect(btn).toBeDefined()

    // 1. Initial State: Comprehensive dataset is loaded
    expect(btn.textContent).toContain('Basic Dataset')

    // 2. Switch to Basic Dataset (minimal app bar buttons, no pages)
    await userEvent.click(btn)
    expect(btn.textContent).toContain('Comprehensive Dataset')

    // 3. Switch back to Comprehensive Dataset (properly re-renders dash2, map, charts)
    await userEvent.click(btn)
    expect(btn.textContent).toContain('Basic Dataset')

    // 4. Switch to Basic Dataset again
    await userEvent.click(btn)
    expect(btn.textContent).toContain('Comprehensive Dataset')

    // 5. Switch back to Comprehensive Dataset again
    await userEvent.click(btn)
    expect(btn.textContent).toContain('Basic Dataset')
  },
}
