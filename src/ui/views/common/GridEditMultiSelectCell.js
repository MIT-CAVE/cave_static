import { Autocomplete, Chip, TextField } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useState } from 'react'

import { getContrastText } from '../../../utils'

const styles = {
  root: {
    '.MuiAutocomplete-inputRoot': { p: '6px' },
    '.MuiAutocomplete-tag': { m: '2px', maxWidth: 'calc(100% - 4px)' },
  },
  getChip: ({ main, contrastText }) => ({
    bgcolor: main,
    '.MuiChip-label, .MuiChip-deleteIcon': {
      color: contrastText,
      opacity: 0.7,
    },
  }),
}

const GridEditMultiSelectCell = ({
  id,
  field,
  placeholder = 'Select values',
  value: defaultValue,
  options: optionsRaw,
  colorByOptions = {},
  readOnly,
  api,
}) => {
  const [value, setValue] = useState(defaultValue)

  const handleChange = useCallback(
    async (event, newValue) => {
      setValue(newValue)
      api.setEditCellValue({ id, field, value: newValue }, event)
    },
    [api, field, id]
  )
  const getOptionLabel = useCallback(
    (option) => R.unless(R.isNil, R.prop('name'))(optionsRaw[option]),
    [optionsRaw]
  )
  const getChipColor = useCallback(
    (option) =>
      R.applySpec({
        main: R.identity,
        contrastText: R.unless(R.isNil, getContrastText),
      })(colorByOptions[option]),
    [colorByOptions]
  )

  return (
    <Autocomplete
      // sx={styles.root}
      multiple
      fullWidth
      disablePortal
      disableClearable
      disableCloseOnSelect
      filterSelectedOptions
      limitTags={0}
      options={R.keys(optionsRaw)}
      noOptionsText="No values"
      {...{ readOnly, value, getOptionLabel }}
      renderOption={(props, option) => {
        const chipColors = getChipColor(option)
        return (
          <li {...props}>
            <Chip
              size="small"
              sx={[
                styles.getChip(chipColors),
                {
                  borderRadius: 1,
                },
              ]}
              label={getOptionLabel(option)}
            />
          </li>
        )
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const chipColors = getChipColor(option)
          return (
            <Chip
              size="small"
              sx={styles.getChip(chipColors)}
              label={getOptionLabel(option)}
              {...getTagProps({ index })}
            />
          )
        })
      }
      renderInput={(params) => <TextField {...{ placeholder, ...params }} />}
      onChange={handleChange}
    />
  )
}

const GridMultiSelectCell = (props) => (
  <GridEditMultiSelectCell readOnly placeholder="Selected" {...props} />
)

export { GridMultiSelectCell }
export default GridEditMultiSelectCell
