/** @jsxImportSource @emotion/react */
import { Button, Card, Paper } from '@mui/material'
import { makeStyles } from '@mui/styles'
import * as R from 'ramda'
import React from 'react'
import { MdClose, MdEdit } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import renderProp from './renderProp'

import { fetchData } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectAppBarData,
  selectCategoriesData,
  selectOpenPane,
  selectSecondaryOpenPane,
  selectSync,
} from '../../../data/selectors'
import { propContainer } from '../../../utils/enums'

import { SimpleDropdown, findHighestTruth } from '../../compound'

import { getCategoryItems, includesPath } from '../../../utils'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(0.5),
    textAlign: 'center',
    marginBottom: theme.spacing(2),
  },
  categoryPaper: {
    padding: theme.spacing(1),
    textAlign: 'left',
  },
}))

const localCss = {
  contextButton: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '10px',
    marginBottom: '30px',
    width: '75%',
  },
  contextClose: {
    position: 'absolute',
    right: 25,
    cursor: 'pointer',
  },
  contextEdit: {
    float: 'right',
    cursor: 'pointer',
  },
  smallText: {
    fontSize: '14px',
  },
}

const ContextPane = () => {
  const appBarData = useSelector(selectAppBarData)
  const categories = useSelector(selectCategoriesData)
  const dispatch = useDispatch()
  const classes = useStyles()

  const open = useSelector(selectOpenPane)
  const pane = R.propOr({}, open)(appBarData)
  const sync = useSelector(selectSync)
  const secondaryOpen = useSelector(selectSecondaryOpenPane)

  const sorter = (a, b) => parseInt(a) - parseInt(b)
  const nextContextName = R.pipe(
    R.propOr({}, 'data'),
    R.keys,
    R.sort(sorter),
    R.last,
    R.defaultTo('0'),
    (a) => parseInt(a.replace(/[A-Za-z$_-]/g, '')),
    R.add(1),
    (num) => `context_${num}`
  )(pane)

  return (
    <div css={{ marginBottom: '30px' }}>
      {R.values(
        R.mapObjIndexed((val, key, obj) => (
          <Card raised={true} className={classes.root} key={key}>
            <div>
              <MdClose
                css={localCss.contextClose}
                onClick={() =>
                  dispatch(
                    fetchData({
                      url: `${window.location.ancestorOrigins[0]}/mutate_session/`,
                      fetchMethod: 'POST',
                      body: {
                        data_name: 'appBar',
                        data_path: ['data', open, 'data'],
                        data_value: R.dissoc(key, obj),
                        mutation_type: 'mutate',
                        reinit: false,
                      },
                    })
                  )
                }
              />
            </div>
            <SimpleDropdown
              value={R.propOr('Select a Prop', 'prop', val)}
              optionsList={R.keys(R.propOr({}, 'props', pane))}
              getLabel={(item) => R.pathOr(item, ['props', item, 'name'])(pane)}
              onSelect={(value) =>
                dispatch(
                  fetchData({
                    url: `${window.location.ancestorOrigins[0]}/mutate_session/`,
                    fetchMethod: 'POST',
                    body: {
                      data_name: 'appBar',
                      data_path: ['data', open, 'data', key, 'prop'],
                      data_value: value,
                      mutation_type: 'mutate',
                      reinit: false,
                    },
                  })
                )
              }
            />
            {!R.isEmpty(val) &&
              renderProp({
                prop: R.pipe(
                  R.pathOr({}, ['props', R.propOr('', 'prop', val)]),
                  R.assoc('container', propContainer.UNTITLED)
                )(pane),
                currentVal: R.prop('value', val),
                onChange: (value) =>
                  dispatch(
                    fetchData({
                      url: `${window.location.ancestorOrigins[0]}/mutate_session/`,
                      fetchMethod: 'POST',
                      body: {
                        data_name: 'appBar',
                        data_path: ['data', open, 'data', key, 'value'],
                        data_value: value,
                        mutation_type: 'mutate',
                        reinit: false,
                      },
                    })
                  ),
              })}
            <Paper elevation={7} className={classes.categoryPaper}>
              {R.map((category) => {
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
                const formattedItems = R.map((key) =>
                  R.path([key, R.last(categoryItems)], data)
                )(R.pathOr([], ['applyCategories', category], val))

                const highestTruths = R.unnest(
                  R.map((item) => findHighestTruth(item, formattedItems))(
                    R.toPairs(formattedCategory)
                  )
                )

                return (
                  <div key={category}>
                    <div css={{ marginTop: '10px' }}>
                      {R.propOr(category, 'name')(categoryObj)}
                      {': '}
                      <span css={localCss.smallText}>
                        {R.join(', ', highestTruths.filter(Boolean))}
                      </span>
                      {R.equals(secondaryOpen, { key, category }) ? (
                        <MdClose
                          css={localCss.contextEdit}
                          onClick={() =>
                            dispatch(
                              mutateLocal({
                                path: ['appBar', 'paneState', 'secondaryOpen'],
                                value: null,
                                sync: !includesPath(R.values(sync), [
                                  'appBar',
                                  'paneState',
                                ]),
                              })
                            )
                          }
                        />
                      ) : (
                        <MdEdit
                          css={localCss.contextEdit}
                          onClick={() =>
                            dispatch(
                              mutateLocal({
                                path: ['appBar', 'paneState', 'secondaryOpen'],
                                value: { key, category },
                                sync: !includesPath(R.values(sync), [
                                  'appBar',
                                  'paneState',
                                ]),
                              })
                            )
                          }
                        />
                      )}
                    </div>
                    <hr />
                  </div>
                )
              })(
                R.pathOr(
                  [],
                  ['props', R.prop('prop', val), 'selectableCategories'],
                  pane
                )
              )}
            </Paper>
          </Card>
        ))(R.propOr({}, 'data', pane))
      )}
      <div css={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          color="success"
          css={localCss.contextButton}
          onClick={() =>
            dispatch(
              fetchData({
                url: `${window.location.ancestorOrigins[0]}/mutate_session/`,
                fetchMethod: 'POST',
                body: {
                  data_name: 'appBar',
                  data_path: ['data', open, 'data'],
                  data_value: R.assoc(
                    nextContextName,
                    {},
                    R.prop('data', pane)
                  ),
                  mutation_type: 'mutate',
                  reinit: false,
                },
              })
            )
          }
        >
          {'Add Context'}
        </Button>
      </div>
    </div>
  )
}

export default ContextPane
