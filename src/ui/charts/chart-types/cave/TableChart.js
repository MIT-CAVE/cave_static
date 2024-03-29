import { DataGrid } from '@mui/x-data-grid'
import * as R from 'ramda'

import { NumberFormat } from '../../../../utils'
import { FlexibleContainer } from '../echarts'

const TableChart = ({ data, columnProps, numberFormat }) => {
  // Convert chart object to nested arrays of values
  const convertToList = (data, currentRow) =>
    R.map((d) =>
      R.has('children', d)
        ? convertToList(
            R.prop('children', d),
            R.append(R.prop('name', d), currentRow)
          )
        : R.concat(R.append(R.prop('name', d), currentRow), R.prop('value', d))
    )(data)

  const rawList = convertToList(data, [])
  const fields = R.pluck('field')(columnProps)
  const rows = R.pipe(
    R.flatten,
    R.splitEvery(R.length(columnProps)),
    R.addIndex(R.map)((row, index) =>
      R.pipe(R.zipObj(fields), R.assoc('id', index))(row)
    )
  )(rawList)

  const columns = columnProps.map(({ label, field, type }) => ({
    headerName: label,
    type,
    field,
    minWidth: 150,
    flex: 1,
    ...(type === 'number' && {
      headerAlign: 'center',
      align: 'center',
      valueFormatter: ({ value, field }) =>
        NumberFormat.format(value, numberFormat[field]),
    }),
  }))

  return (
    <FlexibleContainer>
      <DataGrid
        {...{ rows, columns }}
        rowsPerPageOptions={[25, 50, 100]}
        sx={{
          minWidth: 0,
          bgcolor: 'background.paper',
        }}
      />
    </FlexibleContainer>
  )
}

export default TableChart
