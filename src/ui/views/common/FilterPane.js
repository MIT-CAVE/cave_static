/** @jsxImportSource @emotion/react */
import { Card } from '@mui/material'
import { makeStyles } from '@mui/styles'
import * as R from 'ramda'
import React from 'react'
import { MdClose, MdEdit } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  selectCategoriesData,
  selectFiltered,
  selectSecondaryOpenPane,
  selectSync,
} from '../../../data/selectors'

import { findHighestTruth } from '../../compound'

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
  paddedDiv: theme.spacing(2.5),
  categoryTitle: {
    fontSize: '22px',
    textAlign: 'center',
    padding: '10px',
  },
  contextClose: {
    position: 'absolute',
    right: 25,
    cursor: 'pointer',
  },
}))

const FilterPane = () => {
  const categories = useSelector(selectCategoriesData)
  const filteredData = useSelector(selectFiltered)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()
  const classes = useStyles()

  const secondaryOpen = useSelector(selectSecondaryOpenPane)
  const filterableCategories = R.filter(R.propOr(true, 'filter'))(categories)
  return (
    <div css={{ marginBottom: '30px' }}>
      <div css={{ width: '100%', textAlign: 'center' }}>
        {R.values(
          R.mapObjIndexed((val, key) => {
            const filtered = R.propOr([], key, filteredData)
            const data = R.pathOr({}, [key, 'data'])(categories)

            const categoryItems = getCategoryItems(val)

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

            const highestTruths = R.unnest(
              R.map((item) => findHighestTruth(item, filtered))(
                R.toPairs(formattedCategory)
              )
            )

            return (
              <Card raised={true} className={classes.root} key={key}>
                {R.equals(secondaryOpen, { key: 'Filter', category: key }) ? (
                  <MdClose
                    className={classes.contextClose}
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
                    className={classes.contextClose}
                    onClick={() =>
                      dispatch(
                        mutateLocal({
                          path: ['appBar', 'paneState', 'secondaryOpen'],
                          value: { key: 'Filter', category: key },
                          sync: !includesPath(R.values(sync), [
                            'appBar',
                            'paneState',
                          ]),
                        })
                      )
                    }
                  />
                )}
                <div className={classes.categoryTitle}>
                  {R.pathOr(key, [key, 'name'])(categories)}
                </div>
                <div className={classes.paddedDiv}>
                  {filtered.length === 0
                    ? 'All items'
                    : R.join(', ', highestTruths.filter(Boolean))}
                </div>
              </Card>
            )
          })(filterableCategories)
        )}
      </div>
    </div>
  )
}

export default FilterPane
