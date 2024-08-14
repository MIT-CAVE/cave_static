import {
  Button,
  Paper,
  Stack,
  Select,
  MenuItem,
  TextField,
} from '@mui/material'
import { darken, lighten, styled } from '@mui/material/styles'
import {
  DataGrid,
  GridActionsCellItem,
  GridBooleanCell,
  GridRowEditStopReasons,
} from '@mui/x-data-grid'
import dayjs from 'dayjs'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'
import { BiBracket } from 'react-icons/bi'
import {
  MdAddCircleOutline,
  MdCheck,
  MdDelete,
  MdEdit,
  MdRestore,
} from 'react-icons/md'
import { useSelector } from 'react-redux'

import GridEditMultiSelectCell, {
  GridMultiSelectCell,
} from './GridEditMultiSelectCell'

import { selectNumberFormatPropsFn } from '../../../data/selectors'

import { OverflowText } from '../../compound'

import { NumberFormat, renameKeys } from '../../../utils'

const StyledDataGrid = styled(DataGrid)(({ theme, maxDepth }) => {
  return R.pipe(
    R.range(0),
    R.map((i) => {
      const backgroundColor = darken(theme.palette.background.paper, i * 0.1)
      const hoverColor = lighten(backgroundColor, 0.1)
      return {
        [`& .row-color-${i}`]: {
          backgroundColor: backgroundColor,
          '&.Mui-selected': {
            backgroundColor: backgroundColor,
          },
          '&.Mui-selected:hover': {
            backgroundColor: hoverColor,
          },
        },
      }
    }),
    R.mergeAll
  )(maxDepth + 1)
})

const styles = {
  addBtn: {
    justifyContent: 'start',
    pl: 2,
    py: 2,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    my: 2,
    textAlign: 'center',
    overflow: 'auto',
  },
  emptyContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: 'rgba(18, 18, 18, 0.38)',
    height: '100%',
  },
}

const RELATION_COL_BOOL_VALUE_OPTS = [
  {
    value: 'eq',
    label: 'is',
  },
]
const RELATION_COL_STR_VALUE_OPTS = [
  {
    value: 'eq',
    label: 'is',
  },
]
const RELATION_COL_NUM_VALUE_OPTS = [
  {
    value: 'lt',
    label: '<',
  },
  {
    value: 'lte',
    label: '<=',
  },
  {
    value: 'eq',
    label: '=',
  },
  {
    value: 'gt',
    label: '>',
  },
  {
    value: 'gte',
    label: '>=',
  },
]
const RELATION_COL_SINGLE_SELECT_VALUE_OPTS = [
  {
    value: 'eq',
    label: 'is',
  },
]
const RELATION_COL_MULTI_SELECT_VALUE_OPTS = [
  {
    value: 'inc',
    label: 'is any of',
  },
  {
    value: 'exc',
    label: 'excludes',
  },
]
const RELATION_COL_DATE_VALUE_OPTS = [
  {
    value: 'eq',
    label: 'is',
  },
]

const getRelationValueOptsByType = R.cond([
  [R.equals('string'), R.always(RELATION_COL_STR_VALUE_OPTS)],
  [R.equals('number'), R.always(RELATION_COL_NUM_VALUE_OPTS)],
  [R.equals('boolean'), R.always(RELATION_COL_BOOL_VALUE_OPTS)],
  [R.equals('singleSelect'), R.always(RELATION_COL_SINGLE_SELECT_VALUE_OPTS)],
  [R.equals('multiSelect'), R.always(RELATION_COL_MULTI_SELECT_VALUE_OPTS)],
  [
    R.flip(R.includes)(['date', 'time', 'dateTime']),
    R.always(RELATION_COL_DATE_VALUE_OPTS),
  ],
])

// TODO: This should also depend on the Relation chosen
const getValueCellType = R.curry((type, variant) =>
  R.cond([
    [R.equals('toggle'), R.always('boolean')],
    [R.equals('text'), R.always('string')],
    [R.equals('num'), R.always('number')],
    [R.equals('selector'), R.always('multiSelect')],
    [
      R.equals('date'),
      R.always(
        variant === 'datetime' ? 'dateTime' : variant // 'date'|'time'
      ),
    ],
    [R.T, R.always('string')],
  ])(type)
)

const getDateFormat = R.cond([
  [R.equals('date'), R.always('MM-DD-YYYY')],
  [R.equals('time'), R.always('hh:mm:ss A')],
  [R.equals('dateTime'), R.always('MM-DD-YYYY hh:mm:ss A')],
])

const GridFilter = ({
  defaultFilters,
  sourceHeaderName = 'Source',
  filterables,
  filterableExtraProps,
  onSave,
}) => {
  const [idCount, setIdCount] = useState(1)
  const [groupIdCount, setGroupIdCount] = useState(1)
  const [rows, setRows] = useState(defaultFilters)
  const [initialRows, setInitialRows] = useState(defaultFilters)

  const getNumberFormat = useSelector(selectNumberFormatPropsFn)

  const sourceValueOpts = useMemo(
    () =>
      R.pipe(
        R.mapObjIndexed((val, key) => ({ label: val.name, value: key })),
        R.values
      )(filterables),
    [filterables]
  )
  const sourceValueTypes = useMemo(
    () =>
      R.map(R.pipe(R.props(['type', 'variant']), R.apply(getValueCellType)))(
        filterables
      ),
    [filterables]
  )
  const numberFormatProps = useMemo(
    () => R.map(getNumberFormat)(filterables),
    [filterables, getNumberFormat]
  )

  const handleAddRow = useCallback(
    (groupId, depth) => {
      const index = rows.findIndex((row) => row.groupId === groupId)
      const newRow = {
        id: idCount,
        type: 'rule',
        parentGroupId: groupId,
        source: '',
        relation: '',
        value: '',
        depth: depth,
        edit: true,
      }
      const newRows = [
        ...rows.slice(0, index + 1),
        newRow,
        ...rows.slice(index + 1),
      ]
      setRows(newRows)
      setIdCount(idCount + 1)
    },
    [idCount, rows]
  )

  const handleAddGroup = useCallback(
    (groupId, depth) => {
      const index = rows.findIndex((row) => row.groupId === groupId)
      const newRow = {
        id: idCount,
        type: 'group',
        groupId: groupIdCount,
        parentGroupId: groupId,
        logic: 'and',
        depth: depth + 1,
        edit: true,
      }
      const newRows = [
        ...rows.slice(0, index + 1),
        newRow,
        ...rows.slice(index + 1),
      ]
      setRows(newRows)
      setIdCount(idCount + 1)
      setGroupIdCount(groupIdCount + 1)
    },
    [groupIdCount, idCount, rows]
  )

  const deleteRow = useCallback((id) => {
    setRows(R.reject(R.propEq(id, 'id')))
  }, [])

  const handleDeleteRow = useCallback(
    (id) => () => {
      deleteRow(id)
    },
    [deleteRow]
  )

  const handleDeleteGroup = useCallback(
    (id, groupId) => {
      const rowsToDelete = [id]

      const deleteChildren = (groupId) => {
        const children = rows.filter((row) => row.parentGroupId === groupId)
        for (const child of children) {
          rowsToDelete.push(child.id)
          if (child.type === 'group') {
            deleteChildren(child.groupId)
          }
        }
      }

      deleteChildren(groupId)
      R.forEach(deleteRow, rowsToDelete)
    },
    [deleteRow, rows]
  )

  const handleRowEditStop = ({ reason }, event) => {
    if (reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true
    }
  }

  const canCancel = useMemo(() => {
    return rows.some((row) => row.edit)
  }, [rows])

  const canSaveAll = useMemo(() => {
    const removeEditProp = R.map(R.dissoc('edit'))
    const cleanedRows = removeEditProp(rows)
    const cleanedInitialRows = removeEditProp(initialRows)
    const unsavedChanges = !R.equals(cleanedRows)(cleanedInitialRows)
    const hasBlanks = rows
      .filter((row) => row.type === 'rule')
      .some(
        (row) => row.source === '' || row.relation === '' || row.value === ''
      )
    return unsavedChanges && !hasBlanks
  }, [initialRows, rows])

  const handleClickSaveAll = useCallback(
    (newRows) => {
      const newFilters = R.map(
        R.pipe(
          R.dissoc('id'),
          R.dissoc('edit'),
          R.dissoc('depth'),
          renameKeys({ relation: 'option', source: 'prop' })
        )
      )(newRows)
      onSave(newFilters)
    },
    [onSave]
  )

  const handleCellDoubleClick = (params, event) => {
    event.defaultMuiPrevented = true
  }

  const handleLogicChange = (id, event) => {
    const newLogic = event.target.value
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, logic: newLogic } : row))
    )
  }

  const handleSourceChange = (id, event) => {
    const newSource = event.target.value
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, source: newSource } : row
      )
    )
  }

  const handleRelationChange = (id, event) => {
    const newRelation = event.target.value
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, relation: newRelation } : row
      )
    )
  }

  const handleValueChange = (id, event) => {
    const newValue = event.target.value
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, value: newValue } : row))
    )
  }

  const columns = useMemo(
    () => [
      {
        field: 'logic',
        headerName: 'Logic',
        headerAlign: 'center',
        display: 'flex',
        width: 90,
        editable: false,
        renderCell: ({ row }) =>
          row.type === 'group' ? (
            row.edit ? (
              <Select
                value={row.logic}
                onChange={(event) => handleLogicChange(row.id, event)}
              >
                <MenuItem value={'and'}>AND</MenuItem>
                <MenuItem value={'or'}>OR</MenuItem>
              </Select>
            ) : (
              row.logic.toUpperCase()
            )
          ) : (
            ''
          ),
      },
      {
        field: 'source',
        headerName: sourceHeaderName,
        type: 'singleSelect',
        display: 'flex',
        flex: 1,
        editable: false,
        renderCell: ({ row }) => {
          return row.type === 'rule' ? (
            row.edit ? (
              <Select
                value={row.source}
                onChange={(event) => handleSourceChange(row.id, event)}
                sx={{ flex: 1 }}
              >
                {sourceValueOpts.map((option, index) => (
                  <MenuItem key={index} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <OverflowText
                text={
                  sourceValueOpts.find((opts) => opts.value === row.source)
                    .label
                }
              />
            )
          ) : (
            ''
          )
        },
      },
      {
        field: 'relation',
        headerName: 'Relation',
        headerAlign: 'center',
        display: 'flex',
        align: 'center',
        width: 90,
        editable: false,
        renderCell: ({ row }) => {
          if (row.type === 'group') return ''
          const value = row.source
          const valueType =
            value && value !== '' ? sourceValueTypes[value] : 'number'
          const relationValueOpts = getRelationValueOptsByType(valueType)
          return row.edit ? (
            <Select
              value={row.relation}
              onChange={(event) => handleRelationChange(row.id, event)}
              sx={{ flex: 1 }}
            >
              {relationValueOpts.map((option, index) => (
                <MenuItem key={index} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          ) : (
            relationValueOpts.find((opts) => opts.value === row.relation).label
          )
        },
      },
      {
        field: 'value',
        headerName: 'Value',
        headerAlign: 'right',
        display: 'flex',
        align: 'right',
        width: 150,
        editable: false,
        renderCell: (params) => {
          if (params.row.type === 'group') return ''
          if (params.row.edit) {
            const valueType = sourceValueTypes[params.row.source]
            if (valueType === 'multiSelect') {
              return (
                <GridEditMultiSelectCell
                  options={filterables[params.row.source].options}
                  colorByOptions={R.path([params.row.source, 'colorByOptions'])(
                    filterableExtraProps
                  )}
                  onChange={(event, newValue) => {
                    setRows((prevRows) =>
                      prevRows.map((prevRow) =>
                        prevRow.id === params.row.id
                          ? { ...prevRow, value: newValue }
                          : prevRow
                      )
                    )
                  }}
                />
              )
            } else {
              return (
                <TextField
                  value={params.row.value || ''}
                  onChange={(event) => handleValueChange(params.row.id, event)}
                />
              )
            }
          } else {
            const { value, row } = params
            const valueType = sourceValueTypes[row.source]
            const formattedValue =
              valueType === 'number'
                ? NumberFormat.format(+value, numberFormatProps[row.source])
                : valueType === 'date' ||
                    valueType === 'time' ||
                    valueType === 'dateTime'
                  ? dayjs(
                      value,
                      valueType === 'time' ? 'HH:mm:ss' : undefined
                    ).format(getDateFormat(valueType))
                  : value
            return R.cond([
              [R.equals('boolean'), R.always(<GridBooleanCell {...params} />)],
              [
                R.equals('multiSelect'),
                R.always(
                  <GridMultiSelectCell
                    options={R.path([row.source, 'options'])(filterables)}
                    colorByOptions={R.path([row.source, 'colorByOptions'])(
                      filterableExtraProps
                    )}
                    {...params}
                  />
                ),
              ],
              [R.T, R.always(<OverflowText text={`${formattedValue}`} />)],
            ])(valueType)
          }
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        headerAlign: 'right',
        display: 'flex',
        align: 'right',
        width: 105,
        type: 'actions',
        getActions: ({ id, row }) => {
          if (id === 0) {
            return [
              <GridActionsCellItem
                icon={<MdAddCircleOutline size="20px" />}
                label="Add Rule"
                onClick={() => handleAddRow(row.groupId, row.depth)}
              />,
              <GridActionsCellItem
                icon={<BiBracket size="20px" />}
                label="Add Group"
                onClick={() => handleAddGroup(row.groupId, row.depth)}
                sx={{ marginLeft: '-10px', paddingY: '10px' }}
              />,
            ]
          }
          return row.type === 'group'
            ? [
                <GridActionsCellItem
                  icon={<MdAddCircleOutline size="20px" />}
                  label="Add Rule"
                  onClick={() => handleAddRow(row.groupId, row.depth)}
                />,
                <GridActionsCellItem
                  icon={<BiBracket size="20px" />}
                  label="Add Group"
                  onClick={() => handleAddGroup(row.groupId, row.depth)}
                  sx={{ margin: '-10px' }}
                />,
                <GridActionsCellItem
                  icon={<MdDelete size="20px" />}
                  label="Remove Group"
                  onClick={() => handleDeleteGroup(id, row.groupId)}
                  sx={{ paddingY: '10px' }}
                />,
              ]
            : [
                <GridActionsCellItem
                  icon={<MdDelete size="20px" />}
                  label="Delete"
                  onClick={handleDeleteRow(id)}
                  sx={{ paddingY: '10px' }}
                />,
              ]
        },
      },
    ],
    [
      filterableExtraProps,
      filterables,
      handleAddRow,
      handleAddGroup,
      handleDeleteRow,
      handleDeleteGroup,
      numberFormatProps,
      sourceHeaderName,
      sourceValueOpts,
      sourceValueTypes,
    ]
  )

  const maxDepth = useMemo(
    () => R.pipe(R.map(R.propOr(0, 'depth')), R.reduce(R.max, 0))(rows),
    [rows]
  )

  return (
    <>
      <Paper sx={styles.content}>
        <StyledDataGrid
          {...{ columns, rows }}
          getRowHeight={R.always('auto')}
          hideFooter
          disableColumnMenu
          disableColumnResize
          disableColumnSorting
          disableRowSelectionOnClick
          onRowEditStop={handleRowEditStop}
          onCellDoubleClick={handleCellDoubleClick}
          maxDepth={maxDepth}
          getRowClassName={(params) => `row-color-${params.row.depth}`}
        />
      </Paper>

      <Stack mt={1} spacing={1} direction="row" justifyContent="end">
        <Button
          color="primary"
          variant="contained"
          startIcon={<MdEdit />}
          onClick={() => {
            setRows(rows.map((row) => ({ ...row, edit: true })))
          }}
        >
          Edit
        </Button>
        {canCancel && (
          <Button
            disabled={!canCancel}
            color="error"
            variant="contained"
            startIcon={<MdRestore />}
            onClick={() => {
              setRows(initialRows)
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          disabled={!canSaveAll}
          color="primary"
          variant="contained"
          startIcon={<MdCheck />}
          onClick={() => {
            const newRows = rows.map((row) => ({ ...row, edit: false }))
            setRows(newRows)
            handleClickSaveAll(newRows)
            setInitialRows(newRows)
          }}
        >
          Save Constraints
        </Button>
      </Stack>
    </>
  )
}

export default GridFilter
