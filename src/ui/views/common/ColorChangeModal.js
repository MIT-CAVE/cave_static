import {
  TextField,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
} from '@mui/material'
import { colord } from 'colord'
import { MuiColorInput, matchIsValidColor } from 'mui-color-input'
import * as R from 'ramda'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'

import { DataGridModal } from './BaseModal'

import { selectStatGroupings } from '../../../data/selectors'
import { colorGen } from '../../../utils/ColorGen'
import { useMutateStateWithSync } from '../../../utils/hooks'
import { useColorPicker } from '../../compound/ColorPicker'

import { Select } from '../../compound'

import { forceArray } from '../../../utils'

const ColorChangeModal = ({ open, label, labelExtra, onClose, chartObj }) => {
  const [searchText, setSearchText] = useState('')
  const [currentCategory, setCurrentCategory] = useState(
    R.prop('groupingLevel')(chartObj)[1]
  )

  const statGroupings = useSelector(selectStatGroupings)

  const allCategories = useMemo(
    () =>
      R.flatten(
        R.values(R.map(R.pipe(R.prop('levels'), R.keys), statGroupings))
      ),
    [statGroupings]
  )

  const handleChangeCategory = (value) => {
    setCurrentCategory(value)
  }

  const createHandleChangeColor = useMutateStateWithSync(
    (coloringPath, category, color) => ({
      path: [
        'groupedOutputs',
        'groupings',
        ...coloringPath,
        chartColors[category]['lastCategory'],
      ],
      value: color,
    }),
    []
  )

  const changeColor = useCallback(
    (grouping, level, category, color) => {
      const coloringPath = [grouping, 'levels', level, 'coloring']
      createHandleChangeColor(coloringPath, category, color)
    },
    [createHandleChangeColor]
  )

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
          result[label] = {
            grouping: grouping,
            level: level,
            lastCategory: category,
            color:
              category in coloring
                ? colord(coloring[category]).toHslString()
                : colorGen(label),
          }
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
    if (R.isEmpty(chartColors) && !R.isEmpty(allCategoryProperties)) {
      setChartColors(allCategoryProperties)
    }
  }, [allCategoryProperties, chartColors])

  const onChangeColor = useCallback(
    (pathTail) => (value) => {
      const category = forceArray(pathTail)[1]
      const rgbValue = colord(value).toRgbString()
      const lastCategory = chartColors[category].lastCategory

      // Update categories with same lastCategory as the current category being changed
      Object.keys(chartColors).forEach((key) => {
        if (chartColors[key].lastCategory === lastCategory) {
          setChartColors((prev) => ({
            ...prev,
            [key]: {
              ...prev[key],
              color: rgbValue,
            },
          }))
          const { grouping, level } = chartColors[key]
          changeColor(grouping, level, category, rgbValue)
        }
      })
    },
    [changeColor, chartColors]
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
        property.level === currentCategory
      ) {
        matchedCategories.push(label)
      }
    }
    R.mapObjIndexed(
      (property, label) => findMatchedCategories(property, label),
      chartColors
    )
    return matchedCategories
  }, [searchText, chartColors, currentCategory])

  const { handleClose, handleChange: handleChangeRaw } =
    useColorPicker(onChangeColor)

  const handleChange = useCallback(
    (value, colorOutputs, category) => {
      const pathTail =
        category === 'null' // Updating fallback color?
          ? ['fallback', 'color']
          : ['options', category, 'color']
      handleChangeRaw(value, colorOutputs, pathTail)
    },
    [handleChangeRaw]
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
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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
            value={currentCategory}
            optionsList={allCategories}
            onSelect={handleChangeCategory}
          />
        </FormControl>
      </Stack>
      <Box
        display="flex"
        flexDirection="column-reverse"
        gap={2}
        sx={{ overflow: 'auto' }}
      >
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
              <Paper key={category} sx={{ width: '65%' }}>
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
                    {allCategoryProperties[category]['lastCategory']}
                  </Box>
                </Tooltip>
              </Paper>
              <MuiColorInput
                color="warning"
                format="hex8"
                value={formattedColor(chartColors[category]['color'])}
                style={{ width: '33%' }}
                slotProps={{ input: { style: { borderRadius: 0 } } }}
                onChange={(value, colors) =>
                  handleChange(value, colors, category)
                }
                onClose={handleClose}
              />
            </Box>
          )
        })(visibleGroupings)}
      </Box>
    </DataGridModal>
  )
}

export default ColorChangeModal
