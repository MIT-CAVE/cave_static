import { TextField, Box, Button, Paper } from '@mui/material'
import { colord } from 'colord'
import { MuiColorInput, matchIsValidColor } from 'mui-color-input'
import * as R from 'ramda'
import { useState, useMemo, useEffect, useCallback } from 'react'

import { DataGridModal } from './BaseModal'

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

  const testCategories = useMemo(
    () => [
      'Ontario',
      'Texas',
      // 'California',
      // 'New York',
      // 'Florida',
      // 'Illinois',
      // 'Washington',
      // 'Arizona',
      // 'Colorado',
      // 'Nevada',
      // 'Utah',
      // 'New Mexico',
      // 'Alaska',
      // 'Hawaii',
      // 'Maine',
      // 'Vermont',
      // 'New Hampshire',
      // 'Massachusetts',
      // 'Rhode Island',
      // 'Connecticut',
      // 'New Jersey',
      // 'Pennsylvania',
      // 'Delaware',
      // 'Maryland',
      // 'Virginia',
      // 'North Carolina',
      // 'South Carolina',
      // 'Georgia',
      // 'Alabama',
      // 'Tennessee',
      // 'Kentucky',
      // 'Ohio',
      // 'Michigan',
      // 'Indiana',
      // 'Wisconsin',
      // 'Minnesota',
      // 'Iowa',
      // 'Missouri',
      // 'Arkansas',
      // 'Louisiana',
      // 'Mississippi',
      // 'North Dakota',
      // 'South Dakota',
      // 'Nebraska',
      // 'Kansas',
      // 'Oklahoma',
      // 'Texas',
    ],
    []
  )

  const testColors = ['hsl(0, 100%, 75%)', 'hsl(236, 100%, 75%)']

  const categoryToColor = R.zipObj(testCategories, testColors)

  const [chartColors, setChartColors] = useState(categoryToColor)

  useEffect(() => {
    if (R.isEmpty(chartColors) && !R.isEmpty(categoryToColor)) {
      setChartColors(categoryToColor)
    }
  }, [categoryToColor, chartColors])

  const onChangeColor = useCallback(
    (pathTail) => (value) => {
      setChartColors((prev) => ({
        ...prev,
        [forceArray(pathTail)[1]]: value,
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
    const findMatchedCategories = (cat) => {
      if (containsSearchText(cat)) {
        matchedCategories.push(cat)
      }
    }

    R.forEach(findMatchedCategories, testCategories)
    return matchedCategories
  }, [searchText, testCategories])

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
                  backgroundColor: formattedColor(chartColors[category]),
                  color: getContrastText(chartColors[category]),
                }}
                color="greyscale"
                variant="outlined"
                onClick={handleOpen(category, chartColors[category])}
              >
                {category}
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
