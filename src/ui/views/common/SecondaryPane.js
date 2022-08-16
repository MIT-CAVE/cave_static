/** @jsxImportSource @emotion/react */
import { Drawer } from '@mui/material'
import { makeStyles } from '@mui/styles'
import * as R from 'ramda'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { fetchData } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectCategoriesData,
  selectAppBarData,
  selectSecondaryOpenPane,
  selectOpenPane,
  selectFiltered,
  selectSync,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, PANE_WIDTH } from '../../../utils/constants'

import { createNestedList, findBaseItems, findValue } from '../../compound'

import { getCategoryItems, includesPath } from '../../../utils'

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    width: PANE_WIDTH,
    left: `${APP_BAR_WIDTH + PANE_WIDTH + 40}px`,
    borderLeft: `1px solid ${theme.palette.text.secondary}`,
    padding: '20px',
    height: 'calc(100vh - 40px)', // Since the top and bottom padding change the height
    overflow: 'visible',
    overflowY: 'auto',
  },
  root: {
    padding: '5px',
    textAlign: 'center',
    marginBottom: '15px',
  },
  categoryPaper: {
    padding: '10px',
    textAlign: 'left',
  },
  titleDiv: {
    fontSize: '25px',
    textAlign: 'center',
    borderBottom: `2px solid ${theme.palette.text.secondary}`,
    paddingBottom: '10px',
    marginBottom: '25px',
  },
}))

const localCss = {
  titleText: {
    marginRight: '5px',
  },
  contextButton: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '10px',
    marginBottom: '30px',
    width: '75%',
  },
  bottomButton: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '10px',
    marginBottom: '30px',
    width: '55%',
  },
  resetButton: {
    marginLeft: '15px',
    marginRight: 'auto',
    marginTop: '10px',
    marginBottom: '30px',
    width: '25%',
  },
  contextClose: {
    position: 'absolute',
    right: 25,
  },
  contextEdit: {
    float: 'right',
  },
  smallText: {
    fontSize: '14px',
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
      fetchData({
        url: `${window.location.ancestorOrigins[0]}/mutate_session/`,
        fetchMethod: 'POST',
        body: {
          data_name: 'appBar',
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
          reinit: false,
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
      fetchData({
        url: `${window.location.ancestorOrigins[0]}/mutate_session/`,
        fetchMethod: 'POST',
        body: {
          data_name: 'appBar',
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
          reinit: false,
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
    <div css={{ marginLeft: '-30px' }}>
      {R.map((val) => createNestedList(val, formattedItems, selectFunction))(
        R.toPairs(formattedCategory)
      )}
    </div>
  )
}

const FilterPane = ({ filteredData, category, dispatch }) => {
  const categories = useSelector(selectCategoriesData)
  const sync = useSelector(selectSync)

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

  const selectedItems = R.propOr([], category, filteredData)

  const applyFilters = useCallback(
    ({ category, item }) => {
      const filtered = R.propOr([], category, filteredData)
      const newItems = R.filter((d) => !R.includes(d, filtered), item)
      dispatch(
        mutateLocal({
          path: ['appBar', 'filtered', category],
          value: R.concat(newItems, filtered),
          sync: !includesPath(R.values(sync), ['appBar', 'filtered', category]),
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
          path: ['appBar', 'filtered', category],
          value: R.without(item, filtered),
          sync: !includesPath(R.values(sync), ['appBar', 'filtered', category]),
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
    <div css={{ marginLeft: '-30px' }}>
      {R.map((val) => createNestedList(val, selectedItems, selectFunction))(
        R.toPairs(formattedCategory)
      )}
    </div>
  )
}

const SecondaryPane = () => {
  const classes = useStyles()
  const categories = useSelector(selectCategoriesData)
  const open = useSelector(selectSecondaryOpenPane)
  const filteredData = useSelector(selectFiltered)
  const primaryPane = useSelector(selectOpenPane)
  const pane = R.propOr({}, primaryPane)(useSelector(selectAppBarData))
  const dispatch = useDispatch()

  const category = R.prop('category', open)
  const title = R.pathOr(category, [category, 'name'])(categories)
  return (
    <Drawer
      anchor="left"
      open={!!open}
      variant={open ? 'permanent' : 'persistent'}
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <div className={classes.titleDiv}>
        <span css={localCss.titleText}>{title}</span>
      </div>
      {R.prop('key', open) === 'Filter' ? (
        <FilterPane
          filteredData={filteredData}
          dispatch={dispatch}
          category={category}
        />
      ) : (
        <ContextPane
          category={category}
          context={R.prop('key', open)}
          pane={pane}
          primaryPane={primaryPane}
          dispatch={dispatch}
          classes={classes}
        />
      )}
    </Drawer>
  )
}

export default SecondaryPane
