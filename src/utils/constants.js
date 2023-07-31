export const DEFAULT_LOCALE = 'en-US'

export const DEFAULT_ICON_URL = 'https://react-icons.mitcave.com/0.0.1'

export const APP_BAR_WIDTH = 70
export const PANE_WIDTH = 450
export const PROP_WIDTH = 300
export const KPI_WIDTH = 400

export const MIN_ZOOM = 2.46
export const MAX_ZOOM = 22

export const MIN_PITCH = 0
export const MAX_PITCH = 60

export const MIN_BEARING = -180
export const MAX_BEARING = 180

// Number of chart configurations stored in memory
// Higher values can increase dashboard switching performance
// At the cost of system memory (RAM)
export const MAX_MEMOIZED_CHARTS = 16

export const DEFAULT_VIEWPORT = {
  longitude: -71.08463,
  latitude: 42.36157,
  zoom: 13,
  pitch: 0,
  bearing: 0,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  minPitch: MIN_PITCH,
  maxPitch: MAX_PITCH,
  minBearing: MIN_BEARING,
  maxBearing: MAX_BEARING,
}

export const DARK_GLOBE_FOG = {
  range: [0.5, 10],
  color: '#ffffff',
  'high-color': '#245cdf',
  'space-color': [
    'interpolate',
    ['linear'],
    ['zoom'],
    3,
    '#010b19',
    6,
    '#367ab9',
  ],
  'horizon-blend': [
    'interpolate',
    ['exponential', 1.2],
    ['zoom'],
    5,
    0.02,
    7,
    0.08,
  ],
  'star-intensity': ['interpolate', ['linear'], ['zoom'], 5, 0.35, 6, 0],
}

export const LIGHT_GLOBE_FOG = {
  range: [2, 20],
  color: 'hsl(0, 0%, 100%)',
  'high-color': 'hsl(210, 100%, 80%)',
  'space-color': [
    'interpolate',
    ['exponential', 1.2],
    ['zoom'],
    2,
    'hsl(210, 40%, 30%)',
    4,
    'hsl(210, 100%, 80%)',
  ],
  'horizon-blend': [
    'interpolate',
    ['exponential', 1.2],
    ['zoom'],
    5,
    0.02,
    7,
    0.08,
  ],
  'star-intensity': [
    'interpolate',
    ['exponential', 1.2],
    ['zoom'],
    5,
    0.1,
    7,
    0,
  ],
}

export const DEFAULT_MAP_STYLE_KEY = '_default'

export const DEFAULT_MAP_STYLES = {
  [DEFAULT_MAP_STYLE_KEY]: {
    name: 'Default',
    icon: 'MdMap',
    order: -3,
  },
  dark_matter: {
    name: 'Dark',
    icon: 'MdDarkMode',
    order: -2,
    spec: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    fog: DARK_GLOBE_FOG,
  },
  positron: {
    name: 'Light',
    icon: 'MdLightMode',
    order: -1,
    spec: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    fog: LIGHT_GLOBE_FOG,
  },
  OSM: {
    name: 'OSM',
    icon: 'MdFreeBreakfast',
    order: -3,
    spec: {
      name: 'osm',
      version: 8,
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
      sources: {
        'osm-raster-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      },
      layers: [
        {
          id: 'osm-raster-layer',
          type: 'raster',
          source: 'osm-raster-tiles',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    },
    fog: LIGHT_GLOBE_FOG,
  },
}

export const LINE_TYPES = { solid: undefined, dashed: [7, 3], dotted: [2, 2] }

export const CHART_PALETTE = {
  dark: [
    '#4992ff',
    '#7cffb2',
    '#fddd60',
    '#ff6e76',
    '#58d9f9',
    '#05c091',
    '#ff8a45',
    '#8d48e3',
    '#dd79ff',
  ],
  light: [
    '#37A2DA',
    '#32C5E9',
    '#9FE6B8',
    '#FFDB5C',
    '#ff9f7f',
    '#fb7293',
    '#e7bcf3',
    '#8378EA',
    '#96BFFF',
  ],
}

export const HIGHLIGHT_COLOR = [0, 0, 128, 128]
