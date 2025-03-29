import { Paper, TextField, Box, darken, lighten, styled } from '@mui/material'
import {
  DataGrid,
  GridActionsCellItem,
  GridBooleanCell,
} from '@mui/x-data-grid'
import dayjs from 'dayjs'
import * as R from 'ramda'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { BiBracket } from 'react-icons/bi'
import { MdAddCircleOutline, MdDelete } from 'react-icons/md'
import { useSelector } from 'react-redux'

import GridEditMultiSelectCell, {
  GridMultiSelectCell,
} from './GridEditMultiSelectCell'

import { selectNumberFormatPropsFn } from '../../../data/selectors'

import { OverflowText, Select } from '../../compound'

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
  select: {
    minWidth: 0,
    width: '100%',
    '& .MuiSelect-select': {
      padding: '4px 24px 4px 8px',
    },
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

const EditableTextField = ({
  valueType,
  value: initialValue,
  onSave,
  onBlur,
}) => {
  const [value, setValue] = useState(initialValue || '')

  const parseDate = useCallback(
    (dateTimeStr, parseFormat) => {
      const newValue = dayjs(dateTimeStr, parseFormat)
      return newValue.isValid() ? newValue.format(getDateFormat(valueType)) : ''
    },
    [valueType]
  )

  const parse = useCallback(
    (value) =>
      R.cond([
        [R.equals('boolean'), R.always(Boolean(value))],
        [R.equals('number'), R.always(value === '' ? '' : +value)],
        [R.equals('time'), R.always(parseDate(value, 'HH:mm:ss'))],
        [R.flip(R.includes)(['date', 'dateTime']), R.always(parseDate(value))],
        [R.T, R.always(value)],
      ])(valueType),
    [parseDate, valueType]
  )

  const handleBlur = useCallback(() => {
    onSave(parse(value))
    onBlur()
  }, [onBlur, onSave, parse, value])

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.target.blur()
    }
  }

  return (
    <TextField
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  )
}

const GridFilter = ({
  defaultFilters = [],
  sourceHeaderName = 'Source',
  filterables,
  filterableExtraProps,
  onSave,
}) => {
  const [filters, setFilters] = useState(defaultFilters)
  const [editingId, setEditingId] = useState(-1)

  const renamedFilters = useMemo(
    () => R.map(renameKeys({ option: 'relation', prop: 'source' }), filters),
    [filters]
  )
  const maxId = renamedFilters.reduce((max, row) => {
    return row.id > max ? row.id : max
  }, 0)
  const maxGroupId = renamedFilters.reduce((max, row) => {
    return row.groupId > max ? row.groupId : max
  }, 0)
  const [idCount, setIdCount] = useState(maxId + 1)
  const [groupIdCount, setGroupIdCount] = useState(maxGroupId + 1)
  const [rows, setRows] = useState(renamedFilters)

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

  const handleSave = useCallback(
    (newRows) => {
      const newFilters = R.map(
        R.pipe(
          // R.dissoc('id'),
          // R.dissoc('depth'),
          renameKeys({ relation: 'option', source: 'prop' })
        )
      )(newRows)
      setFilters(newFilters)

      // console.log('before-saving', { newRows, newFilters })
      onSave(newFilters)
    },
    [onSave]
  )

  useEffect(() => {
    setFilters(
      R.when(
        R.isEmpty,
        R.always([
          {
            id: 0,
            type: 'group',
            groupId: 0,
            logic: 'and',
            depth: 0,
            edit: true,
          },
        ])
      )
    )
  }, [])

  useEffect(() => {
    setRows(renamedFilters)
  }, [renamedFilters])

  useEffect(() => {
    // Check if all rule rows have required fields filled out
    const filledRows = rows.filter((row) => {
      if (row.type === 'rule') {
        return row.source !== '' && row.relation !== '' && row.value !== ''
      }
      return true // Non-rule rows (like groups) are always valid
    })

    if (R.equals(renamedFilters, filledRows)) return

    const timer = setTimeout(() => {
      handleSave(filledRows)
    }, 500)

    return () => clearTimeout(timer)
  }, [handleSave, renamedFilters, rows])

  const handleAddRow = useCallback(
    (groupId, depth) => {
      const index = rows.findIndex((row) => row.groupId === groupId)
      const newRow = {
        id: idCount,
        type: 'rule',
        ...(groupId !== undefined && { parentGroupId: groupId }),
        source: '',
        relation: '',
        value: '',
        depth: depth + 1,
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
        ...(groupId !== undefined && { parentGroupId: groupId }),
        logic: 'and',
        depth: depth + 1,
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
    (id) => {
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

  const resetEditing = () => setEditingId(-1)

  const columns = useMemo(() => {
    const handleRowChange = (id, field, value) => {
      const newRows = rows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
      setRows(newRows)
    }

    return [
      {
        field: 'logic',
        headerName: 'Logic',
        headerAlign: 'center',
        display: 'flex',
        width: 120,
        editable: false,
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', flexShrink: 0 }}>
              {Array.from({ length: row.depth }).map((_, index) => {
                const colors = ['#21cf46', '#db2323', '#277ee3']
                const color = colors[index % colors.length]

                return (
                  <Box
                    key={index}
                    sx={{
                      marginRight: '3px',
                      width: '4px',
                      height: '44px',
                      color: color,
                      backgroundColor: color,
                    }}
                  >
                    |
                  </Box>
                )
              })}
            </Box>

            {row.type === 'group' && (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Select
                  value={row.logic}
                  onSelect={(value) => handleRowChange(row.id, 'logic', value)}
                  sx={styles.select}
                  optionsList={[
                    { label: 'OR', value: 'or' },
                    { label: 'AND', value: 'and' },
                  ]}
                />
              </Box>
            )}
          </Box>
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
          return (
            row.type === 'rule' && (
              <Select
                value={row.source}
                onSelect={(value) => handleRowChange(row.id, 'source', value)}
                sx={styles.select}
                optionsList={sourceValueOpts}
              />
            )
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
          if (row.type === 'group' || row.id === 0) return ''
          const value = row.source
          const valueType =
            value && value !== '' ? sourceValueTypes[value] : 'number'
          const relationValueOpts = getRelationValueOptsByType(valueType)
          return (
            <Select
              value={row.relation}
              onSelect={(value) => handleRowChange(row.id, 'relation', value)}
              sx={styles.select}
              optionsList={relationValueOpts}
            />
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
          const { value, row } = params
          if (row.type === 'group' || row.id === 0) return ''
          if (editingId === row.id) {
            const valueType = sourceValueTypes[row.source]
            if (valueType === 'multiSelect') {
              return (
                <GridEditMultiSelectCell
                  options={R.path([row.source, 'options'], filterables)}
                  colorOptions={R.path(
                    [row.source, 'colorOptions'],
                    filterableExtraProps
                  )}
                  onChange={(_, newValue) =>
                    handleRowChange(row.id, 'value', newValue)
                  }
                  autoFocus
                  onBlur={resetEditing}
                />
              )
            } else {
              return (
                <EditableTextField
                  {...{ valueType }}
                  value={row.value}
                  onSave={(newValue) =>
                    handleRowChange(row.id, 'value', newValue)
                  }
                  onBlur={resetEditing}
                />
              )
            }
          } else {
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
              [
                R.equals('boolean'),
                R.always(
                  <Box
                    onClick={() => setEditingId(row.id)}
                    sx={{ cursor: 'pointer', width: '100%' }}
                  >
                    <GridBooleanCell {...params} />
                  </Box>
                ),
              ],
              [
                R.equals('multiSelect'),
                R.always(
                  <Box
                    onClick={() => setEditingId(row.id)}
                    sx={{ cursor: 'pointer', width: '100%' }}
                  >
                    <GridMultiSelectCell
                      options={R.path([row.source, 'options'], filterables)}
                      colorOptions={R.path(
                        [row.source, 'colorOptions'],
                        filterableExtraProps
                      )}
                      {...params}
                    />
                  </Box>
                ),
              ],
              [
                R.T,
                R.always(
                  <OverflowText
                    text={`${formattedValue}`}
                    onClick={() => setEditingId(row.id)}
                    sx={{ cursor: 'pointer', width: '100%' }}
                  />
                ),
              ],
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
                sx={{ marginLeft: '-10px', my: 1 }}
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
                  sx={{ my: 1 }}
                />,
              ]
            : [
                <GridActionsCellItem
                  icon={<MdDelete size="20px" />}
                  label="Delete"
                  onClick={() => handleDeleteRow(id)}
                  sx={{ my: 1 }}
                />,
              ]
        },
      },
    ]
  }, [
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
    editingId,
    setEditingId,
    rows,
  ])

  const maxDepth = useMemo(
    () => R.pipe(R.map(R.propOr(0, 'depth')), R.reduce(R.max, 0))(rows),
    [rows]
  )

  return (
    <Paper sx={styles.content}>
      <StyledDataGrid
        {...{ columns, rows }}
        getRowHeight={R.always('auto')}
        hideFooter
        disableColumnMenu
        disableColumnResize
        disableColumnSorting
        maxDepth={maxDepth}
        getRowClassName={(params) => `row-color-${params.row.depth}`}
      />
    </Paper>
  )
}

export default GridFilter
