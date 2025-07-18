export const layerId = {
  ARC_LAYER_SOLID: 'arcLayerSolid',
  ARC_LAYER_DASH: 'arcLayerDash',
  ARC_LAYER_DOT: 'arcLayerDot',
  MULTI_ARC_LAYER_SOLID: 'multiArcLayerSolid',
  MULTI_ARC_LAYER_DASH: 'multiArcLayerDash',
  MULTI_ARC_LAYER_DOT: 'multiArcLayerDot',
  GEOGRAPHY_LAYER: 'geographyLayer',
  NODE_ICON_LAYER: 'nodeIconLayer',
  INCLUDED_GEOGRAPHY_LAYER: 'includedGeographyLayer',
}

export const asyncStatus = {
  PENDING: 'pending',
  FAIL: 'fail',
  SUCCESS: 'success',
}

export const paneId = {
  SESSION: 'session',
  APP_SETTINGS: 'settings',
  OPTIONS: 'options',
}

export const draggableId = {
  TIME: 'time',
  SESSION: 'session',
  GLOBAL_OUTPUTS: 'globalOutputs',
}

export const propId = {
  MEDIA: 'media',
  BUTTON: 'button',
  TEXT: 'text',
  NUMBER: 'num',
  TOGGLE: 'toggle',
  SELECTOR: 'selector',
  DATE: 'date',
  HEAD: 'head',
  COORDINATE: 'coordinate',
}

export const propVariant = {
  BUTTON: 'button',
  SWITCH: 'switch',
  CHECKBOX: 'checkbox',
  COLUMN: 'column',
  DATE: 'date',
  DATETIME: 'datetime',
  COMBOBOX: 'combobox',
  COMBOBOX_MULTI: 'comboboxMulti',
  DROPDOWN: 'dropdown',
  FIELD: 'field',
  HCHECKBOX: 'hcheckbox',
  HRADIO: 'hradio',
  HSTEPPER: 'hstepper',
  INCSLIDER: 'incslider',
  LATLNG_INPUT: 'latLngInput',
  LATLNG_MAP: 'latLngMap',
  LATLNG_PATH: 'latLngPath',
  NESTED: 'nested',
  PICTURE: 'picture',
  RADIO: 'radio',
  ROW: 'row',
  SINGLE: 'single',
  SLIDER: 'slider',
  TEXT: 'text',
  TEXTAREA: 'textarea',
  TIME: 'time',
  VIDEO: 'video',
  VSTEPPER: 'vstepper',
  ICON: 'icon',
  ICON_ROW: 'iconRow',
  ICON_COMPACT: 'iconCompact',
  FILLED: 'filled',
  OUTLINED: 'outlined',
}

export const propContainer = {
  HORIZONTAL: 'horizontal',
  MINIMAL: 'minimal',
  NONE: 'none',
  UNTITLED: 'untitled',
  TITLED: 'titled',
  VERTICAL: 'vertical',
}

export const globalOutputId = {
  NUMBER: 'num',
  TEXT: 'text',
  HEAD: 'head',
}

export const globalOutputVariant = {
  ROW: 'row',
  COLUMN: 'column',
}

export const layoutType = {
  GRID: 'grid',
  ITEM: 'item',
}

export const statId = {
  COUNT: 'count',
  MAX: 'max',
  MEAN: 'mean',
  MEDIAN: 'median',
  MIN: 'min',
  MODE: 'mode',
  SUM: 'sum',
  AND: 'and',
  OR: 'or',
}

export const statFuncs = {
  [propId.NUMBER]: new Set([
    statId.COUNT,
    statId.MODE,
    statId.MAX,
    statId.MEAN,
    statId.MEDIAN,
    statId.MIN,
    statId.SUM,
  ]),
  [propId.SELECTOR]: new Set([statId.MODE]),
  [propId.TOGGLE]: new Set([statId.MODE, statId.AND, statId.OR]),
  [propId.TEXT]: new Set([statId.MODE]),
}

export const scaleId = {
  LINEAR: 'linear',
  STEP: 'step',
  LOG: 'log',
  POW: 'pow',
}

export const scaleParamId = {
  EXPONENT: 'exponent',
}

export const scaleParamsById = {
  [scaleId.POW]: scaleParamId.EXPONENT,
}

export const chartVariant = {
  BAR: 'bar',
  BOX_PLOT: 'box_plot',
  CUMULATIVE_LINE: 'cumulative_line',
  LINE: 'line',
  AREA: 'area',
  STACKED_AREA: 'stacked_area',
  STACKED_BAR: 'stacked_bar',
  STACKED_WATERFALL: 'stacked_waterfall',
  SUNBURST: 'sunburst',
  TABLE: 'table',
  TREEMAP: 'treemap',
  WATERFALL: 'waterfall',
  GAUGE: 'gauge',
  HEATMAP: 'heatmap',
  SCATTER: 'scatter',
  DISTRIBUTION: 'distribution',
  MIXED: 'mixed',
  OVERVIEW: 'overview',
}

export const chartOption = {
  BAR: {
    label: 'Bar',
    value: chartVariant.BAR,
    iconName: 'md/MdBarChart',
  },
  STACKED_BAR: {
    label: 'Stacked Bar',
    value: chartVariant.STACKED_BAR,
    iconName: 'md/MdStackedBarChart',
  },
  LINE: {
    label: 'Line',
    value: chartVariant.LINE,
    iconName: 'md/MdShowChart',
  },
  CUMULATIVE_LINE: {
    label: 'Cumulative Line',
    value: chartVariant.CUMULATIVE_LINE,
    iconName: 'md/MdStackedLineChart',
  },
  AREA: {
    label: 'Area',
    value: chartVariant.AREA,
    iconName: 'tb/TbChartAreaLineFilled',
  },
  STACKED_AREA: {
    label: 'Stacked Area',
    value: chartVariant.STACKED_AREA,
    iconName: 'md/MdAreaChart',
  },
  WATERFALL: {
    label: 'Waterfall',
    value: chartVariant.WATERFALL,
    iconName: 'md/MdWaterfallChart',
  },
  STACKED_WATERFALL: {
    label: 'Stacked Waterfall',
    value: chartVariant.STACKED_WATERFALL,
    iconName: 'tb/TbStack2',
  },
  BOX_PLOT: {
    label: 'Box Plot',
    value: chartVariant.BOX_PLOT,
    iconName: 'md/MdGraphicEq',
  },
  TABLE: {
    label: 'Table',
    value: chartVariant.TABLE,
    iconName: 'md/MdTableChart',
  },
  SUNBURST: {
    label: 'Sunburst',
    value: chartVariant.SUNBURST,
    iconName: 'md/MdDonutLarge',
  },
  TREEMAP: {
    label: 'Treemap',
    value: chartVariant.TREEMAP,
    iconName: 'tb/TbChartTreemap',
  },
  GAUGE: {
    label: 'Gauge',
    value: chartVariant.GAUGE,
    iconName: 'tb/TbGauge',
  },
  HEATMAP: {
    label: 'Heatmap',
    value: chartVariant.HEATMAP,
    iconName: 'tb/TbLayoutDashboard',
  },
  SCATTER: {
    label: 'Scatter',
    value: chartVariant.SCATTER,
    iconName: 'md/MdScatterPlot',
  },
  DISTRIBUTION: {
    label: 'Distribution',
    value: chartVariant.DISTRIBUTION,
    iconName: 'md/MdBarChart',
  },
  MIXED: {
    label: 'Mixed',
    value: chartVariant.MIXED,
    iconName: 'tb/TbChartHistogram',
  },
  OVERVIEW: {
    label: 'Overview',
    value: chartVariant.OVERVIEW,
    iconName: 'md/MdViewQuilt',
  },
}

export const chartAggrFunc = {
  SUM: 'sum',
  MEAN: 'mean',
  MIN: 'min',
  MAX: 'max',
  DIVISOR: 'divisor',
}

// TODO: Update these when we add support for more than 2 grouping levels
export const chartMaxGrouping = {
  [chartVariant.BAR]: 2,
  [chartVariant.BOX_PLOT]: 2,
  [chartVariant.CUMULATIVE_LINE]: 2,
  [chartVariant.LINE]: 2,
  [chartVariant.AREA]: 2,
  [chartVariant.STACKED_AREA]: 2,
  [chartVariant.STACKED_BAR]: 2,
  [chartVariant.STACKED_WATERFALL]: 2,
  [chartVariant.SUNBURST]: Infinity, // FIXME: Should we set up a limit?
  [chartVariant.TABLE]: Infinity, // FIXME
  [chartVariant.TREEMAP]: Infinity, // FIXME
  [chartVariant.WATERFALL]: 2,
  [chartVariant.GAUGE]: 1,
  [chartVariant.HEATMAP]: 2,
  [chartVariant.SCATTER]: 1,
  [chartVariant.DISTRIBUTION]: 2,
  [chartVariant.MIXED]: 2,
}

// Stat limits for multistat charts
export const chartStatUses = {
  [chartVariant.TABLE]: [],
  [chartVariant.SCATTER]: ['X Axis', 'Y Axis', 'Size (Optional)'],
  [chartVariant.MIXED]: ['Left', 'Right'],
}

export const legendViews = {
  FULL: 'full',
  COMPACT: 'compact',
}

export const legendLayouts = {
  AUTO: 'auto',
  COLUMN: 'column',
  ROW: 'row',
}

export const legendWidths = {
  AUTO: 'auto',
  WIDE: 'wide',
  SLIM: 'slim',
}

export const unitPlacements = {
  AFTER: 'after',
  AFTER_WITH_SPACE: 'afterWithSpace',
  BEFORE: 'before',
  BEFORE_WITH_SPACE: 'beforeWithSpace',
}

export const propPlacements = {
  // Top alignments
  TOP_LEFT: 'topLeft',
  TOP_CENTER: 'topCenter',
  TOP_RIGHT: 'topRight',
  // Center alignments
  CENTER: 'center',
  LEFT: 'left',
  RIGHT: 'right',
  // Bottom alignments
  BOTTOM_LEFT: 'bottomLeft',
  BOTTOM_CENTER: 'bottomCenter',
  BOTTOM_RIGHT: 'bottomRight',
}

export const notationOptions = {
  COMPACT: 'compact',
  ENGINEERING: 'engineering',
  SCIENTIFIC: 'scientific',
  STANDARD: 'standard',
  // Emulates `Number.prototype.toPrecision`. This is
  // not part of the notations supported by ECMAScript.
  PRECISION: 'precision',
}

export const displayOptions = {
  SHORT: 'short',
  LONG: 'long',
  E: 'E',
  E_PLUS: 'E+',
  E_LOWER: 'e',
  E_LOWER_PLUS: 'e+',
  X10: 'x10^',
  X10_PLUS: 'x10^+',
}

export const distributionTypes = {
  PDF: 'pdf',
  CDF: 'cdf',
}

export const distributionYAxes = {
  COUNTS: 'counts',
  DENSITY: 'density',
}

export const MAP_PROJECTIONS = {
  ALBERS: 'albers',
  EQUAL_EARTH: 'equalEarth',
  EQUIRECTANGULAR: 'equirectangular',
  LAMBERT_CONFORMAL_CONIC: 'lambertConformalConic',
  MERCATOR: 'mercator',
  NATURAL_EARTH: 'naturalEarth',
  WINKEL_TRIPEL: 'winkelTripel',
  GLOBE: 'globe',
  VERTICAL_PERSPECTIVE: 'vertical-perspective',
}

export const MAPBOX_PROJECTIONS = new Set(
  Object.values(MAP_PROJECTIONS).filter(
    (projection) => projection !== MAP_PROJECTIONS.VERTICAL_PERSPECTIVE
  )
)

export const MAPLIBRE_PROJECTIONS = new Set([
  MAP_PROJECTIONS.MERCATOR,
  MAP_PROJECTIONS.GLOBE,
  // MAP_PROJECTIONS.VERTICAL_PERSPECTIVE, // FIXME: Doesn't seem to work for now
])
