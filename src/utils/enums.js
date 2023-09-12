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
  CONTEXT: 'context',
  FILTER: 'filter',
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
}

export const propVariant = {
  CHECKBOX: 'checkbox',
  COLUMN: 'column',
  COMBOBOX: 'combobox',
  DATE: 'date',
  DATETIME: 'datetime',
  DROPDOWN: 'dropdown',
  FIELD: 'field',
  HRADIO: 'hradio',
  HSTEPPER: 'hstepper',
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

export const chartType = {
  BAR: 'Bar',
  BOX_PLOT: 'Box Plot',
  CUMULATIVE_LINE: 'Cumulative Line',
  LINE: 'Line',
  AREA: 'Area',
  STACKED_AREA: 'Stacked Area',
  STACKED_BAR: 'Stacked Bar',
  STACKED_WATERFALL: 'Stacked Waterfall',
  SUNBURST: 'Sunburst',
  TABLE: 'Table',
  TREEMAP: 'Treemap',
  WATERFALL: 'Waterfall',
  GAUGE: 'Gauge',
  HEATMAP: 'Heatmap',
  SCATTER: 'Scatter',
  BUBBLE: 'Bubble',
  OVERVIEW: 'Overview',
}

// TODO: Update these when we add support for more than 2 grouping levels
export const chartMaxGrouping = {
  Bar: 2,
  'Box Plot': 2,
  'Cumulative Line': 2,
  Line: 2,
  Area: 2,
  'Stacked Area': 2,
  'Stacked Bar': 2,
  'Stacked Waterfall': 2,
  Sunburst: 2,
  Table: 2,
  Treemap: 2,
  Waterfall: 2,
  Gauge: 1,
  Heatmap: 2,
  Scatter: 1,
  Bubble: 1,
}

// Stat limits for multistat charts
export const chartStatUses = {
  Table: [],
  Scatter: ['X Axis', 'Y Axis'],
  Bubble: ['X Axis', 'Y Axis', 'Size'],
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
