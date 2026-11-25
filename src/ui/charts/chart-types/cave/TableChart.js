import {
  Box,
  Button,
  ButtonGroup,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import * as R from 'ramda'
import { memo, useContext, useMemo, useState } from 'react'
import { MdArrowDropDown } from 'react-icons/md'
import { TbCsv, TbJson, TbMarkdown } from 'react-icons/tb'

import { NumberFormat } from '../../../../utils'
import {
  TABLE_EXPORT_FORMATS,
  downloadTableExport,
} from '../../../../utils/tableExport'
import RichLabel from '../../../compound/RichLabel'
import { FlexibleContainer } from '../echarts'
import ChartContext, { useValueDisplayName } from '../echarts/ChartContext'
import ChartTitle from '../echarts/ChartTitle'

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

// The height of the footer row of the `DataGrid` (not configurable in MUI X)
const FOOTER_HEIGHT = 52

const FORMAT_ICONS = {
  csv: TbCsv,
  json: TbJson,
  md: TbMarkdown,
}

const styles = {
  formatButton: {
    px: 1,
    '& .MuiButton-endIcon': { ml: 0 },
  },
  // Frames the title as a header of the grid below it
  title: {
    // mb: '1px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 1,
  },
}

const TableChart = ({ data, labelProps, numberFormat = {} }) => {
  const { title, maximized } = useContext(ChartContext)
  // No frame (border and rounded corners) on the title and the grid, so that
  // they are as big as the charts (flat) when they are inside the padding of the
  // card, except for the top border of the grid when there is a title above it.
  // Their frame is kept when the chart is maximized.
  const unframed = !maximized && { borderWidth: 0, borderRadius: 0 }
  const getDisplayName = useValueDisplayName()
  const [downloadFormat, setDownloadFormat] = useState('csv')
  const [formatMenuAnchor, setFormatMenuAnchor] = useState(null)
  const FormatIcon = FORMAT_ICONS[downloadFormat]
  const downloadExtension =
    TABLE_EXPORT_FORMATS[downloadFormat].extension.toUpperCase()
  const rawList = useMemo(() => flattenChartTree(data), [data])
  const fields = useMemo(() => R.pluck('key')(labelProps), [labelProps])
  const types = useMemo(() => R.pluck('type')(labelProps), [labelProps])
  const rows = useMemo(() => {
    const numFields = fields.length
    const result = new Array(rawList.length)
    for (let i = 0; i < rawList.length; i++) {
      const rawRow = rawList[i]
      const rowObj = { id: i }
      for (let j = 0; j < numFields; j++) {
        rowObj[fields[j]] =
          types[j] === 'number' ? rawRow[j] : getDisplayName(rawRow[j])
      }
      result[i] = rowObj
    }
    return result
  }, [fields, types, rawList, getDisplayName])

  // Downloads the raw values, as they are in the data
  const download = (format) =>
    downloadTableExport({ format, columns: labelProps, rows: rawList, title })

  const multiNumberFormat = useMemo(
    () => R.pipe(R.values, R.propOr([], 0), R.is(Object))(numberFormat),
    [numberFormat]
  )

  const columns = useMemo(
    () =>
      labelProps.map(({ label, richLabel, key: field, type }) => ({
        // The plain text is used for the tooltip, the column menu and the CSV
        headerName: label,
        // `richLabel` is only set when some part of the header is rich text
        ...(richLabel != null && {
          renderHeader: () => <RichLabel text={richLabel} rich />,
        }),
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
              (multiNumberFormat ? numberFormat?.[field] : numberFormat) ?? {}
            ),
        }),
      })),
    [labelProps, multiNumberFormat, numberFormat]
  )

  return (
    <>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <ChartTitle
          sx={{
            ...styles.title,
            ...unframed,
          }}
        />
        <FlexibleContainer>
          <DataGrid
            {...{ rows, columns }}
            pageSizeOptions={[25, 50, 100]}
            sx={{
              minWidth: 0,
              height: '100%',
              bgcolor: 'background.paper',
              ...unframed,
              ...(!maximized && title && { borderTopWidth: 1 }),
            }}
          />
        </FlexibleContainer>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: maximized ? 1 : 0, // Clears the border of the `DataGrid`
          left: 0,
          height: FOOTER_HEIGHT,
          px: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <ButtonGroup variant="contained">
          <Button
            aria-label={`Download ${downloadExtension}`}
            onClick={() => download(downloadFormat)}
          >
            Download
          </Button>
          <Button
            aria-label={`Download format: ${downloadExtension}`}
            aria-haspopup="menu"
            aria-expanded={Boolean(formatMenuAnchor)}
            endIcon={<MdArrowDropDown />}
            sx={styles.formatButton}
            onClick={(event) => setFormatMenuAnchor(event.currentTarget)}
          >
            <FormatIcon size={20} />
          </Button>
        </ButtonGroup>
        <Menu
          anchorEl={formatMenuAnchor}
          open={Boolean(formatMenuAnchor)}
          onClose={() => setFormatMenuAnchor(null)}
        >
          {Object.entries(TABLE_EXPORT_FORMATS).map(([format, { label }]) => {
            const Icon = FORMAT_ICONS[format]
            return (
              <MenuItem
                key={format}
                selected={format === downloadFormat}
                onClick={() => {
                  setDownloadFormat(format)
                  setFormatMenuAnchor(null)
                }}
              >
                <ListItemIcon>
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText>{label}</ListItemText>
              </MenuItem>
            )
          })}
        </Menu>
      </Box>
    </>
  )
}

export default memo(TableChart)
