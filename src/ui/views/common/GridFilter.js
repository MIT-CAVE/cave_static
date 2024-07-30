import { Box, Button, Paper, Stack } from '@mui/material'
import { darken, lighten, styled } from '@mui/material/styles'
import {
  DataGrid,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GridActionsCellItem,
  GridBooleanCell,
  GridEditBooleanCell,
  GridEditDateCell,
  GridEditInputCell,
  GridEditSingleSelectCell,
  // GridRowEditStopReasons,
  GridRowModes,
  useGridApiRef,
} from '@mui/x-data-grid'
import dayjs from 'dayjs'
import * as R from 'ramda'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { BiBracket } from 'react-icons/bi'
import {
  MdAddCircleOutline,
  MdCheck,
  MdDelete,
  MdEdit,
  // MdRestore,
  // MdSave,
  MdOutlineCancel,
} from 'react-icons/md'
// import { PiArrowElbowDownRight } from 'react-icons/pi'
import { useSelector } from 'react-redux'

import EnhancedEditSingleSelect from './EnhancedEditSingleSelect'
import GridEditMultiSelectCell, {
  GridMultiSelectCell,
} from './GridEditMultiSelectCell'
import GridEditTimeCell from './GridEditTimeCell'

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

const getCellComponentByType = R.cond([
  [R.equals('boolean'), R.always(GridEditBooleanCell)],
  [R.equals('singleSelect'), R.always(GridEditSingleSelectCell)],
  [R.equals('multiSelect'), R.always(GridEditMultiSelectCell)],
  [R.equals('time'), R.always(GridEditTimeCell)],
  [R.flip(R.includes)(['date', 'dateTime']), R.always(GridEditDateCell)],
  [R.flip(R.includes)(['string', 'number']), R.always(GridEditInputCell)],
  [R.T, R.always(GridEditInputCell)],
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
  // const [filters, setFilters] = useState(defaultFilters)
  const [idCount, setIdCount] = useState(1)
  const [groupIdCount, setGroupIdCount] = useState(1)
  const [rows, setRows] = useState(defaultFilters)
  // const [initialRows, setInitialRows] = useState([])
  const [rowModesModel, setRowModesModel] = useState({})
  // const [canSaveRow, setCanSaveRow] = useState({})
  // console.log('rows', rows)

  // console.log(rowModesModel)

  const apiRef = useGridApiRef()
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

  // const isApiRefValid = !R.either(R.isNil, R.isEmpty)(apiRef.current)

  // const restoreFilters = useCallback(() => {
  //   const filterCriteria = R.filter(
  //     R.pipe(R.propOr('stat', 'format'), R.equals('stat'))
  //   )(filters)
  //   const initRows = mapIndexed(
  //     R.pipe(
  //       R.flip(R.assoc('id')),
  //       // Drop truthy `active` values
  //       R.when(R.propEq(true, 'active'), R.dissoc('active')),
  //       renameKeys({ option: 'relation', prop: 'source' })
  //     )
  //   )(filterCriteria)

  //   setInitialRows(initRows)
  //   setRows(initRows)
  //   setIdCount(initRows.length)
  // }, [filters])

  // useEffect(() => {
  //   restoreFilters()
  // }, [restoreFilters])

  // useEffect(() => {
  //   if (!apiRef.current) return

  //   const newSelectedRowIds = rows
  //     .filter((row) => row.active !== false)
  //     .map((row) => row.id)

  //   apiRef.current.setRowSelectionModel(newSelectedRowIds)
  // }, [])

  useEffect(() => {
    const newSelectedRowIds = R.pipe(
      R.filter(R.propOr(true, 'active')),
      R.pluck('id')
    )(rows)
    apiRef.current.setRowSelectionModel(newSelectedRowIds)
    setRowModesModel({ 0: { mode: GridRowModes.Edit } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // const preProcessEditCellProps = useCallback(
  //   ({ id, props, hasChanged, otherFieldsProps }) => {
  //     const isValueInvalid = R.propSatisfies(
  //       R.either(R.isNil, R.isEmpty),
  //       'value'
  //     )
  //     const newCellProps = R.pipe(
  //       R.ifElse(isValueInvalid, R.assoc('error', true), R.dissoc('error'))
  //     )(props)

  //     if (hasChanged) {
  //       const hasError =
  //         newCellProps.error ||
  //         R.pipe(
  //           R.dissoc('logic'),
  //           R.values,
  //           R.any(isValueInvalid)
  //         )(otherFieldsProps)
  //       setCanSaveRow(R.assoc(id, !hasError))
  //     }
  //     return newCellProps
  //   },
  //   []
  // )

  const handleAddRow = useCallback(
    (groupId, depth) => {
      const index = rows.findIndex((row) => row.groupId === groupId)
      const newRow = {
        isNew: true,
        id: idCount,
        type: 'rule',
        parentGroupId: groupId,
        source: '',
        relation: '',
        value: '',
        depth: depth,
      }
      setRowModesModel(
        R.assoc(idCount, {
          mode: GridRowModes.Edit,
          fieldToFocus: 'source',
        })
      )
      const newRows = [
        ...rows.slice(0, index + 1),
        newRow,
        ...rows.slice(index + 1),
      ]
      setRows(newRows)
      apiRef.current.selectRow(idCount)
      setIdCount(idCount + 1)
    },
    [apiRef, idCount, rows]
  )

  const handleAddGroup = useCallback(
    (groupId, logic, depth) => {
      const index = rows.findIndex((row) => row.groupId === groupId)
      const newRow = {
        isNew: true,
        id: idCount,
        type: 'group',
        groupId: groupIdCount,
        parentGroupId: groupId,
        logic: 'and',
        depth: depth + 1,
      }
      setRowModesModel(
        R.assoc(idCount, {
          mode: GridRowModes.Edit,
          fieldToFocus: 'logic',
        })
      )
      const newRows = [
        ...rows.slice(0, index + 1),
        newRow,
        ...rows.slice(index + 1),
      ]
      setRows(newRows)
      apiRef.current.selectRow(idCount)
      setIdCount(idCount + 1)
      setGroupIdCount(groupIdCount + 1)
    },
    [groupIdCount, idCount, rows, apiRef]
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

  const handleClickDiscard = useCallback(
    (id) => () => {
      const row = apiRef.current.getRow(id)
      setRowModesModel(
        R.assoc(id, { mode: GridRowModes.View, ignoreModifications: true })
      )
      if (row.isNew) deleteRow(id)
    },
    [apiRef, deleteRow]
  )
  // const handleClickEdit = useCallback(
  //   (id) => () => {
  //     setRowModesModel(R.assoc(id, { mode: GridRowModes.Edit }))
  //   },
  //   []
  // )
  // const handleClickSave = useCallback(
  //   (id) => () => {
  //     setRowModesModel(R.assoc(id, { mode: GridRowModes.View }))
  //     setCanSaveRow(R.dissoc(id))
  //   },
  //   []
  // )

  const processRowUpdate = (newRow) => {
    const updatedRow = R.dissoc('isNew')(newRow)
    const newRows = R.map(
      R.when(R.propEq(newRow.id, 'id'), R.always(updatedRow))
    )(rows)
    setRows(newRows)
    const newFilters = R.map(
      R.pipe(
        updateActiveStateForSelectedRow,
        R.dissoc('id'),
        renameKeys({ relation: 'option', source: 'prop' })
      )
    )(newRows)
    onSave(newFilters)
    console.log('new filters', newFilters)
    return updatedRow
  }

  // const handleRowEditStop = ({ reason }, event) => {
  //   if (reason === GridRowEditStopReasons.rowFocusOut) {
  //     event.defaultMuiPrevented = true
  //   }
  // }

  const updateActiveStateForSelectedRow = useCallback(
    (row) => {
      const selectedRowIdsSet = new Set(apiRef.current.getSelectedRows().keys())
      return R.ifElse(
        (row) => selectedRowIdsSet.has(row.id),
        R.dissoc('active'),
        R.assoc('active', false)
      )(row)
    },
    [apiRef]
  )

  // const canDiscardOrSaveAll = useMemo(() => {
  //   const unsavedChanges = !R.equals(rows)(initialRows)
  //   const isEditing = R.pipe(
  //     R.values,
  //     R.any(R.propEq(GridRowModes.Edit, 'mode'))
  //   )(rowModesModel)
  //   return !isEditing && unsavedChanges
  // }, [initialRows, rowModesModel, rows])

  const handleClickEditAll = useCallback(() => {
    const updatedModel = {}
    rows.forEach((row) => {
      updatedModel[row.id] = { mode: GridRowModes.Edit }
    })
    setRowModesModel(updatedModel)
  }, [rows])

  const handleClickSaveAll = useCallback(() => {
    const updatedModel = {}
    rows.forEach((row) => {
      updatedModel[row.id] = { mode: GridRowModes.View }
    })
    setRowModesModel(updatedModel)
  }, [rows])

  const handleRowSelectionCheckboxChange = useCallback(() => {
    setRows(R.map(updateActiveStateForSelectedRow))
  }, [updateActiveStateForSelectedRow])

  const handleCellDoubleClick = (params, event) => {
    event.defaultMuiPrevented = true
  }

  const columns = useMemo(
    () => [
      {
        field: 'logic',
        headerName: 'Logic',
        headerAlign: 'center',
        display: 'flex',
        width: 90,
        editable: true,
        type: 'singleSelect',
        valueOptions: ['and', 'or'],
        getOptionLabel: (option) => option.toUpperCase(),
        // renderCell: ({ row }) => {
        //   return row.id === 0 ? (
        //     <Box sx={{ paddingLeft: '5px' }}>{row.logic.toUpperCase()}</Box>
        //   ) : row.type === 'rule' ? (
        //     ''
        //   ) : (
        //     <Box sx={{ paddingLeft: `${row.depth * 8}px`, display: 'flex' }}>
        //       <PiArrowElbowDownRight style={{ marginRight: '3px' }} />
        //       {row.logic.toUpperCase()}
        //     </Box>
        //   )
        // },
        // preProcessEditCellProps,
      },
      GRID_CHECKBOX_SELECTION_COL_DEF,
      {
        field: 'source',
        headerName: sourceHeaderName,
        type: 'singleSelect',
        display: 'flex',
        flex: 1,
        editable: true,
        valueOptions: sourceValueOpts,
        renderCell: ({ formattedValue }) => (
          <OverflowText text={formattedValue} />
        ),
        renderEditCell: (params) => (
          <EnhancedEditSingleSelect
            fieldsToClear={['value', 'relation']}
            {...params}
          />
        ),
        // preProcessEditCellProps,
      },
      {
        field: 'relation',
        headerName: 'Relation',
        headerAlign: 'center',
        display: 'flex',
        align: 'center',
        width: 90,
        type: 'singleSelect',
        editable: true,
        valueOptions: ({ row, id }) => {
          const rowAlt = apiRef.current.getRow(id)
          const valueAlt = rowAlt.source
          const value = R.propOr(valueAlt, 'source')(row)
          const valueType =
            value && value !== '' ? sourceValueTypes[value] : 'number'
          return getRelationValueOptsByType(valueType)
        },
        // preProcessEditCellProps,
      },
      {
        field: 'value',
        headerName: 'Value',
        headerAlign: 'right',
        display: 'flex',
        align: 'right',
        width: 150,
        editable: true,
        valueParser: (value, params) => {
          const editRow = apiRef.current.getRowWithUpdatedValues(params.id)
          const valueType = sourceValueTypes[editRow.source]

          const getParsedDate = (dateTimeStr, parseFormat) => {
            const newValue = dayjs(dateTimeStr, parseFormat)
            return newValue.isValid()
              ? newValue.format(getDateFormat(valueType))
              : ''
          }

          return R.cond([
            [R.equals('boolean'), R.always(Boolean(value))],
            [R.equals('number'), R.always(value === '' ? '' : +value)],
            [R.equals('time'), R.always(getParsedDate(value, 'HH:mm:ss'))],
            [
              R.flip(R.includes)(['date', 'dateTime']),
              R.always(getParsedDate(value)),
            ],
            [
              R.equals('multiSelect'),
              R.always(Array.isArray(value) ? value : ''),
            ],
            [R.T, R.always(value)],
          ])(valueType)
        },
        renderCell: (params) => {
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

          return row.type === 'group'
            ? ''
            : R.cond([
                [
                  R.equals('boolean'),
                  R.always(<GridBooleanCell {...params} />),
                ],
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
        },
        renderEditCell: (params) => {
          const valueType = sourceValueTypes[params.row.source]
          const Component = getCellComponentByType(valueType)
          const props =
            valueType === 'multiSelect'
              ? // Custom component required props
                {
                  options: filterables[params.row.source].options,
                  colorByOptions:
                    filterableExtraProps[params.row.source].colorByOptions,
                }
              : // MUI props for built-in EditCell components
                {
                  colDef: { type: valueType }, // Ensures the expected type by MUI
                  ...((valueType === 'date' || valueType === 'dateTime') && {
                    inputProps: { style: { colorScheme: 'dark' } },
                  }),
                }
          return <Component {...params} {...props} />
        },
        // preProcessEditCellProps,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        headerAlign: 'right',
        display: 'flex',
        align: 'right',
        width: 100,
        type: 'actions',
        getActions: ({ id, row }) => {
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
                  onClick={() =>
                    handleAddGroup(row.groupId, row.logic, row.depth)
                  }
                  sx={
                    id === 0
                      ? { marginRight: '-3px', marginLeft: '-10px' }
                      : { margin: '-10px' }
                  }
                />,
                id === 0 ? (
                  <></>
                ) : (
                  <GridActionsCellItem
                    icon={<MdOutlineCancel size="20px" />}
                    label="Remove Group"
                    onClick={() => handleDeleteGroup(id, row.groupId)}
                    sx={{ marginRight: '-3px' }}
                  />
                ),
              ]
            : R.path([id, 'mode'])(rowModesModel) === GridRowModes.Edit
              ? [
                  // <GridActionsCellItem
                  //   disabled={!canSaveRow[id]}
                  //   icon={<MdSave size="20px" />}
                  //   label="Save"
                  //   onClick={handleClickSave(id)}
                  // />,
                  <GridActionsCellItem
                    icon={<MdDelete size="20px" />}
                    label="Discard"
                    onClick={handleClickDiscard(id)}
                  />,
                ]
              : [
                  // <GridActionsCellItem
                  //   icon={<MdEdit size="20px" />}
                  //   label="Edit"
                  //   onClick={handleClickEdit(id)}
                  // />,
                  <GridActionsCellItem
                    icon={<MdDelete size="20px" />}
                    label="Delete"
                    onClick={handleDeleteRow(id)}
                  />,
                ]
        },
        // preProcessEditCellProps,
      },
    ],
    [
      apiRef,
      // canSaveRow,
      filterableExtraProps,
      filterables,
      handleClickDiscard,
      // handleClickEdit,
      // handleClickSave,
      handleAddRow,
      handleAddGroup,
      handleDeleteRow,
      handleDeleteGroup,
      numberFormatProps,
      // preProcessEditCellProps,
      rowModesModel,
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
          {...{ apiRef, columns, rows, rowModesModel, processRowUpdate }}
          slots={{
            noRowsOverlay: () => (
              <Box sx={styles.emptyContent}>No constraints added</Box>
            ),
          }}
          editMode="row"
          getRowHeight={R.always('auto')}
          hideFooter
          checkboxSelection
          disableColumnMenu
          disableColumnResize
          disableColumnSorting
          disableRowSelectionOnClick
          // onRowEditStop={handleRowEditStop}
          onCellDoubleClick={handleCellDoubleClick}
          onRowSelectionModelChange={handleRowSelectionCheckboxChange}
          maxDepth={maxDepth}
          getRowClassName={(params) => `row-color-${params.row.depth}`}
          isCellEditable={(params) => {
            const { field, row } = params
            const nonEditableFields = R.cond([
              [R.equals('group'), R.always(['source', 'relation', 'value'])],
              [R.equals('rule'), R.always(['logic'])],
              [R.T, R.always([])],
            ])(row.type)
            return !R.includes(field, nonEditableFields)
          }}
        />
      </Paper>

      <Stack mt={1} spacing={1} direction="row" justifyContent="end">
        {/* <Button
          disabled={!canDiscardOrSaveAll}
          color="error"
          variant="contained"
          startIcon={<MdRestore />}
          onClick={restoreFilters}
        >
          Discard Changes
        </Button> */}
        <Button
          // disabled={!canDiscardOrSaveAll}
          color="primary"
          variant="contained"
          startIcon={<MdEdit />}
          onClick={handleClickEditAll}
        >
          Edit
        </Button>
        <Button
          // disabled={!canDiscardOrSaveAll}
          color="primary"
          variant="contained"
          startIcon={<MdCheck />}
          onClick={handleClickSaveAll}
        >
          Save Constraints
        </Button>
      </Stack>
    </>
  )
}

export default GridFilter
