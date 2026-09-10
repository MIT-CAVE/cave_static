import { Box, Button } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import * as R from 'ramda'
import { memo, useMemo } from 'react'

import { NumberFormat } from '../../../../utils'
import { FlexibleContainer } from '../echarts'

// Convert chart object to nested arrays of values
const convertToList = (data, currentRow = []) =>
  R.map((d) =>
    R.has('children', d)
      ? convertToList(
          R.prop('children', d),
          R.append(R.prop('name', d), currentRow)
        )
      : R.concat(R.append(R.prop('name', d), currentRow), R.prop('value', d))
  )(data)

const TableChart = ({ data, labelProps, numberFormat }) => {
  const rawList = useMemo(() => convertToList(data), [data])
  const fields = useMemo(() => R.pluck('key')(labelProps), [labelProps])
  const rows = useMemo(
    () =>
      R.pipe(
        R.flatten,
        R.splitEvery(R.length(labelProps)),
        R.addIndex(R.map)((row, index) =>
          R.pipe(R.zipObj(fields), R.assoc('id', index))(row)
        )
      )(rawList),
    [fields, labelProps, rawList]
  )

  const multiNumberFormat = useMemo(
    () => R.pipe(R.values, R.propOr([], 0), R.is(Object))(numberFormat),
    [numberFormat]
  )

  const columns = useMemo(
    () =>
      labelProps.map(({ label, key: field, type }) => ({
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
      })),
    [labelProps, multiNumberFormat, numberFormat]
  )

  return (
    <>
      <FlexibleContainer>
        <DataGrid
          {...{ rows, columns }}
          pageSizeOptions={[25, 50, 100]}
          sx={{
            minWidth: 0,
            bgcolor: 'background.paper',
          }}
        />
      </FlexibleContainer>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          p: 1,
          pb: 2,
          pt: 2,
        }}
      >
        <Button
          variant="contained"
          sx={{}}
          onClick={() => {
            const csv = R.concat(
              [R.pluck('label', labelProps)],
              R.unnest(rawList)
            ).join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'data.csv')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }}
        >
          Download CSV
        </Button>
      </Box>
    </>
  )
}

export default memo(TableChart)
