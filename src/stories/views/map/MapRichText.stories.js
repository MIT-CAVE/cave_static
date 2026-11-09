import { configureStore } from '@reduxjs/toolkit'
import { useEffect, useState } from 'react'
import { Provider, useSelector } from 'react-redux'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import dataReducer, { overwriteData } from '../../../data/data'
import localReducer from '../../../data/local'
import { openMapModal } from '../../../data/local/mapSlice'
import { selectNodeClustersAtZoomFunc } from '../../../data/selectors'
import utilitiesReducer from '../../../data/utilities'
import ClusterModal from '../../../ui/compound/ClusterModal'
import MapNameDraggable from '../../../ui/draggables/MapNameDraggable'
import { AppModal } from '../../../ui/views/common/Modal'
import CompactLegend from '../../../ui/views/map/CompactLegend'
import FullLegend from '../../../ui/views/map/FullLegend'
import MapModal from '../../../ui/views/map/MapModal'
import { MapContext } from '../../../ui/views/map/useMapApi'

import { combineReducers, getChartItemColor } from '../../../utils'

const mapRichTextStories = {
  title: 'Views/Map/RichText',
}

export default mapRichTextStories

const MAP_ID = 'exampleMap'

// The `richText` cascade of the map: prop > feature type (or map) > the app
// default (`settings.defaults.richText`)
const buildData = ({
  defaults,
  map = {},
  group = {},
  type = {},
  capacity = {},
  colorBy = 'capacity',
  legend = {},
  panes,
} = {}) => ({
  settings: {
    iconUrl: 'https://react-icons.mitcave.com/5.4.0',
    ...(defaults && { defaults }),
  },
  ...(panes && { panes }),
  maps: {
    data: {
      [MAP_ID]: {
        name: '**Rich** map',
        optionalViewports: {
          north: {
            name: '**North** view',
            longitude: -75,
            latitude: 45,
            zoom: 4,
          },
        },
        legendGroups: {
          group: {
            name: 'Group _one_',
            ...group,
            data: {
              warehouses: {
                value: true,
                colorBy,
                colorByOptions: ['capacity', 'kind'],
                sizeBy: 'capacity',
                sizeByOptions: ['capacity'],
                ...legend,
              },
            },
          },
        },
        ...map,
      },
    },
  },
  mapFeatures: {
    data: {
      warehouses: {
        type: 'node',
        name: '**Warehouses**',
        ...type,
        props: {
          capacity: {
            name: '**Capacity**',
            type: 'num',
            unit: '$m^2$',
            gradient: {
              data: [
                {
                  value: 'min',
                  color: '#2196f3',
                  size: '8px',
                  label: '**Low**',
                },
                { value: 'max', color: '#f44336', size: '20px' },
              ],
            },
            ...capacity,
          },
          kind: {
            name: '_Kind_',
            type: 'selector',
            // The first option has no color, so it is generated from its name
            options: {
              alpha: { name: '**Alpha**' },
              beta: { color: '#4caf50' },
            },
          },
        },
        data: {
          // Close nodes, so they are grouped in a cluster
          location: { latitude: [[40], [40.05]], longitude: [[-75], [-75.05]] },
          valueLists: { capacity: [10, 20], kind: ['alpha', 'beta'] },
        },
      },
    },
  },
})

const createStore = () =>
  configureStore({
    reducer: combineReducers({
      data: dataReducer,
      local: localReducer,
      utilities: utilitiesReducer,
    }),
  })

const MapStage = ({ data, setup, children }) => {
  const [store] = useState(createStore)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    store.dispatch(
      overwriteData({
        data,
        versions: Object.fromEntries(Object.keys(data).map((key) => [key, 1])),
      })
    )
    setup?.(store)
    setReady(true)
  }, [data, setup, store])
  if (!ready) return null
  return (
    <Provider store={store}>
      <MapContext.Provider
        value={{ mapId: MAP_ID, mapLoaded: true, mapRef: { current: null } }}
      >
        {children}
      </MapContext.Provider>
    </Provider>
  )
}

const renderStage = (data, children, setup) => () => (
  <MapStage {...{ data, setup }}>{children}</MapStage>
)

const both = (
  <>
    <FullLegend />
    <CompactLegend />
  </>
)

// Labels are rendered twice by `OverflowText` (the marquee and the text), so
// every tag of a label is checked
const expectAll = async (canvas, text, tagName) => {
  const elements = await canvas.findAllByText(text)
  await expect(elements.length).toBeGreaterThan(0)
  for (const element of elements) await expect(element.tagName).toBe(tagName)
}

const waitForLegend = (canvas) =>
  waitFor(() =>
    expect(canvas.getAllByText(/Warehouses/).length).toBeGreaterThan(0)
  )

export const TypeNameIsPlainByDefault = {
  render: renderStage(buildData(), both),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitForLegend(canvas)
    await expect(canvasElement.querySelector('strong')).toBeNull()
    await expect(canvas.getAllByText('**Warehouses**').length).toBeGreaterThan(
      0
    )
  },
}

export const TypeNameIsRich = {
  render: renderStage(buildData({ type: { richText: true } }), both),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectAll(canvas, 'Warehouses', 'STRONG')
  },
}

export const GlobalDefaultMakesTheLegendRich = {
  render: renderStage(buildData({ defaults: { richText: true } }), both),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectAll(canvas, 'Warehouses', 'STRONG')
    await expectAll(canvas, 'one', 'EM')
  },
}

export const TypeOverridesTheGlobalDefault = {
  render: renderStage(
    buildData({ defaults: { richText: true }, type: { richText: false } }),
    both
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getAllByText('**Warehouses**').length).toBeGreaterThan(0)
    )
  },
}

export const LegendGroupNameUsesTheMapFlag = {
  render: renderStage(buildData({ map: { richText: true } }), both),
  play: async ({ canvasElement }) => {
    await expectAll(within(canvasElement), 'one', 'EM')
  },
}

// The legend contents inherit the feature type (and the prop can override it)
export const LegendContentsAreRich = {
  render: renderStage(buildData({ type: { richText: true } }), <FullLegend />),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The name of the prop in the select, the unit and the label of the gradient
    await expectAll(canvas, 'Capacity', 'STRONG')
    await waitFor(() =>
      expect(canvasElement.querySelector('.katex')).not.toBeNull()
    )
    await expectAll(canvas, 'Low', 'STRONG')
    // The other end of the gradient has no label, so it is a plain number
    await expect(canvas.getAllByText(/^20/).length).toBeGreaterThan(0)
  },
}

export const PropOverridesTheFeatureType = {
  render: renderStage(
    buildData({
      type: { richText: true },
      capacity: { richText: false },
    }),
    <FullLegend />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getAllByText('**Capacity**').length).toBeGreaterThan(0)
    )
    await expect(canvasElement.querySelector('.katex')).toBeNull()
    await expect(canvas.getAllByText('$m^2$').length).toBeGreaterThan(0)
  },
}

const normalizeColor = (color) => {
  const probe = document.createElement('span')
  probe.style.color = color
  document.body.appendChild(probe)
  const normalized = getComputedStyle(probe).color
  probe.remove()
  return normalized
}

const getBackground = (element) => {
  for (let el = element; el; el = el.parentElement) {
    const color = getComputedStyle(el).backgroundColor
    if (color !== 'rgba(0, 0, 0, 0)') return color
  }
  return null
}

export const CategoriesAreRichAndKeepTheirRawColor = {
  render: renderStage(
    buildData({ type: { richText: true }, colorBy: 'kind' }),
    <FullLegend />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The name set in the data is rich, the generated name (`Beta`) is not
    await expectAll(canvas, 'Alpha', 'STRONG')
    for (const beta of canvas.getAllByText('Beta')) {
      await expect(beta.tagName).not.toBe('STRONG')
    }
    // The generated color is seeded with the raw name, never the plain text
    const alpha = canvas.getAllByText('Alpha')[0]
    await expect(getBackground(alpha)).toBe(
      normalizeColor(getChartItemColor('**Alpha**'))
    )
  },
}

export const MapNameIsRichButEditedRaw = {
  render: renderStage(
    buildData({ map: { richText: true } }),
    <MapNameDraggable mapId={MAP_ID} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const name = await canvas.findByText('Rich')
    await expect(name.tagName).toBe('STRONG')
    // Editing shows (and saves) the raw name
    await userEvent.click(name)
    const input = await canvas.findByRole('textbox')
    await expect(input).toHaveValue('**Rich** map')
  },
}

export const MapModalNamesAreRich = {
  render: renderStage(
    buildData({ map: { richText: true } }),
    <MapModal />,
    (store) =>
      store.dispatch(
        openMapModal({ feature: 'viewports', mapId: MAP_ID, sync: false })
      )
  ),
  play: async ({ canvasElement }) => {
    const north = await within(canvasElement).findByText('North')
    await expect(north.tagName).toBe('STRONG')
  },
}

export const FeatureModalTitleAndPropsAreRich = {
  render: renderStage(
    buildData({
      panes: {
        paneState: {
          center: {
            type: 'feature',
            open: {
              key: JSON.stringify(['warehouses', 0]),
              feature: 'nodes',
              type: '**Warehouses**',
              mapId: MAP_ID,
              richText: true,
              props: {
                size: { type: 'text', name: '_Size_ label', value: '' },
              },
            },
          },
        },
      },
    }),
    <AppModal />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The title, and the label of the props
    await expectAll(canvas, 'Warehouses', 'STRONG')
    await expectAll(canvas, 'Size', 'EM')
  },
}

// The cluster modal finds its cluster with the id of the feature type, and
// shows the name of the type (rich if the type is) in the title
const FirstCluster = () => {
  const getClusters = useSelector(selectNodeClustersAtZoomFunc)
  // The data is not in the store yet on the first render
  const cluster = getClusters(MAP_ID).data?.find((f) => f.properties.cluster)
  if (!cluster) return <div>There is no cluster</div>
  return (
    <ClusterModal
      title={cluster.properties.type}
      cluster_id={cluster.properties.cluster_id}
      mapId={MAP_ID}
    />
  )
}

// Clusters are computed for the current zoom of the map
const clusterData = (type) =>
  buildData({
    type,
    legend: { group: true },
    map: {
      defaultViewport: {
        longitude: -75,
        latitude: 40,
        zoom: 3,
        pitch: 0,
        bearing: 0,
      },
    },
  })

export const ClusterTitleShowsTheTypeName = {
  render: renderStage(clusterData({}), <FirstCluster />),
  play: async ({ canvasElement }) => {
    const heading = await within(canvasElement).findByRole('heading', {
      name: /Grouped/,
    })
    // The name of the type is shown (as it is written) and not its id
    await expect(heading).toHaveTextContent('Grouped **Warehouses**')
    await expect(heading.querySelector('strong')).toBeNull()
  },
}

export const ClusterTitleAndHeadersAreRich = {
  render: renderStage(clusterData({ richText: true }), <FirstCluster />),
  play: async ({ canvasElement }) => {
    const heading = await within(canvasElement).findByRole('heading', {
      name: /Grouped/,
    })
    await expect(heading).toHaveTextContent('Grouped Warehouses')
    await expect(heading.querySelector('strong')?.textContent).toBe(
      'Warehouses'
    )
    // The headers of the table are the names of the props
    await expectAll(within(canvasElement), 'Capacity', 'STRONG')
  },
}

// The nodes take the name of their feature type, so their rows are rich too
export const ClusterRowNamesAreRich = {
  render: renderStage(clusterData({ richText: true }), <FirstCluster />),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('heading', { name: /Grouped/ })
    const cells = await waitFor(() => {
      const found = canvasElement.querySelectorAll('tbody td strong')
      expect(found.length).toBeGreaterThan(0)
      return found
    })
    for (const cell of cells) await expect(cell.textContent).toBe('Warehouses')
  },
}

export const ClusterRowNamesArePlainByDefault = {
  render: renderStage(clusterData({}), <FirstCluster />),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('heading', { name: /Grouped/ })
    await waitFor(() =>
      expect(
        within(canvasElement).getAllByText('**Warehouses**').length
      ).toBeGreaterThan(1)
    )
    await expect(canvasElement.querySelector('tbody td strong')).toBeNull()
  },
}
