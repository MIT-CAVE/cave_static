/** @jsxImportSource @emotion/react */
import { Box } from '@mui/material'
import * as R from 'ramda'

import renderKpi from './renderKpi'
import renderProp from './renderProp'

import { GRID_COLUMN_WIDTH } from '../../../utils/constants'
import { layoutType } from '../../../utils/enums'

import {
  getAllValuesForKey,
  getOptimalGridSize,
  sortedListById,
} from '../../../utils'

const renderPropItem = ({
  layoutItem,
  item: prop,
  resolveTime = R.identity,
  getCurrentVal,
  onChangeProp,
}) => {
  const { container, elevation, marquee } = layoutItem
  const currentValue = getCurrentVal ? getCurrentVal(prop.id) : prop.value
  return renderProp({
    prop: container ? { container, elevation, marquee, ...prop } : prop,
    currentVal: resolveTime(currentValue),
    onChange: onChangeProp(prop, prop.id),
  })
}

const renderKpiItem = ({ item }) =>
  renderKpi({
    title: item.name || item.itemId,
    type: item.type,
    // NOTE: The `unit` prop is deprecated in favor of
    // `numberFormat.unit` and will be removed on 1.0.0
    ...R.pick(['value', 'icon', 'unit', 'numberFormat', 'style'])(item),
  })

const getItemRenderFn = R.cond([
  [R.equals('prop'), R.always(renderPropItem)],
  [R.equals('kpi'), R.always(renderKpiItem)],
  [R.T, null],
])

const renderItem = ({
  keyName,
  layout: layoutItem,
  items,
  unusedItems,
  ...other
}) => {
  const { itemId, column, row, width, height, style } = layoutItem
  if (R.isNil(itemId)) throw Error("Missing 'itemId' property in layout item")

  const item = R.pipe(
    R.prop(itemId),
    R.assoc('id', itemId),
    R.assoc('style')({
      gridColumnStart: column,
      gridRowStart: row,
      width,
      height,
      ...style,
    })
  )(items)
  const itemRenderFn = getItemRenderFn(keyName)
  return {
    unusedItems,
    component: itemRenderFn({ layoutItem, item, ...other }),
  }
}

const getLayoutItems = ({ data, fillerItems, ...other }) =>
  R.pipe(
    sortedListById,
    R.concat(fillerItems),
    R.map((layout) => {
      const { component } = renderLayout({ layout, ...other })
      return component
    })
  )(data)

const renderGrid = ({ layout, unusedItems, ...other }) => {
  const {
    num_columns = 'auto',
    num_rows = 'auto',
    width = 'auto',
    height = 'auto',
    column,
    row,
    data,
    min_column_width: minColumnWidth = `${GRID_COLUMN_WIDTH}px`,
  } = layout
  const numItems = R.pipe(R.defaultTo(unusedItems), R.values, R.length)(data)
  const { numColumns, numRows } = getOptimalGridSize(
    num_columns,
    num_rows,
    numItems
  )

  const numFillers = R.isNil(data) ? R.min(numColumns * numRows, numItems) : 0
  const keyType = R.dropLast(2)('itemId')
  const fillerItems = R.pipe(
    R.take(numFillers),
    R.map(R.pipe(R.objOf('itemId'), R.assoc('type', keyType))),
    R.indexBy(R.prop('itemId')),
    sortedListById
  )(unusedItems)
  unusedItems = R.drop(numFillers)(unusedItems)

  return {
    unusedItems,
    component: (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${numColumns},minmax(${minColumnWidth},auto))`,
          gridTemplateRows: `repeat(${numRows},minmax(min-content,1fr))`,
          gridColumnStart: column,
          gridRowStart: row,
          gridAutoFlow: 'dense',
          gap: 1.5,
          height,
          width,
        }}
      >
        {getLayoutItems({ data, fillerItems, unusedItems, ...other })}
      </Box>
    ),
  }
}

const renderUndefLayout = () => null

const getLayoutRenderFn = (layout = {}) => {
  const type = R.prop('type')(layout)
  return R.cond([
    [R.equals(layoutType.GRID), R.always(renderGrid)],
    [R.equals(layoutType.ITEM), R.always(renderItem)],
    [R.pipe(R.isNil, R.and(R.isEmpty(layout))), R.always(renderUndefLayout)],
    // Will break for non-empty layouts missing their types
    [
      R.T,
      () => {
        throw Error(`Invalid layout type '${type}'`)
      },
    ],
  ])(type)
}

const renderLayout = ({ layout, ...other }) => {
  const layoutRenderFn = getLayoutRenderFn(layout)
  return layoutRenderFn({ layout, ...other })
}

const getLayoutComponent = ({
  layout = {
    type: layoutType.GRID,
    num_columns: 'auto',
    num_rows: 'auto',
  },
  items,
  ...other
}) => {
  const usedItemsInLayout = getAllValuesForKey('itemId', layout)
  const { component } = renderLayout({
    layout,
    items,
    unusedItems: R.pipe(
      R.omit(usedItemsInLayout),
      sortedListById,
      R.pluck('id')
    )(items),
    ...other,
  })
  return component
}

const renderPropsLayout = ({ ...props }) =>
  getLayoutComponent({ keyName: 'prop', ...props })

const renderKpisLayout = ({ ...props }) =>
  getLayoutComponent({ keyName: 'kpi', ...props })

export { renderPropsLayout, renderKpisLayout }
