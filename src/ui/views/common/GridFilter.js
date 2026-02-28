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

import { NumberFormat } from '../../../utils'

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
  defaultFilters,
  sourceHeaderName = 'Source',
  filterables,
  filterableExtraProps,
  onSave,
}) => {
  const [rows, setRows] = useState([])
  const [editingId, setEditingId] = useState(-1)

  const getNumberFormat = useSelector(selectNumberFormatPropsFn)

  const counts = useMemo(
    () =>
      R.reduce(
        (acc, row) => ({
          id: Math.max(acc.id, row.id ?? acc.id),
          groupId: Math.max(acc.groupId, row.groupId ?? acc.groupId),
        }),
        { id: 0, groupId: 0 }
      )(rows),
    [rows]
  )

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

  const saveFilters = useCallback(
    (newRows) => {
      const newFilters = R.map(
        R.pipe(
          // R.dissoc('id'),
          // R.dissoc('depth'),
          R.renameKeys({ relation: 'option', source: 'prop' })
        )
      )(newRows)

      // console.log('before-saving', { newRows, newFilters })
      onSave(newFilters)
    },
    [onSave]
  )

  const defaultRows = useMemo(
    () =>
      R.pipe(
        R.defaultTo([]),
        R.ifElse(
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
          ]),
          R.map(R.renameKeys({ option: 'relation', prop: 'source' }))
        )
      )(defaultFilters),
    [defaultFilters]
  )

  useEffect(() => {
    setRows(defaultRows)
  }, [defaultRows])

  useEffect(() => {
    // Check if all rule rows have required fields filled out
    const filledRows = rows.filter(
      (row) =>
        row.type !== 'rule' || // Non-rule rows (like groups) are always valid
        (row.source !== '' && row.relation !== '' && row.value !== '')
    )

    if (R.equals(defaultRows)(filledRows)) return

    // console.log('Saving filters', { filledRows })
    const timer = setTimeout(() => {
      saveFilters(filledRows)
    }, 500)

    return () => clearTimeout(timer)
  }, [defaultRows, rows, saveFilters])

  const addRowOrGroup = useCallback((groupId, row) => {
    setRows(
      R.converge(R.insert(R.__, row), [
        R.pipe(R.findIndex(R.propEq(groupId, 'groupId')), R.inc),
        R.identity,
      ])
    )
  }, [])

  // console.log({ counts, rows, defaultFilters })

  const handleAddRow = useCallback(
    (groupId, depth) => {
      const newRow = {
        id: counts.id + 1,
        type: 'rule',
        ...(groupId !== undefined && { parentGroupId: groupId }),
        source: '',
        relation: '',
        value: '',
        depth: depth + 1,
      }
      addRowOrGroup(groupId, newRow)
    },
    [addRowOrGroup, counts.id]
  )

  const handleAddGroup = useCallback(
    (groupId, depth) => {
      const newRow = {
        id: counts.id + 1,
        type: 'group',
        groupId: counts.groupId + 1,
        ...(groupId !== undefined && { parentGroupId: groupId }),
        logic: 'and',
        depth: depth + 1,
      }
      // console.log('Adding', { group: newRow })
      addRowOrGroup(groupId, newRow)
    },
    [addRowOrGroup, counts]
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

  const isDescendant = useCallback(
    (parentGroupId, targetGroupId, rowsByGroupId) => {
      while (parentGroupId && targetGroupId !== parentGroupId) {
        parentGroupId = rowsByGroupId[parentGroupId].parentGroupId
      }
      return targetGroupId === parentGroupId
    },
    []
  )

  const getGroupDescendants = useCallback(
    (groupId) => {
      const rowsByGroupId = R.indexBy(R.prop('groupId'))(rows)
      const descendants = new Set()
      for (const row of rows)
        if (isDescendant(row.parentGroupId, groupId, rowsByGroupId)) {
          descendants.add(row.id)
        }
      return descendants
    },
    [isDescendant, rows]
  )

  const handleDeleteGroup = useCallback(
    (id, groupId) => {
      const rowsToDelete = getGroupDescendants(groupId).add(id)
      setRows(R.reject((row) => rowsToDelete.has(row.id)))
    },
    [getGroupDescendants]
  )

  const resetEditing = useCallback(() => setEditingId(-1), [])

  const columns = useMemo(() => {
    const handleRowChange = (id, field, value) => {
      setRows(R.map(R.when(R.propEq(id, 'id'), R.assoc(field, value))))
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
                    sx={{
                      width: '100%',
                      height: '31px',
                      minHeight: '60%',
                      cursor: 'pointer',
                    }}
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
    editingId,
    filterableExtraProps,
    filterables,
    handleAddGroup,
    handleAddRow,
    handleDeleteGroup,
    handleDeleteRow,
    numberFormatProps,
    resetEditing,
    sourceHeaderName,
    sourceValueOpts,
    sourceValueTypes,
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
