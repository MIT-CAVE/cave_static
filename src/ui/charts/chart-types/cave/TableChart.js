import { DataGrid } from '@mui/x-data-grid'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { NumberFormat } from '../../../../utils'

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
    valueFormatter: ({ value }) => NumberFormat.format(value, numberFormat),
    ...(columnTypes[index] === 'number' && {
      headerAlign: 'center',
      align: 'center',
    }),
    type: columnTypes[index],
  }))

  return (
    <div style={{ flex: '1 1 auto' }}>
      <AutoSizer>
        {({ height, width }) => (
          <DataGrid
            sx={{
              height,
              width,
              minWidth: 0,
              bgcolor: 'background.paper',
            }}
            {...{ rows, columns }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        )}
      </AutoSizer>
    </div>
  )
}

export default TableChart
