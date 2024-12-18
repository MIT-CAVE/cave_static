import { chartVariant } from './enums'

export const DEFAULT_LOCALE = 'en-US'

export const DEFAULT_ICON_URL = 'https://react-icons.mitcave.com/5.4.0'

export const APP_BAR_WIDTH = 70
export const PANE_WIDTH = 450

export const GLOBALOUTPUT_WIDTH = 400
export const PROP_MIN_WIDTH = 200

export const MIN_ZOOM = 2.46
export const MAX_ZOOM = 22

export const MIN_PITCH = 0
export const MAX_PITCH = 60

export const MIN_BEARING = -180
export const MAX_BEARING = 180

export const ICON_RESOLUTION = 50

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

export const DEFAULT_MAP_STYLES = {
  mapboxDark: {
    name: 'Mapbox Dark',
    icon: 'si/SiMapbox',
    // Full spec (via Mapbox's guest token) available at:
    // https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA#11/40.73/-74
    spec: 'mapbox://styles/mapbox/dark-v11',
  },
  mapboxLight: {
    name: 'Mapbox Light',
    icon: 'si/SiMapbox',
    spec: 'mapbox://styles/mapbox/light-v11',
  },
  mapboxStreets: {
    name: 'Mapbox Streets',
    icon: 'si/SiMapbox',
    spec: 'mapbox://styles/mapbox/streets-v12',
  },
  mapboxSatellite: {
    name: 'Mapbox Satellite',
    icon: 'si/SiMapbox',
    spec: 'mapbox://styles/mapbox/satellite-streets-v12',
  },
  mapboxNavDay: {
    name: 'Mapbox Navigation Day',
    icon: 'si/SiMapbox',
    spec: 'mapbox://styles/mapbox/navigation-day-v1',
  },
  mapboxNavNight: {
    name: 'Mapbox Navigation Night',
    icon: 'si/SiMapbox',
    spec: 'mapbox://styles/mapbox/navigation-night-v1',
  },
  cartoDarkMatter: {
    name: 'Carto Dark',
    icon: 'md/MdDarkMode',
    spec: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    fog: DARK_GLOBE_FOG,
  },
  cartoPositron: {
    name: 'Carto Light',
    icon: 'md/MdLightMode',
    spec: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    fog: LIGHT_GLOBE_FOG,
  },
  openStreetMap: {
    name: 'Open Street Maps',
    icon: 'md/MdMap',
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

export const LINE_TYPES = { solid: [1, 0], dashed: [7, 3], dotted: [2, 2] }

export const CHART_PALETTE = [
  '#4992ff',
  '#7cffb2',
  '#fddd60',
  '#ff6e76',
  '#58d9f9',
  '#05c091',
  '#ff8a45',
  '#8d48e3',
  '#dd79ff',
]

export const CHART_DEFAULTS = {
  chartType: chartVariant.BAR,
}

export const NUMBER_FORMAT_KEY_PATHS = [
  'locale',
  'precision',
  'notation',
  'notationDisplay',
  'trailingZeros',
  'unit',
  'unitPlacement',
  'fallbackValue',
  ['gradient', 'precision'],
  ['gradient', 'notation'],
  ['gradient', 'notationDisplay'],
]
