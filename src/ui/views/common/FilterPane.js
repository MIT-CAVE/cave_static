/** @jsxImportSource @emotion/react */
import { Box, Card } from '@mui/material'
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

const nonSx = {
  contextClose: {
    position: 'absolute',
    right: '16px',
    cursor: 'pointer',
  },
}

const styles = {
  root: {
    position: 'relative',
    mb: 2,
    p: 2.5,
    textAlign: 'center',
  },
  categoryPaper: {
    p: 1,
    textAlign: 'left',
  },
  paddedDiv: {
    p: 0.5,
  },
  categoryTitle: {
    p: 0.5,
    fontSize: '22px',
    textAlign: 'center',
  },
}

const FilterPane = () => {
  const categories = useSelector(selectCategoriesData)
  const filteredData = useSelector(selectFiltered)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const secondaryOpen = useSelector(selectSecondaryOpenPane)
  const filterableCategories = R.filter(R.propOr(true, 'filter'))(categories)
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ width: '100%', textAlign: 'center' }}>
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
              <Card raised sx={styles.root} key={key}>
                {R.equals(secondaryOpen, { key: 'Filter', category: key }) ? (
                  <MdClose
                    css={nonSx.contextClose}
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
                    css={nonSx.contextClose}
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
                <Box sx={styles.categoryTitle}>
                  {R.pathOr(key, [key, 'name'])(categories)}
                </Box>
                <Box sx={styles.paddedDiv}>
                  {filtered.length === 0
                    ? 'All items'
                    : R.join(', ', highestTruths.filter(Boolean))}
                </Box>
              </Card>
            )
          })(filterableCategories)
        )}
      </Box>
    </Box>
  )
}

export default FilterPane
