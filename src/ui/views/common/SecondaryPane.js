import { Box, Drawer, IconButton } from '@mui/material'
import * as R from 'ramda'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectCategoriesData,
  selectFiltered,
  selectSync,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, PANE_WIDTH } from '../../../utils/constants'

import {
  createNestedList,
  FetchedIcon,
  findBaseItems,
  findValue,
} from '../../compound'

import { getCategoryItems, includesPath } from '../../../utils'

const styles = {
  drawerPaper: {
    '& .MuiPaper-root': {
      width: PANE_WIDTH,
      borderLeft: 1,
      borderRight: 1,
      borderColor: 'text.secondary',
      p: 2.5,
      boxSizing: 'border-box',
      height: '100vh',
      overflow: 'visible',
      overflowY: 'auto',
    },
  },
  titleDiv: {
    fontSize: '25px',
    textAlign: 'center',
    borderBottom: 2,
    borderColor: 'text.secondary',
    pb: 1,
    mb: 3,
  },
  titleText: {
    mr: 0.5,
  },
  pinButton: {
    position: 'absolute',
    top: 8,
  },
}

const ContextPane = ({ pane, dispatch, context, category, primaryPane }) => {
  const categories = useSelector(selectCategoriesData)

  const categoryObj = R.propOr({}, category)(categories)
  const data = R.propOr({}, 'data', categoryObj)

  const categoryItems = getCategoryItems(categoryObj)

  const formatCategory = (categoryItems, dataItem) => {
    return R.length(categoryItems) > 1
      ? R.assoc(
          R.prop(categoryItems[0], dataItem),
          formatCategory(R.drop(1, categoryItems), dataItem),
          {}
        )
      : [R.prop(categoryItems[0], dataItem)]
  }

  const formattedCategory = R.reduce(
    R.mergeDeepWith(R.concat),
    {}
  )(
    R.values(
      R.map((item) => {
        return formatCategory(categoryItems, item)
      })(data)
    )
  )

  const selectedItems = R.pathOr(
    [],
    ['data', context, 'applyCategories', category],
    pane
  )

  const formattedItems = R.map((key) =>
    R.path([key, R.last(categoryItems)], data)
  )(selectedItems)

  const addItem = (item) => {
    const value = R.is(String, item)
      ? [
          R.last(
            R.filter((obj) =>
              R.equals(R.path([1, R.last(categoryItems)], obj), item)
            )(R.toPairs(data))
          )[0],
        ]
      : R.pluck(
          0,
          R.filter((obj) =>
            R.includes(R.path([1, R.last(categoryItems)], obj), item)
          )(R.toPairs(data))
        )
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          data_name: 'panes',
          data_path: [
            'data',
            primaryPane,
            'data',
            context,
            'applyCategories',
            category,
          ],
          data_value: R.uniq(R.concat(value, selectedItems)),
          mutation_type: 'mutate',
        },
      })
    )
  }

  const removeItem = (item) => {
    const value = R.is(String, item)
      ? [
          R.last(
            R.filter((obj) =>
              R.equals(R.path([1, R.last(categoryItems)], obj), item)
            )(R.toPairs(data))
          )[0],
        ]
      : R.pluck(
          0,
          R.filter((obj) =>
            R.includes(R.path([1, R.last(categoryItems)], obj), item)
          )(R.toPairs(data))
        )
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          data_name: 'panes',
          data_path: [
            'data',
            primaryPane,
            'data',
            context,
            'applyCategories',
            category,
          ],
          data_value: R.without(value, selectedItems),
          mutation_type: 'mutate',
        },
      })
    )
  }

  const selectFunction = (value) => {
    R.is(String, value) && findValue(value, formattedItems) === 'false'
      ? addItem(value)
      : R.is(String, value)
      ? removeItem(value)
      : findValue(value, formattedItems) !== 'true'
      ? addItem(findBaseItems(value))
      : removeItem(findBaseItems(value))
  }

  return (
    <Box sx={{ ml: '-30px' }}>
      {R.map((val) => createNestedList(val, formattedItems, selectFunction))(
        R.toPairs(formattedCategory)
      )}
    </Box>
  )
}

const FilterPane = ({ filteredData, category, dispatch }) => {
  const categories = useSelector(selectCategoriesData)
  const sync = useSelector(selectSync)

  const categoryObj = R.propOr({}, category)(categories)
  const data = R.propOr({}, 'data', categoryObj)

  const categoryItems = getCategoryItems(categoryObj)

  const formatCategory = useCallback(
    (categoryItems, dataItem) =>
      R.length(categoryItems) > 1
        ? R.assoc(
            R.prop(categoryItems[0], dataItem),
            formatCategory(R.drop(1, categoryItems), dataItem),
            {}
          )
        : [R.prop(categoryItems[0], dataItem)],
    []
  )

  const formattedCategory =
    R.length(categoryItems) > 1
      ? R.reduce(
          R.mergeDeepWith(R.concat),
          {}
        )(
          R.values(
            R.map((item) => {
              return formatCategory(categoryItems, item)
            })(data)
          )
        )
      : R.unnest(
          R.values(
            R.map((item) => {
              return formatCategory(categoryItems, item)
            })(data)
          )
        )
  const selectedItems = R.propOr([], category, filteredData)

  const applyFilters = useCallback(
    ({ category, item }) => {
      const filtered = R.propOr([], category, filteredData)
      const newItems = R.filter((d) => !R.includes(d, filtered), item)
      dispatch(
        mutateLocal({
          path: ['panes', 'filtered', category],
          value: R.concat(newItems, filtered),
          sync: !includesPath(R.values(sync), ['panes', 'filtered', category]),
        })
      )
    },
    [dispatch, filteredData, sync]
  )

  const deleteFilters = useCallback(
    ({ category, item }) => {
      const filtered = R.propOr([], category, filteredData)
      dispatch(
        mutateLocal({
          path: ['panes', 'filtered', category],
          value: R.without(item, filtered),
          sync: !includesPath(R.values(sync), ['panes', 'filtered', category]),
        })
      )
    },
    [dispatch, filteredData, sync]
  )

  const selectFunction = useCallback(
    (value) => {
      R.is(String, value) && findValue(value, selectedItems) === 'false'
        ? applyFilters({ category: category, item: [value] })
        : R.is(String, value)
        ? deleteFilters({ category: category, item: [value] })
        : findValue(value, selectedItems) !== 'true'
        ? applyFilters({ category: category, item: findBaseItems(value) })
        : deleteFilters({ category: category, item: findBaseItems(value) })
    },
    [applyFilters, category, deleteFilters, selectedItems]
  )

  return (
    <Box sx={{ ml: '-30px' }}>
      {R.map((val) => createNestedList(val, selectedItems, selectFunction))(
        R.toPairs(formattedCategory)
      )}
    </Box>
  )
}

const SecondaryPane = ({ open, pane, primaryPane, side, pin, onPin }) => {
  const categories = useSelector(selectCategoriesData)
  const filteredData = useSelector(selectFiltered)
  const dispatch = useDispatch()

  const category = R.prop('category', open)
  const title = R.pathOr(category, [category, 'name'])(categories)
  return (
    <Drawer
      sx={R.assocPath(
        ['& .MuiPaper-root', side],
        `${APP_BAR_WIDTH + 1 + PANE_WIDTH}px`,
        styles.drawerPaper
      )}
      anchor={side}
      open={!!open}
      variant={open ? 'permanent' : 'persistent'}
    >
      <Box sx={styles.titleDiv}>
        <Box sx={styles.titleText}>{title}</Box>
        <IconButton
          sx={R.assoc(side === 'right' ? 'left' : 'right', 8, styles.pinButton)}
          onClick={onPin}
        >
          <FetchedIcon iconName={pin ? 'MdPushPin' : 'MdOutlinePushPin'} />
        </IconButton>
      </Box>
      {R.prop('key', open) === 'Filter' ? (
        <FilterPane {...{ filteredData, category, dispatch }} />
      ) : (
        <ContextPane
          context={R.prop('key', open)}
          {...{ category, pane, primaryPane, dispatch }}
        />
      )}
    </Drawer>
  )
}

export default SecondaryPane
