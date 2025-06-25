import { chartVariant } from './enums'

export const DEFAULT_LOCALE = 'en-US'

export const DEFAULT_ICON_URL = 'https://react-icons.mitcave.com/5.4.0'

export const APP_BAR_WIDTH = 70
export const PANE_WIDTH = 450

export const LEGEND_WIDE_WIDTH = 700
export const LEGEND_SLIM_WIDTH = 400

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

export const DARK_SKY_SPEC = {
  'sky-color': '#0a0a1a',
  'horizon-color': '#2a2a3a',
  'fog-color': '#000033',
  'sky-horizon-blend': 0.6,
  'horizon-fog-blend': 0.7,
  'fog-ground-blend': 0.4,
  'atmosphere-blend': [
    'interpolate',
    ['linear'],
    ['zoom'],
    0,
    0.2,
    10,
    0.8,
    12,
    0,
  ],
}

export const LIGHT_SKY_SPEC = {
  'sky-color': '#88c6fc',
  'horizon-color': '#e6f0fa',
  'fog-color': '#d4e7ff',
  'sky-horizon-blend': 0.85,
  'horizon-fog-blend': 0.9,
  'fog-ground-blend': 0.6,
  'atmosphere-blend': [
    'interpolate',
    ['linear'],
    ['zoom'],
    0,
    0.8,
    10,
    1,
    12,
    0.3,
  ],
}

export const DEFAULT_MAP_STYLE_OBJECTS = {
  mapboxDark: {
    name: 'Mapbox Dark',
    icon: 'si/SiMapbox',
    // Full spec (via a Mapbox's guest token) available at:
    // https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY2xxeTBib3pyMGsxcTJpbXQ3bmo4YXU0ZiJ9.wvqlBMQSxTHgvAh6l9OXXw
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
    fog: DARK_GLOBE_FOG,
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
  cartoPositron: {
    name: 'Carto Light',
    icon: 'md/MdLightMode',
    spec: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  cartoDarkMatter: {
    name: 'Carto Dark',
    icon: 'md/MdDarkMode',
    spec: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  openStreetMap: {
    name: 'Open Street Maps',
    icon: 'si/SiOpenstreetmap',
    light: true,
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
