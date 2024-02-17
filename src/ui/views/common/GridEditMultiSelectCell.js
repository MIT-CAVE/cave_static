import { Autocomplete, TextField } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useState } from 'react'

const GridEditMultiSelectCell = ({
  id,
  field,
  placeholder = 'Select values',
  options: optionsRaw,
  value: defaultValue,
  readOnly,
  api,
}) => {
  const [value, setValue] = useState(defaultValue)

  const handleChange = useCallback(
    async (event, newValue) => {
      api.setEditCellValue({ id, field, value: newValue })
      setValue(newValue)
    },
    [api, field, id]
  )
  const getOptionLabel = useCallback(
    (option) => R.unless(R.isNil, R.prop('name'))(optionsRaw[option]),
    [optionsRaw]
  )

  return (
    <Autocomplete
      multiple
      fullWidth
      disablePortal
      disableClearable
      disableCloseOnSelect
      filterSelectedOptions
      limitTags={0}
      options={R.keys(optionsRaw)}
      {...{ readOnly, value, getOptionLabel }}
      // renderOption={(props, option, { selected }) => (
      //   <li {...props}>
      //     <Checkbox
      //       sx={{ mr: 1 }}
      //       icon={<MdCheckBoxOutlineBlank />}
      //       checkedIcon={<MdCheckBox />}
      //       checked={selected}
      //     />
      //     {getOptionLabel(option)}
      //   </li>
      // )}
      renderInput={(params) => <TextField {...{ placeholder, ...params }} />}
      onChange={handleChange}
    />
  )
}

const GridMultiSelectCell = (props) => (
  <GridEditMultiSelectCell readOnly placeholder="" {...props} />
)

export { GridMultiSelectCell }
export default GridEditMultiSelectCell
