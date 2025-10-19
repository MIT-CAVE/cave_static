import { TextField, Box, Button, Paper } from '@mui/material'
import { colord } from 'colord'
import { MuiColorInput, matchIsValidColor } from 'mui-color-input'
import * as R from 'ramda'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'

import { DataGridModal } from './BaseModal'

import { selectStatGroupings } from '../../../data/selectors'
import { colorGen } from '../../../utils/ColorGen'
import { useColorPicker } from '../../compound/ColorPicker'

import { forceArray, getContrastText } from '../../../utils'

const ColorChangeModal = ({
  open,
  label,
  labelExtra,
  onClose,
  chartObj,
  index,
  path,
}) => {
  const [searchText, setSearchText] = useState('')

  const statGroupings = useSelector(selectStatGroupings)

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
    (parents, levelCategories) => {
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
            lastCategory: category,
            color: colorGen(label),
          }
        })
      }
      return result
    },
    [getCategoryLabel]
  )

  const constructAllCategoryProperties = useCallback(() => {
    const groupingMaps = []
    for (const grouping of R.values(statGroupings)) {
      const levelCategories = R.pipe(R.prop('data'), R.omit(['id']))(grouping)
      const parent = R.pipe(
        R.prop('levels'),
        R.pluck('parent'),
        R.reject(R.isNil)
      )(grouping)
      groupingMaps.push(
        constructSingleCategoryProperties(parent, levelCategories)
      )
    }
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
      setChartColors((prev) => ({
        ...prev,
        [forceArray(pathTail)[1]]: { color: value },
      }))
    },
    []
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
      if (containsSearchText(finalCategory)) {
        matchedCategories.push(label)
      }
    }
    R.mapObjIndexed(
      (property, label) => findMatchedCategories(property, label),
      allCategoryProperties
    )
    return matchedCategories
  }, [searchText, allCategoryProperties])

  const {
    colorPickerProps,
    showColorPicker,
    handleOpen,
    handleClose,
    handleChange: handleChangeRaw,
  } = useColorPicker(onChangeColor)

  const handleChange = useCallback(
    (value, colorOutputs) => {
      const option = colorPickerProps.key
      const pathTail =
        option === 'null' // Updating fallback color?
          ? ['fallback', 'color']
          : ['options', option, 'color']
      handleChangeRaw(value, colorOutputs, pathTail)
    },
    [handleChangeRaw, colorPickerProps.key]
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
            width: '400px',
            height: '900px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          },
        },
      }}
      {...{ label, labelExtra, open, onClose }}
    >
      <TextField
        placeholder="Search final category level"
        label="Search"
        value={searchText}
        onChange={handleChangeSearchText}
      />
      <Box
        display="flex"
        flexDirection="column-reverse"
        gap={2}
        sx={{ overflow: 'auto' }}
      >
        {R.map((category) => {
          return (
            <Paper key={category}>
              <Button
                fullWidth
                sx={{
                  backgroundColor: formattedColor(
                    chartColors[category]['color']
                  ),
                  color: getContrastText(chartColors[category]['color']),
                }}
                color="greyscale"
                variant="outlined"
                onClick={handleOpen(
                  category,
                  allCategoryProperties[category]['color']
                )}
              >
                {allCategoryProperties[category]['lastCategory']}
              </Button>
              {showColorPicker && colorPickerProps.key === category && (
                <MuiColorInput
                  fullWidth
                  focused
                  color="warning"
                  format="hex8"
                  value={formattedColor(colorPickerProps.value)}
                  style={{ marginTop: '20px', flex: '1 1 auto' }}
                  slotProps={{ input: { style: { borderRadius: 0 } } }}
                  onChange={handleChange}
                  onClose={handleClose}
                />
              )}
            </Paper>
          )
        })(visibleGroupings)}
      </Box>
    </DataGridModal>
  )
}

export default ColorChangeModal
