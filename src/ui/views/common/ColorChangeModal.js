import {
  TextField,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { colord } from 'colord'
import { MuiColorInput, matchIsValidColor } from 'mui-color-input'
import * as R from 'ramda'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { DataGridModal } from './BaseModal'

import { mutateLocal } from '../../../data/local'
import { selectStatGroupings } from '../../../data/selectors'
import { colorGen } from '../../../utils/ColorGen'
import { useColorPicker } from '../../compound/ColorPicker'

import { Select, HelpTooltip } from '../../compound'

import { getColorString, forceArray, getLabelFn } from '../../../utils'

const ColorChangeModal = ({ open, label, labelExtra, onClose, chartObj }) => {
  const [searchText, setSearchText] = useState('')
  const [currentCategoryId, setCurrentCategoryId] = useState(null)
  const [currentCategoryName, setCurrentCategoryName] = useState(null)
  const [localCategoryColors, setLocalCategoryColors] = useState({})
  const dispatch = useDispatch()
  const statGroupings = useSelector(selectStatGroupings)

  const allCategories = useMemo(
    () =>
      R.mergeAll(
        Object.values(
          R.map(
            R.pipe(
              R.prop('levels'),
              (levels) =>
                R.map(
                  (item) => [item, getLabelFn(levels, item)],
                  R.keys(levels)
                ),
              R.fromPairs
            ),
            statGroupings
          )
        )
      ),
    [statGroupings]
  )

  useMemo(() => {
    if (R.pathOr(false, ['groupingLevel'])(chartObj)) {
      const categoryId = R.prop('groupingLevel')(chartObj)[1]
      setCurrentCategoryId(categoryId)
      setCurrentCategoryName(allCategories[categoryId])
    }
  }, [chartObj, allCategories])

  const handleChangeCategory = (categoryName) => {
    setCurrentCategoryId(
      R.head(R.keys(R.filter((v) => v === categoryName, allCategories)))
    )
    setCurrentCategoryName(categoryName)
  }

  const getCategoryLabel = useCallback(
    (categoryParents, levelCategories, category, index, level) => {
      if (level in categoryParents) {
        const parent = categoryParents[level]
        return `${category} \u279D ${getCategoryLabel(
          categoryParents,
          levelCategories,
          levelCategories[parent][index],
          index,
          parent
        )}`
      } else {
        return `${category}`
      }
    },
    []
  )

  const constructSingleCategoryProperties = useCallback(
    (grouping, parents, levelCategories, coloring) => {
      const result = {}
      for (const [level, categories] of Object.entries(levelCategories)) {
        // If level does not have parents, it does not depend on other levels; same categories can be treated as same labels
        const cleanedCategories = !(level in parents)
          ? new Set(categories)
          : categories
        cleanedCategories.forEach((category, index) => {
          const label = getCategoryLabel(
            parents,
            levelCategories,
            category,
            index,
            level
          )
          const categoryColor =
            category in coloring
              ? colord(coloring[category]).toHslString()
              : colorGen(label)
          result[label] = {
            grouping: grouping,
            level: level,
            lastCategory: category,
            // color: categoryColor, TODO: not needed for now
          }
          setLocalCategoryColors(R.assoc(label, categoryColor))
        })
      }
      return result
    },
    [getCategoryLabel]
  )

  const constructAllCategoryProperties = useCallback(() => {
    const groupingMaps = []
    R.forEach(([groupingLabel, grouping]) => {
      const levelCategories = R.pipe(R.prop('data'), R.omit(['id']))(grouping)
      const parent = R.pipe(
        R.prop('levels'),
        R.pluck('parent'),
        R.reject(R.isNil)
      )(grouping)
      const coloring = R.pipe(
        R.prop('levels'),
        R.pluck('coloring'),
        R.reject(R.isNil),
        R.values,
        R.mergeAll
      )(grouping)
      groupingMaps.push(
        constructSingleCategoryProperties(
          groupingLabel,
          parent,
          levelCategories,
          coloring
        )
      )
    }, R.toPairs(statGroupings))
    return groupingMaps
  }, [constructSingleCategoryProperties, statGroupings])

  const allCategoryProperties = useMemo(
    () => R.mergeAll(constructAllCategoryProperties()),
    [constructAllCategoryProperties]
  )

  const [chartColors, setChartColors] = useState(allCategoryProperties)

  useEffect(() => {
    setChartColors(allCategoryProperties)
  }, [allCategoryProperties, chartColors])

  const basePath = useMemo(() => ['groupedOutputs', 'groupings'], [])
  const onChangeColor = useCallback(
    (pathTail) => (value) => {
      const path = [...basePath, ...forceArray(pathTail)]
      dispatch(
        mutateLocal({
          path,
          value,
          sync: true,
        })
      )
    },
    [dispatch, basePath]
  )

  const handleChangeSearchText = (event) => {
    setSearchText(event.target.value)
  }

  const visibleGroupings = useMemo(() => {
    const containsSearchText = R.pipe(
      R.toLower,
      R.includes(searchText.toLowerCase())
    )
    const matchedCategories = []
    const findMatchedCategories = (property, label) => {
      const finalCategory = property.lastCategory
      if (
        containsSearchText(finalCategory) &&
        property.level === currentCategoryId
      ) {
        matchedCategories.push(label)
      }
    }
    R.mapObjIndexed(
      (property, label) => findMatchedCategories(property, label),
      chartColors
    )
    return matchedCategories
  }, [searchText, chartColors, currentCategoryId])

  const { handleClose, handleChange: handleChangeRaw } =
    useColorPicker(onChangeColor)

  const handleChange = useCallback(
    (value, colorOutputs, category) => {
      setLocalCategoryColors(R.assoc(category, value))
      const { grouping, level } = chartColors[category]
      const pathTail = [
        grouping,
        'levels',
        level,
        'coloring',
        chartColors[category]['lastCategory'],
      ]
      handleChangeRaw(getColorString(value), colorOutputs, pathTail)
    },
    [handleChangeRaw, chartColors]
  )

  const formattedColor = (value) => {
    if (!matchIsValidColor(value)) return value
    const rawHex = colord(value).toHex()
    return rawHex.length > 7 ? rawHex : `${rawHex}ff`
  }

  return (
    <DataGridModal
      slotProps={{
        paper: {
          sx: {
            width: '750px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          },
        },
      }}
      {...{ label, labelExtra, open, onClose }}
    >
      <Box sx={{ position: 'absolute', top: 30, right: 20 }}>
        <HelpTooltip
          title="Notes on color changes"
          content="Any color changes are applied to ALL relevant charts. Color changes to same-name categories applies to all categories with shared name."
          size={28}
        />
      </Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2, mr: 1.45 }}>
        <TextField
          placeholder="Search final category level"
          label="Search"
          value={searchText}
          onChange={handleChangeSearchText}
          sx={{ width: '65%' }}
        />
        <FormControl fullWidth sx={{ flex: 1 }}>
          <InputLabel id="category-label">{'Category'}</InputLabel>
          <Select
            id="category"
            labelId="category-label"
            label="Category"
            value={currentCategoryName ?? ' '}
            optionsList={R.values(allCategories)}
            onSelect={handleChangeCategory}
          />
        </FormControl>
      </Stack>
      <Box
        display="flex"
        flexDirection="column-reverse"
        gap={2}
        sx={{ overflow: 'auto', scrollbarGutter: 'stable' }}
      >
        {R.isEmpty(visibleGroupings) ? (
          <Typography variant="subtitle1" fontWeight={500}>
            In order to change colors in this modal, there must be two chosen
            groupings of categories. To fix this issue, head to Chart Tools and
            select two groupings under 'Group By'.
          </Typography>
        ) : (
          <>
            {R.map((category) => {
              return (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Paper key={category} sx={{ width: '69%' }}>
                    <Tooltip title={category} placement="top">
                      <Box
                        sx={{
                          color: 'white',
                          alignItems: 'center',
                          justifyContent: 'center',
                          display: 'flex',
                          height: '70px',
                          fontSize: '20px',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        {chartColors[category]['lastCategory']}
                      </Box>
                    </Tooltip>
                  </Paper>
                  <MuiColorInput
                    color="warning"
                    format="hex8"
                    value={formattedColor(localCategoryColors[category])}
                    style={{ width: '35%' }}
                    slotProps={{ input: { style: { borderRadius: 0 } } }}
                    onChange={(value, colors) =>
                      handleChange(value, colors, category)
                    }
                    onClose={handleClose}
                  />
                </Box>
              )
            })(visibleGroupings)}
          </>
        )}
      </Box>
    </DataGridModal>
  )
}

export default ColorChangeModal
