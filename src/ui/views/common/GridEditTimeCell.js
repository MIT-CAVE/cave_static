import { InputBase } from '@mui/material'
// import { GridEditDateCell } from '@mui/x-data-grid'
import { useCallback, useState } from 'react'

const GridEditTimeCell = ({ id, field, value: defaultValue, api }) => {
  const [value, setValue] = useState(defaultValue)

  const handleChange = useCallback(
    async (event) => {
      const newValue = event.target.value
      setValue(newValue)
      api.setEditCellValue({ id, field, value: newValue }, event)
    },
    [api, field, id]
  )

  return (
    <InputBase
      {...{ value }}
      inputProps={{
        type: 'time', // Set the native input type
        step: 1,
        max: '23:59:59',
        style: { colorScheme: 'dark', textAlign: 'center' },
      }}
      onChange={handleChange}
    />
    // BUG: The time input field is shown empty
    // <GridEditDateCell
    //   {...{ value }}
    //   colDef={{}} // Required by MUI
    //   inputProps={{
    //     type: 'time', // Set the native input type
    //     step: 1,
    //     max: '23:59:59',
    //     style: { colorScheme: 'dark', textAlign: 'center' },
    //   }}
    //   onChange={handleChange}
    // />
  )
}

export default GridEditTimeCell
