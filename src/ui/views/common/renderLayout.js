/** @jsxImportSource @emotion/react */
import { Box } from '@mui/material'
import * as R from 'ramda'

import renderKpi from './renderKpi'
import renderProp from './renderProp'

import { GRID_COLUMN_WIDTH } from '../../../utils/constants'
import { kpiLayout, propLayout } from '../../../utils/enums'

import { getAllValuesForKey, sortedListById } from '../../../utils'

const getOptimalGridSize = (numColumns, numRows, n) => {
  const r = Math.sqrt(n)
  return numColumns === 'auto' && numRows === 'auto'
    ? {
        numColumns: Math.floor(r),
        numRows: Math.ceil(n / Math.floor(r)),
      }
    : numColumns === 'auto'
    ? {
        numColumns: Math.ceil(n / numRows),
        numRows,
      }
    : numRows === 'auto'
    ? {
        numColumns,
        numRows: Math.ceil(n / numColumns),
      }
    : {
        numColumns,
        numRows,
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

const renderLayoutProp = ({
  layout: layoutItem,
  items,
  unusedItems,
  resolveTime = R.identity,
  getCurrentVal,
  onChangeProp,
}) => {
  const { propId, column, row, width, height, container, style } = layoutItem
  if (R.isNil(propId)) throw Error("Missing 'propId' property in layout item")

  const prop = R.pipe(
    R.prop(propId),
    R.assoc('id', propId),
    R.assoc('style')({
      gridColumnStart: column,
      gridRowStart: row,
      width,
      height,
      ...style,
    })
  )(items)
  const currentValue = getCurrentVal ? getCurrentVal(propId) : prop.value
  return {
    unusedItems,
    component: renderProp({
      prop: container ? { container, ...prop } : prop,
      currentVal: resolveTime(currentValue),
      onChange: onChangeProp(prop, propId),
      prettify: true,
    }),
  }
}

const renderLayoutKpi = ({ layout: layoutItem, items, unusedItems }) => {
  const { kpiId, column, row, width, height } = layoutItem
  if (R.isNil(kpiId)) throw Error("Missing 'kpiId' property in layout item")

  const kpi = R.pipe(
    R.prop(kpiId),
    R.assoc('style')({
      gridColumnStart: column,
      gridRowStart: row,
      width,
      height,
    })
  )(items)
  return {
    unusedItems,
    component: renderKpi({
      title: kpi.name || kpiId,
      ...R.pick(['value', 'icon', 'unit', 'style'])(kpi),
    }),
  }
}

const renderGridLayout = ({ keyName, layout, unusedItems, ...other }) => {
  const {
    num_columns = 'auto',
    num_rows = 'auto',
    width = 'auto',
    height = 'auto',
    column,
    row,
    data,
  } = layout
  const numItems = R.pipe(R.defaultTo(unusedItems), R.values, R.length)(data)
  const { numColumns, numRows } = getOptimalGridSize(
    num_columns,
    num_rows,
    numItems
  )

  const numFillers = R.isNil(data) ? R.min(numColumns * numRows, numItems) : 0
  const keyType = R.dropLast(2)(keyName)
  const fillerItems = R.pipe(
    R.take(numFillers),
    R.map(R.pipe(R.objOf(keyName), R.assoc('type', keyType))),
    R.indexBy(R.prop(keyName)),
    sortedListById
  )(unusedItems)
  unusedItems = R.drop(numFillers)(unusedItems)

  return {
    unusedItems,
    component: (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${numColumns},minmax(${GRID_COLUMN_WIDTH}px,auto))`,
          gridTemplateRows: `repeat(${numRows},minmax(min-content,1fr))`,
          gridColumnStart: column,
          gridRowStart: row,
          gap: 1.5,
          height,
          width,
        }}
      >
        {getLayoutItems({ keyName, data, fillerItems, unusedItems, ...other })}
      </Box>
    ),
  }
}

const renderUndefLayout = ({
  ...props
}) => {
  return null
}

const getLayoutRenderFn = (layout = {}) => {
  const type = R.prop('type')(layout)
  return R.cond([
    // NOTE: propLayout.GRID === kpiLayout.GRID
    [R.equals(propLayout.GRID), R.always(renderGridLayout)],
    [R.equals(propLayout.PROP), R.always(renderLayoutProp)],
    [R.equals(kpiLayout.KPI), R.always(renderLayoutKpi)],
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
  keyName,
  layout = {
    type: 'grid',
    num_columns: 'auto',
    num_rows: 'auto',
  },
  items,
  ...other
}) => {
  const usedItemsInLayout = getAllValuesForKey(keyName, layout)
  const { component } = renderLayout({
    keyName,
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
  getLayoutComponent({ keyName: 'propId', ...props })

const renderKpisLayout = ({ ...props }) =>
  getLayoutComponent({ keyName: 'kpiId', ...props })

export { renderPropsLayout, renderKpisLayout }
