import { DataGrid } from '@mui/x-data-grid'
import * as R from 'ramda'

import { NumberFormat } from '../../../../utils'
import { FlexibleContainer } from '../echarts'

const TableChart = ({ data, labels, columnTypes, numberFormat }) => {
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

  const rows = R.pipe(
    R.flatten,
    R.splitEvery(R.length(labels)),
    R.addIndex(R.map)(R.pipe(R.flip(R.assoc('id'))))
  )(convertToList(data, []))

  const columns = labels.map((label, index) => ({
    headerName: label,
    field: `${index}`,
    minWidth: 150,
    flex: 1,
    valueFormatter: ({ value }) =>
      typeof value === 'number'
        ? NumberFormat.format(value, numberFormat)
        : null,
    ...(columnTypes[index] === 'number' && {
      headerAlign: 'center',
      align: 'center',
    }),
    type: columnTypes[index],
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
