import { Box, Button } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import * as R from 'ramda'
import { memo, useMemo } from 'react'

import { NumberFormat } from '../../../../utils'
import { FlexibleContainer } from '../echarts'

// Convert chart object to flat list of row arrays
const flattenChartTree = (data) => {
  const result = []
  const traverse = (nodes, currentPath = []) => {
    if (!Array.isArray(nodes)) return
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node == null) continue
      const nextPath = currentPath.concat(node.name)
      if (
        node.children &&
        Array.isArray(node.children) &&
        node.children.length > 0
      ) {
        traverse(node.children, nextPath)
      } else {
        const row = nextPath.slice()
        if (Array.isArray(node.value)) {
          for (let j = 0; j < node.value.length; j++) {
            row.push(node.value[j])
          }
        } else if (node.value !== undefined) {
          row.push(node.value)
        }
        result.push(row)
      }
    }
  }
  traverse(data, [])
  return result
}

const TableChart = ({ data, labelProps, numberFormat }) => {
  const rawList = useMemo(() => flattenChartTree(data), [data])
  const fields = useMemo(() => R.pluck('key')(labelProps), [labelProps])
  const rows = useMemo(() => {
    const numFields = fields.length
    const result = new Array(rawList.length)
    for (let i = 0; i < rawList.length; i++) {
      const rawRow = rawList[i]
      const rowObj = { id: i }
      for (let j = 0; j < numFields; j++) {
        rowObj[fields[j]] = rawRow[j]
      }
      result[i] = rowObj
    }
    return result
  }, [fields, rawList])

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
            const headerRow = R.pluck('label', labelProps)
            const csvRows = [headerRow, ...rawList]
            const csv = csvRows.map((row) => row.join(',')).join('\n')
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
