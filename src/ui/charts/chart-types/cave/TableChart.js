import { DataGrid } from '@mui/x-data-grid'
import * as R from 'ramda'

import { NumberFormat } from '../../../../utils'
import { FlexibleContainer } from '../echarts'

const TableChart = ({ data, labelProps, numberFormat }) => {
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
  const fields = R.pluck('key')(labelProps)
  const rows = R.pipe(
    R.flatten,
    R.splitEvery(R.length(labelProps)),
    R.addIndex(R.map)((row, index) =>
      R.pipe(R.zipObj(fields), R.assoc('id', index))(row)
    )
  )(rawList)

  const multiNumberFormat = R.pipe(
    R.values,
    R.propOr([], 0),
    R.is(Object)
  )(numberFormat)

  const columns = labelProps.map(({ label, key: field, type }) => ({
    headerName: label,
    type,
    field,
    minWidth: 150,
    flex: 1,
    ...(type === 'number' && {
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) =>
        NumberFormat.format(
          value,
          multiNumberFormat ? numberFormat[field] : numberFormat
        ),
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
