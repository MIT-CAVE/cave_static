import { DataGrid } from '@mui/x-data-grid'
import * as R from 'ramda'

import { formatNumber } from '../../../../utils'

const TableChart = ({ data, labels, columnTypes, numberFormat }) => {
  // labels = R.map(R.replace(/->/, '&rarr;'))(labels)
  const rows = data.map((d, index) =>
    R.converge(
      // `unapply` helps here by processing the input of mergeAll
      // as object arguments instead of an array of objects
      R.unapply(R.mergeAll),
      [
        // id
        R.always({ id: index }),
        // x
        R.pipe(R.prop('x'), R.objOf(0)),
        // y
        R.pipe(R.prop('y'), R.zipObj(R.range(1, R.length(labels)))),
      ]
    )(d)
  )

  const columns = labels.map((label, index) => ({
    headerName: label,
    field: `${index}`,
    minWidth: 150,
    flex: 1,
    valueFormatter: ({ value }) => formatNumber(value, numberFormat),
    ...(columnTypes[index] === 'number' && {
      headerAlign: 'center',
      align: 'center',
    }),
    type: columnTypes[index],
  }))

  return (
    <DataGrid
      sx={{ bgcolor: 'background.paper', minWidth: 0 }}
      {...{ rows, columns }}
      rowsPerPageOptions={[25, 50, 100]}
    />
  )
}

export default TableChart
