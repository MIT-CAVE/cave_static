import { Box } from '@mui/material'
import * as R from 'ramda'

import renderProp from './renderProp'

import { layoutType } from '../../../utils/enums'

import {
  getAllValuesForKey,
  getOptimalGridSize,
  sortedListById,
} from '../../../utils'

const renderPropItem = ({
  layoutItem,
  item: prop,
  getCurrentVal,
  onChangeProp,
}) => {
  const { container, elevation, marquee } = layoutItem
  const currentValue = getCurrentVal ? getCurrentVal(prop.id) : prop.value
  return renderProp({
    prop: container ? { container, elevation, marquee, ...prop } : prop,
    currentVal: currentValue,
    onChange: onChangeProp(prop, prop.id),
  })
}

const renderItem = ({ layout: layoutItem, items, unusedItems, ...other }) => {
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
  const itemRenderFn = renderPropItem
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
    numColumns = 'auto',
    numRows = 'auto',
    width = 'auto',
    height = 'auto',
    column,
    row,
    data,
    maxHeightBy = 'row',
  } = layout
  const maxRowHeight = R.cond([
    [R.equals('row'), R.always('auto')],
    [R.equals('grid'), R.always('1fr')],
    [
      R.T,
      () => {
        throw Error(`Unknown value "${maxHeightBy}" for \`maxHeightBy\`.`)
      },
    ],
  ])(maxHeightBy)

  const numItems = R.pipe(R.defaultTo(unusedItems), R.values, R.length)(data)

  const getMaxDimension = (prop) =>
    R.pipe(R.values, R.pluck(prop), R.reduce(R.max, 1))(data)

  const [numRowsOptimal, numColumnsOptimal] = getOptimalGridSize(
    numRows === 'auto' ? getMaxDimension('row') : numRows,
    numColumns === 'auto' ? getMaxDimension('column') : numColumns,
    numItems
  )

  const numFillers = R.isNil(data)
    ? R.min(numColumnsOptimal * numRowsOptimal, numItems)
    : 0
  const keyType = R.dropLast(2)('itemId')
  const fillerItems = R.pipe(
    R.take(numFillers),
    R.map(R.pipe(R.objOf('itemId'), R.assoc('type', keyType))),
    R.indexBy(R.prop('itemId')),
    sortedListById
  )(unusedItems)
  unusedItems = R.drop(numFillers)(unusedItems)

  // Set dense auto-placement by column or row
  const gridAutoFlow = `${numColumns === 'auto' ? 'column' : 'row'} dense`
  return {
    unusedItems,
    component: (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${numColumnsOptimal},minmax(max-content,1fr))`,
          gridTemplateRows: `repeat(${numRowsOptimal},minmax(min-content,${maxRowHeight}))`,
          gridColumnStart: column,
          gridRowStart: row,
          gridAutoFlow,
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
    numColumns: 'auto',
    numRows: 'auto',
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

const renderPropsLayout = ({ ...props }) => getLayoutComponent({ ...props })

export { renderPropsLayout }
