import { GridEditSingleSelectCell, useGridApiContext } from '@mui/x-data-grid'
import { useCallback } from 'react'

const EnhancedEditSingleSelect = ({ id, fieldsToClear, ...props }) => {
  const apiRef = useGridApiContext()
  const handleValueChange = useCallback(async () => {
    for (let field of fieldsToClear) {
      await apiRef.current.setEditCellValue({
        id,
        field,
        value: '',
      })
    }
  }, [apiRef, fieldsToClear, id])

  return (
    <GridEditSingleSelectCell
      {...{ id, ...props }}
      onValueChange={handleValueChange}
    />
  )
}

export default EnhancedEditSingleSelect
