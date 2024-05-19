export const layerId = {
  ARC_LAYER_SOLID: 'arcLayerSolid',
  ARC_LAYER_DASH: 'arcLayerDash',
  ARC_LAYER_DOT: 'arcLayerDot',
  MULTI_ARC_LAYER_SOLID: 'multiArcLayerSolid',
  MULTI_ARC_LAYER_DASH: 'multiArcLayerDash',
  MULTI_ARC_LAYER_DOT: 'multiArcLayerDot',
  GEOGRAPHY_LAYER: 'geographyLayer',
  NODE_ICON_LAYER: 'nodeIconLayer',
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
  CHECKBOX: 'checkbox',
  COLUMN: 'column',
  COMBOBOX: 'combobox',
  COMBOBOX_MULTI: 'comboboxMulti',
  DATE: 'date',
  DATETIME: 'datetime',
  DROPDOWN: 'dropdown',
  FIELD: 'field',
  HRADIO: 'hradio',
  HSTEPPER: 'hstepper',
  LATLNG_INPUT: 'latLngInput',
  LATLNG_MAP: 'latLngMap',
  LATLNG_PATH: 'latLngPath',
  NESTED: 'nested',
  PICTURE: 'picture',
  RADIO: 'radio',
  ROW: 'row',
  SINGLE: 'single',
  SLIDER: 'slider',
  TEXTAREA: 'textarea',
  TIME: 'time',
  VIDEO: 'video',
  VSTEPPER: 'vstepper',
  ICON: 'icon',
  ICON_ROW: 'iconRow',
  ICON_COMPACT: 'iconCompact',
}

export const propContainer = {
  HORIZONTAL: 'horizontal',
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

export const statFns = {
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
  OVERVIEW: 'overview',
}

export const chartAggrFunc = {
  SUM: 'sum',
  MIN: 'min',
  MAX: 'max',
  MEAN: 'mean',
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
  [chartVariant.SUNBURST]: 2,
  [chartVariant.TABLE]: 2,
  [chartVariant.TREEMAP]: 2,
  [chartVariant.WATERFALL]: 2,
  [chartVariant.GAUGE]: 1,
  [chartVariant.HEATMAP]: 2,
  [chartVariant.SCATTER]: 1,
}

// Stat limits for multistat charts
export const chartStatUses = {
  [chartVariant.TABLE]: [],
  [chartVariant.SCATTER]: ['X Axis', 'Y Axis', 'Size (Optional)'],
}

export const unitPlacements = {
  AFTER: 'after',
  AFTER_WITH_SPACE: 'afterWithSpace',
  BEFORE: 'before',
  BEFORE_WITH_SPACE: 'beforeWithSpace',
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
