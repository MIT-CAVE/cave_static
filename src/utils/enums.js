export const layerId = {
  ARC_LAYER: 'arcLayer',
  ARC_LAYER_3D: 'arcLayer3D',
  GEOGRAPHY_LAYER: 'geography',
  NODE_ICON_LAYER: 'nodeIconLayer',
  NODE_ICON_CLUSTER_LAYER: 'nodeIconClusterLayer',
}

export const themeId = {
  DARK: 'dark',
  LIGHT: 'light',
}

export const viewId = {
  DASHBOARD: 'stats',
  MAP: 'map',
  KPI: 'kpi',
}

export const styleId = {
  STREETS: 'streets-v12',
  OUTDOORS: 'outdoors-v12',
  DARK: 'dark-v11',
  LIGHT: 'light-v11',
  SATELLITE: 'satellite-v9',
  SATELLITE_STREETS: 'satellite-streets-v12',
}

export const asyncStatus = {
  PENDING: 'pending',
  FAIL: 'fail',
  SUCCESS: 'success',
}

export const paneId = {
  SESSION: 'session',
  APP_SETTINGS: 'appSettings',
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

export const kpiId = {
  NUMBER: 'num',
  TEXT: 'text',
  HEAD: 'head',
}

export const kpiVariant = {
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
  WaterFall: 2,
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
