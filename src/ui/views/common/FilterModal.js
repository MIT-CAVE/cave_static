import { Modal, Paper, Stack, Button, Box, Tabs, Tab } from '@mui/material'
import {
  DataGrid,
  GridActionsCellItem,
  GridRowModes,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  useGridApiRef,
  GridRowEditStopReasons,
} from '@mui/x-data-grid'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MdAddCircleOutline,
  MdCheck,
  MdDelete,
  MdEdit,
  MdRestore,
  MdSave,
} from 'react-icons/md'
import { useSelector } from 'react-redux'

import {
  // selectNumberFormatPropsFn,
  selectNumberFormat,
} from '../../../data/selectors'

import { NumberFormat, mapIndexed, renameKeys } from '../../../utils'

const styles = {
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    mx: 'auto',
    p: 1,
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    maxWidth: '80%',
    minWidth: '33%',
    height: '50%',
    p: 2,
    mx: 'auto',
    color: 'text.primary',
    bgcolor: 'background.paper',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    boxShadow: 5,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    mb: 1,
    p: 2,
    fontSize: '25px',
    borderColor: 'text.secondary',
    borderBottom: '2px',
  },
  addBtn: {
    justifyContent: 'start',
    pl: 2,
    py: 2,
  },
}

const FilterModal = ({
  open,
  statNames,
  // TODO: statGroupings,
  defaultFilters,
  onSave,
  onClose,
}) => {
  const [filters, setFilters] = useState(defaultFilters)
  const [filterTab, setFilterTab] = useState('stats')
  const [idCount, setIdCount] = useState(0)
  const [rows, setRows] = useState([])
  const [initialRows, setInitialRows] = useState([])
  const [rowModesModel, setRowModesModel] = useState({})
  const [canSaveRow, setCanSaveRow] = useState({})

  // const getNumberFormat = useSelector(selectNumberFormatPropsFn)
  const numberFormat = useSelector(selectNumberFormat)
  const apiRef = useGridApiRef()

  const isApiRefValid = !R.either(R.isNil, R.isEmpty)(apiRef.current)

  const restoreFilters = useCallback(() => {
    const filterCriteria = R.filter(
      R.pipe(R.propOr('stat', 'format'), R.equals('stat'))
    )(filters)
    const initialRows = mapIndexed(
      R.pipe(
        R.flip(R.assoc('id')),
        // Set up `logic` for first row in case it is `undefined`
        R.when(R.propEq(0, 'id'), R.assoc('logic', 'and')),
        // Drop falsy `active` values
        R.when(R.propEq(false, 'active'), R.dissoc('active')),
        renameKeys({ option: 'relation', prop: 'source' })
      )
    )(filterCriteria)

    setInitialRows(initialRows)
    setRows(initialRows)
    setIdCount(initialRows.length)
  }, [filters])

  useEffect(() => {
    restoreFilters()
  }, [restoreFilters])

  useEffect(() => {
    if (!isApiRefValid) return

    const newSelectedRowIds = R.pipe(
      R.filter(R.prop('active')),
      R.pluck('id')
    )(initialRows)
    apiRef.current.setRowSelectionModel(newSelectedRowIds)
  }, [apiRef, initialRows, isApiRefValid])

  const handleChangeTab = useCallback(() => {
    setFilterTab(filterTab === 'stats' ? 'groups' : 'stats')
  }, [filterTab])

  const handleAddRow = useCallback(() => {
    setRows(
      R.append({
        isNew: true,
        id: idCount,
        source: '',
        relation: '',
        logic: 'and',
      })
    )
    setRowModesModel(
      R.assoc(idCount, {
        mode: GridRowModes.Edit,
        fieldToFocus: rows.length < 1 ? 'source' : 'logic',
      })
    )
    apiRef.current.selectRow(idCount)
    setIdCount(idCount + 1)
  }, [apiRef, idCount, rows.length])

  const deleteRow = useCallback((id) => {
    setRows(R.reject(R.propEq(id, 'id')))
  }, [])
  const handleDeleteRow = useCallback(
    (id) => () => {
      deleteRow(id)
    },
    [deleteRow]
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
  const handleClickEdit = useCallback(
    (id) => () => {
      setRowModesModel(R.assoc(id, { mode: GridRowModes.Edit }))
    },
    []
  )
  const handleClickSave = useCallback(
    (id) => () => {
      setRowModesModel(R.assoc(id, { mode: GridRowModes.View }))
      setCanSaveRow(R.dissoc(id))
    },
    []
  )

  const processRowUpdate = (newRow) => {
    const updatedRow = R.dissoc('isNew')(newRow)
    setRows(R.map(R.when(R.propEq(newRow.id, 'id'), R.always(updatedRow))))
    return updatedRow
  }

  const handleRowEditStop = ({ reason }, event) => {
    if (reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true
    }
  }

  const updateActiveStateForSelectedRow = useCallback(
    (row) => {
      const selectedRowIdsSet = new Set(apiRef.current.getSelectedRows().keys())
      return R.ifElse(
        (row) => selectedRowIdsSet.has(row.id),
        R.assoc('active', true),
        R.dissoc('active')
      )(row)
    },
    [apiRef]
  )

  const canDiscardOrSaveAll = useMemo(() => {
    const unsavedChanges = !R.equals(rows)(initialRows)
    const isEditing = R.pipe(
      R.values,
      R.any(R.propEq(GridRowModes.Edit, 'mode'))
    )(rowModesModel)
    return filterTab === 'stats' && !isEditing && unsavedChanges
  }, [filterTab, initialRows, rowModesModel, rows])

  const handleClickSaveAll = useCallback(() => {
    const newFilters = R.map(
      R.pipe(
        updateActiveStateForSelectedRow,
        R.dissoc('id'),
        renameKeys({ relation: 'option', source: 'prop' })
      )
    )(rows)
    setFilters(newFilters)
    onSave(newFilters)
  }, [onSave, rows, updateActiveStateForSelectedRow])

  const handleRowSelectionCheckboxChange = useCallback(() => {
    setRows(R.map(updateActiveStateForSelectedRow))
  }, [updateActiveStateForSelectedRow])

  const handleCellDoubleClick = (_, event) => {
    event.defaultMuiPrevented = true
  }

  const preProcessEditCellProps = useCallback(
    ({ id, props, hasChanged, otherFieldsProps }) => {
      const isValueInvalid = R.propSatisfies(
        R.either(R.isNil, R.isEmpty),
        'value'
      )
      const newCellProps = R.pipe(
        R.ifElse(isValueInvalid, R.assoc('error', true), R.dissoc('error'))
      )(props)

      if (hasChanged) {
        const hasError =
          newCellProps.error ||
          R.pipe(
            // We ignore the `logic` field in the first row
            R.when(R.always(id === rows[0].id), R.dissoc('logic')),
            R.values,
            R.any(isValueInvalid)
          )(otherFieldsProps)

        setCanSaveRow(R.assoc(id, !hasError))
      }
      return newCellProps
    },
    [rows]
  )

  const columns = useMemo(
    () => [
      {
        field: 'logic',
        headerName: 'Logic',
        align: 'center',
        editable: true,
        sortable: false,
        type: 'singleSelect',
        valueOptions: ['and'], // FIXME: ['or', 'and'],
        getOptionLabel: (option) => option.toUpperCase(),
        cellClassName: ({ id }) => (id > rows[0].id ? '' : 'hidden'),
        preProcessEditCellProps,
      },
      GRID_CHECKBOX_SELECTION_COL_DEF,
      {
        field: 'source',
        headerName: 'Statistic',
        width: 250,
        type: 'singleSelect',
        editable: true,
        sortable: false,
        valueOptions: R.keys(statNames),
        preProcessEditCellProps,
      },
      {
        field: 'relation',
        headerName: 'Relation',
        width: 100,
        type: 'singleSelect',
        editable: true,
        sortable: false,
        valueOptions: [
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
        ],
        preProcessEditCellProps,
      },
      {
        field: 'value',
        headerName: 'Value',
        headerAlign: 'right',
        align: 'right',
        type: 'number',
        width: 110,
        editable: true,
        sortable: false,
        valueFormatter: ({ value }) =>
          typeof value === 'number'
            ? NumberFormat.format(value, numberFormat)
            : null,
        preProcessEditCellProps,
      },
      {
        field: 'actions',
        type: 'actions',
        width: 80,
        sortable: false,
        getActions: ({ id }) =>
          R.path([id, 'mode'])(rowModesModel) === GridRowModes.Edit
            ? [
                <GridActionsCellItem
                  disabled={!canSaveRow[id]}
                  icon={<MdSave size="20px" />}
                  label="Save"
                  onClick={handleClickSave(id)}
                />,
                <GridActionsCellItem
                  icon={<MdRestore size="20px" />}
                  label="Discard"
                  onClick={handleClickDiscard(id)}
                />,
              ]
            : [
                <GridActionsCellItem
                  icon={<MdEdit size="20px" />}
                  label="Edit"
                  onClick={handleClickEdit(id)}
                />,
                <GridActionsCellItem
                  icon={<MdDelete size="20px" />}
                  label="Delete"
                  onClick={handleDeleteRow(id)}
                />,
              ],
        preProcessEditCellProps,
      },
    ],
    [
      handleClickDiscard,
      handleClickEdit,
      handleClickSave,
      handleDeleteRow,
      canSaveRow,
      numberFormat,
      preProcessEditCellProps,
      rowModesModel,
      rows,
      statNames,
    ]
  )

  console.log({ canSaveRow }, apiRef.current)

  return (
    // Keep the component mounted to avoid losing `apiRef`
    <Modal sx={styles.modal} keepMounted {...{ open, onClose }}>
      <Box sx={styles.paper}>
        <Box sx={styles.header}>Data Filter</Box>
        <Tabs variant="fullWidth" value={filterTab} onChange={handleChangeTab}>
          <Tab value="stats" label="Statistics" />
          <Tab value="groups" label="Groups" />
        </Tabs>
        <Paper
          sx={{
            textAlign: 'center',
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            height: '100%',
          }}
        >
          <DataGrid
            sx={{
              // Prefer `visibility` over conditional rendering to avoid losing `apiRef`
              visibility: open && filterTab === 'stats' ? 'visible' : 'hidden',
              my: 2,
            }}
            {...{ apiRef, columns, rows, rowModesModel, processRowUpdate }}
            editMode="row"
            hideFooter
            checkboxSelection
            disableColumnMenu
            disableRowSelectionOnClick
            onRowEditStop={handleRowEditStop}
            onCellDoubleClick={handleCellDoubleClick}
            onRowSelectionModelChange={handleRowSelectionCheckboxChange}
          />
          {filterTab === 'stats' && (
            <Button
              fullWidth
              size="medium"
              sx={styles.addBtn}
              startIcon={<MdAddCircleOutline />}
              onClick={handleAddRow}
            >
              Add a Constraint
            </Button>
          )}
        </Paper>
        <Stack mt={1} spacing={1} direction="row" justifyContent="end">
          <Button
            disabled={!canDiscardOrSaveAll}
            color="error"
            variant="contained"
            startIcon={<MdRestore />}
            onClick={restoreFilters}
          >
            Discard All Changes
          </Button>
          <Button
            disabled={!canDiscardOrSaveAll}
            color="primary"
            variant="contained"
            startIcon={<MdCheck />}
            onClick={handleClickSaveAll}
          >
            Save Changes
          </Button>
        </Stack>
      </Box>
    </Modal>
  )
}

export default FilterModal
