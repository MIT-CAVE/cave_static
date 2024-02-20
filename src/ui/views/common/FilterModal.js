import {
  Paper,
  Stack,
  Button,
  Box,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  ButtonGroup,
  TextField,
} from '@mui/material'
import {
  DataGrid,
  GridActionsCellItem,
  GridRowModes,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  useGridApiRef,
  GridRowEditStopReasons,
} from '@mui/x-data-grid'
import * as R from 'ramda'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  MdAddCircleOutline,
  MdArrowForwardIos,
  MdCheck,
  MdDelete,
  MdEdit,
  MdRestore,
  MdSave,
} from 'react-icons/md'
import { useSelector } from 'react-redux'

import { DataGridModal } from './BaseModal'

import {
  selectGroupedOutputNames,
  selectNumberFormat,
  selectStatGroupings,
} from '../../../data/selectors'
import OverflowText from '../../compound/OverflowText'

import {
  NumberFormat,
  getLabelFn,
  getSubLabelFn,
  mapIndexed,
  renameKeys,
} from '../../../utils'

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
    px: 2,
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
  accordRoot: {
    border: '1px solid',
    borderColor: 'divider',
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&::before': {
      display: 'none',
    },
  },
  accordSummary: {
    backgroundColor: 'rgba(255, 255, 255, .05)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
      ml: 1,
    },
  },
  accordDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    justifyContent: 'center',
    ml: 3,
    px: 2,
    borderTop: '1px solid rgba(0, 0, 0, .125)',
  },
  leaves: {
    // bgcolor: 'rgba(0, 0, 0, .125)',
    // borderTop: '1px solid rgba(0, 0, 0, .125)',
    display: 'flex',
    flexWrap: 'wrap',
    ml: 4,
  },
}

const StatsFilter = ({ defaultFilters, onSave }) => {
  const [filters, setFilters] = useState(defaultFilters)
  const [idCount, setIdCount] = useState(0)
  const [rows, setRows] = useState([])
  const [initialRows, setInitialRows] = useState([])
  const [rowModesModel, setRowModesModel] = useState({})
  const [canSaveRow, setCanSaveRow] = useState({})

  const apiRef = useGridApiRef()
  const numberFormat = useSelector(selectNumberFormat)
  const statNames = useSelector(selectGroupedOutputNames)

  const isApiRefValid = !R.either(R.isNil, R.isEmpty)(apiRef.current)

  const restoreFilters = useCallback(() => {
    const filterCriteria = R.filter(
      R.pipe(R.propOr('stat', 'format'), R.equals('stat'))
    )(filters)
    const initRows = mapIndexed(
      R.pipe(
        R.flip(R.assoc('id')),
        // Set up `logic` for first row in case it is `undefined`
        R.when(R.propEq(0, 'id'), R.assoc('logic', 'and')),
        // Drop truthy `active` values
        R.when(R.propEq(true, 'active'), R.dissoc('active')),
        renameKeys({ option: 'relation', prop: 'source' })
      )
    )(filterCriteria)

    setInitialRows(initRows)
    setRows(initRows)
    setIdCount(initRows.length)
  }, [filters])

  useEffect(() => {
    restoreFilters()
  }, [restoreFilters])

  useEffect(() => {
    if (!isApiRefValid) return

    const newSelectedRowIds = R.pipe(
      R.filter(R.propOr(true, 'active')),
      R.pluck('id')
    )(initialRows)
    apiRef.current.setRowSelectionModel(newSelectedRowIds)
  }, [apiRef, initialRows, isApiRefValid])

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
        R.dissoc('active'),
        R.assoc('active', false)
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
    return !isEditing && unsavedChanges
  }, [initialRows, rowModesModel, rows])

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

  const handleCellDoubleClick = (params, event) => {
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
        type: 'singleSelect',
        editable: true,
        sortable: false,
        valueOptions: R.keys(statNames),
        preProcessEditCellProps,
        renderCell: ({ value }) => <OverflowText text={value} />,
      },
      {
        field: 'relation',
        headerName: 'Relation',
        headerAlign: 'center',
        align: 'center',
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
        type: 'number',
        editable: true,
        sortable: false,
        valueFormatter: ({ value }) =>
          typeof value === 'number'
            ? NumberFormat.format(value, numberFormat)
            : null,
        preProcessEditCellProps,
        renderCell: ({ value }) => <OverflowText text={`${value}`} />,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        headerAlign: 'right',
        align: 'right',
        type: 'actions',
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

  return (
    <>
      <Paper sx={styles.content}>
        <DataGrid
          {...{ apiRef, columns, rows, rowModesModel, processRowUpdate }}
          slots={{
            noRowsOverlay: () => (
              <Box sx={styles.emptyContent}>No constraints added</Box>
            ),
          }}
          editMode="row"
          hideFooter
          checkboxSelection
          disableColumnMenu
          disableRowSelectionOnClick
          onRowEditStop={handleRowEditStop}
          onCellDoubleClick={handleCellDoubleClick}
          onRowSelectionModelChange={handleRowSelectionCheckboxChange}
        />
        <Button
          fullWidth
          size="medium"
          sx={styles.addBtn}
          startIcon={<MdAddCircleOutline />}
          onClick={handleAddRow}
        >
          Add a Constraint
        </Button>
      </Paper>

      <Stack mt={1} spacing={1} direction="row" justifyContent="end">
        <Button
          disabled={!canDiscardOrSaveAll}
          color="error"
          variant="contained"
          startIcon={<MdRestore />}
          onClick={restoreFilters}
        >
          Discard Changes
        </Button>
        <Button
          disabled={!canDiscardOrSaveAll}
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

// NOTE: This is an unefficient quicker solution
// TODO: Work on an `PropNested`-improved solution
const GroupsFilter = ({ defaultFilters, onSave }) => {
  const [expanded, setExpanded] = useState({})
  const [filters, setFilters] = useState(defaultFilters)
  const [checkLogic, setCheckLogic] = useState('inc')
  const [searchText, setSearchText] = useState('')

  const statGroupings = useSelector(selectStatGroupings)

  const isCheckLogicExc = checkLogic === 'exc'

  const negateIfExcLogic = useCallback(
    (checked) =>
      R.when(R.both(R.isNotNil, R.always(isCheckLogicExc)), R.not)(checked),
    [isCheckLogicExc]
  )

  const visibleGroupings = useMemo(() => {
    const containsSearchText = R.pipe(
      R.toLower,
      R.includes(searchText.toLowerCase())
    )

    const resultGroupings = {}
    R.forEachObjIndexed((groupingProps, grouping) => {
      const groupingLabel = getLabelFn(statGroupings)(grouping)
      if (containsSearchText(groupingLabel)) {
        resultGroupings[grouping] = R.dissocPath(['data', 'id'])(groupingProps)
        return
      }

      resultGroupings[grouping] = { data: {} }
      const levels = R.dissoc('id')(groupingProps.data)
      const getLevelLabel = getSubLabelFn(statGroupings, grouping)
      R.forEachObjIndexed((levelValues, level) => {
        const levelLabel = getLevelLabel(level)
        if (containsSearchText(levelLabel)) {
          resultGroupings[grouping].data[level] = groupingProps.data[level]
          return
        }
        const visibleValues = R.filter(containsSearchText)(levelValues)
        if (!R.isEmpty(visibleValues)) {
          resultGroupings[grouping].data[level] = visibleValues
        }
      })(levels)

      if (R.isEmpty(resultGroupings[grouping].data)) {
        delete resultGroupings[grouping].data
      }
      if (R.isEmpty(resultGroupings[grouping])) {
        delete resultGroupings[grouping]
      }

      setExpanded(R.assoc(grouping, R.has(grouping)(resultGroupings)))
    })(statGroupings)
    return resultGroupings
  }, [searchText, statGroupings])

  const getValueChecked = useCallback(
    (grouping, level, value) =>
      R.none(
        R.where({
          option: R.equals('exc'),
          format: R.equals(grouping),
          prop: R.equals(level),
          value: R.includes(value),
        })
      )(filters),
    [filters]
  )

  const getLevelChecked = useCallback(
    (grouping, level) => {
      const visibleValues = visibleGroupings[grouping].data[level]
      const visibleExcludedLevel = R.find(
        R.where({
          option: R.equals('exc'),
          format: R.equals(grouping),
          prop: R.equals(level),
          value: R.pipe(R.intersection(visibleValues), R.isEmpty, R.not),
        })
      )(filters)

      return visibleExcludedLevel == null
        ? true // No value excluded
        : R.pipe(
              R.difference(visibleValues),
              R.isEmpty
            )(visibleExcludedLevel.value)
          ? false // All values excluded
          : null // Some values excluded
    },
    [filters, visibleGroupings]
  )

  const getGroupingChecked = useCallback(
    (grouping) => {
      const levels = visibleGroupings[grouping].data
      const visibleLevelKeys = R.keys(levels)
      const visibleExcludedLevels = R.filter(
        R.allPass([
          R.propEq('exc', 'option'),
          R.propEq(grouping, 'format'),
          R.propSatisfies(R.flip(R.includes)(visibleLevelKeys), 'prop'),
          R.converge(
            // Check if there are any visible
            // values excluded in the filter
            R.pipe(R.intersection, R.isEmpty, R.not),
            [
              R.pipe(R.prop('prop'), R.flip(R.prop)(levels)), // Visible values
              R.prop('value'),
            ]
          ),
        ])
      )(filters)

      return R.isEmpty(visibleExcludedLevels)
        ? true // No level excluded
        : visibleLevelKeys.length === visibleExcludedLevels.length &&
            R.pipe(
              R.chain(({ prop, value }) => R.difference(levels[prop])(value)),
              R.isEmpty
            )(visibleExcludedLevels)
          ? false // All levels with their values are excluded
          : null // Some levels or values excluded
    },
    [filters, visibleGroupings]
  )

  const getFilterLevelChange = useCallback(
    (currentFilters, grouping, level, mustExclude) => {
      const values = R.uniq(visibleGroupings[grouping].data[level])
      const index = R.findIndex(
        R.where({
          option: R.equals('exc'),
          format: R.equals(grouping),
          prop: R.equals(level),
        })
      )(currentFilters)

      return R.cond([
        [
          R.always(index >= 0),
          R.pipe(
            R.over(
              R.lensPath([index, 'value']),
              mustExclude
                ? // Exclude all values within this level
                  R.converge(R.concat, [R.identity, R.difference(values)])
                : R.without(values)
            ),
            // Remove filter entry if all values were cleared
            R.when(R.pipe(R.path([index, 'value']), R.isEmpty), R.dissoc(index))
          ),
        ],
        [
          R.always(mustExclude), // index < 0 => new filter entry
          R.append({
            format: grouping,
            prop: level,
            value: values,
            option: 'exc',
          }),
        ],
        [R.T, R.identity],
      ])(currentFilters)
    },
    [visibleGroupings]
  )

  const getFilterGroupingChange = useCallback(
    (currentFilters, grouping, mustExclude) => {
      const visibleLevelKeys = R.keys(visibleGroupings[grouping].data)
      R.forEach((level) => {
        currentFilters = getFilterLevelChange(
          currentFilters,
          grouping,
          level,
          mustExclude
        )
      })(visibleLevelKeys)
      return currentFilters
    },
    [getFilterLevelChange, visibleGroupings]
  )

  const getAllGroupingsChanges = useCallback(
    (currentFilters, mustExclude) => {
      const groupingKeys = R.keys(visibleGroupings)
      R.forEach((grouping) => {
        currentFilters = getFilterGroupingChange(
          currentFilters,
          grouping,
          mustExclude
        )
      })(groupingKeys)
      return currentFilters
    },
    [getFilterGroupingChange, visibleGroupings]
  )

  const handleChangeValue = useCallback(
    (grouping, level) => (event) => {
      const mustExcludeValue = event.target.checked === isCheckLogicExc
      const value = event.target.value
      const index = R.findIndex(
        R.where({
          option: R.equals('exc'),
          format: R.equals(grouping),
          prop: R.equals(level),
        })
      )(filters)
      setFilters(
        index < 0
          ? R.append({
              format: grouping,
              prop: level,
              value: [value],
              option: 'exc',
            })
          : R.pipe(
              R.over(
                R.lensPath([index, 'value']),
                mustExcludeValue ? R.append(value) : R.without([value])
              ),
              // Remove filter entry when `value` is left empty
              R.when(
                R.pipe(R.path([index, 'value']), R.isEmpty),
                R.dissoc(index)
              )
            )
      )
    },
    [filters, isCheckLogicExc]
  )

  const handleChangeLevel = useCallback(
    (grouping) => (event) => {
      const level = event.target.value
      const mustExclude = event.target.checked === isCheckLogicExc
      setFilters(getFilterLevelChange(filters, grouping, level, mustExclude))
    },
    [getFilterLevelChange, filters, isCheckLogicExc]
  )

  const handleChangeGrouping = useCallback(
    (event) => {
      const grouping = event.target.value
      const mustExclude = event.target.checked === isCheckLogicExc
      setFilters(getFilterGroupingChange(filters, grouping, mustExclude))
    },
    [getFilterGroupingChange, filters, isCheckLogicExc]
  )

  const handleSelectAll = useCallback(() => {
    setFilters(getAllGroupingsChanges(filters, isCheckLogicExc))
  }, [getAllGroupingsChanges, filters, isCheckLogicExc])

  const handleDeselectAll = useCallback(() => {
    setFilters(getAllGroupingsChanges(filters, !isCheckLogicExc))
  }, [filters, getAllGroupingsChanges, isCheckLogicExc])

  const restoreFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [defaultFilters])

  const defaultFiltersByLevel = useMemo(
    () => R.indexBy(R.prop('prop'))(defaultFilters),
    [defaultFilters]
  )

  const canDiscardOrSave = useMemo(() => {
    if (filters.length !== defaultFilters.length) return true
    return R.any((filter) => {
      const defaultFilter = defaultFiltersByLevel[filter.prop]
      // Verify level and option matches and value discrepancies
      return (
        defaultFilter != null &&
        filter.option === 'exc' &&
        defaultFilter.option === 'exc' &&
        defaultFilter.format === filter.format &&
        R.pipe(
          R.symmetricDifference(defaultFilter.value),
          R.isEmpty,
          R.not
        )(filter.value)
      )
    })(filters)
  }, [defaultFilters.length, defaultFiltersByLevel, filters])

  const handleClickSave = useCallback(() => {
    onSave(filters)
  }, [filters, onSave])

  const handleChangeCheckLogic = (event) => {
    setCheckLogic(event.target.value)
  }

  const handleChangeSearchText = (event) => {
    setSearchText(event.target.value)
  }

  const handleChangeExpanded = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? R.assoc(panel, true) : R.dissoc(panel))
  }

  return (
    <>
      <Paper sx={[styles.content, { py: 2 }]}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            sx={{ flexGrow: 1 }}
            placeholder="Search group, level or value"
            label="Search"
            value={searchText}
            onChange={handleChangeSearchText}
          />

          <ButtonGroup>
            <Button onClick={handleSelectAll}>Select All</Button>
            <Button onClick={handleDeselectAll}>Deselect All</Button>
          </ButtonGroup>
          <ToggleButtonGroup
            exclusive
            value={checkLogic}
            onChange={handleChangeCheckLogic}
          >
            <ToggleButton value="inc">Inc</ToggleButton>
            <ToggleButton value="exc">Exc</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Box overflow="auto">
          {R.pipe(
            R.mapObjIndexed((groupingProps, grouping) => {
              const levels = R.dissoc('id')(groupingProps.data)
              const checked = negateIfExcLogic(
                getGroupingChecked(grouping, levels)
              )
              return (
                <Accordion
                  key={grouping}
                  disableGutters
                  sx={styles.accordRoot}
                  slotProps={{ transition: { unmountOnExit: true } }}
                  expanded={expanded[grouping]}
                  onChange={handleChangeExpanded(grouping)}
                >
                  <AccordionSummary
                    expandIcon={<MdArrowForwardIos size={16} />}
                    sx={[styles.accordSummary, { mr: 1 }]}
                  >
                    <FormControlLabel
                      label={getLabelFn(statGroupings)(grouping)}
                      control={
                        <Checkbox
                          {...{ checked }}
                          indeterminate={checked == null}
                          color="primary"
                          value={grouping}
                          onChange={handleChangeGrouping}
                        />
                      }
                    />
                  </AccordionSummary>
                  <AccordionDetails sx={styles.accordDetails}>
                    {R.pipe(
                      R.mapObjIndexed((levelValues, level) => {
                        const values = R.uniq(levelValues)
                        const checked = negateIfExcLogic(
                          getLevelChecked(grouping, level)
                        )
                        return (
                          <Fragment key={level}>
                            <FormControlLabel
                              label={getSubLabelFn(
                                statGroupings,
                                grouping
                              )(level)}
                              control={
                                <Checkbox
                                  {...{ checked }}
                                  indeterminate={checked == null}
                                  value={level}
                                  color="primary"
                                  onChange={handleChangeLevel(grouping)}
                                />
                              }
                            />
                            <Box sx={styles.leaves}>
                              {values.map((value) => (
                                <FormControlLabel
                                  key={`${grouping}-${level}-${value}`}
                                  label={value}
                                  control={
                                    <Checkbox
                                      {...{ value }}
                                      size="small"
                                      color="primary"
                                      checked={negateIfExcLogic(
                                        getValueChecked(grouping, level, value)
                                      )}
                                      onChange={handleChangeValue(
                                        grouping,
                                        level
                                      )}
                                    />
                                  }
                                />
                              ))}
                            </Box>
                          </Fragment>
                        )
                      }),
                      R.values
                    )(levels)}
                  </AccordionDetails>
                </Accordion>
              )
            }),
            R.values
          )(visibleGroupings)}
        </Box>
      </Paper>

      <Stack mt={1} spacing={1} direction="row" justifyContent="end">
        <Button
          disabled={!canDiscardOrSave}
          color="error"
          variant="contained"
          startIcon={<MdRestore />}
          onClick={restoreFilters}
        >
          Discard Changes
        </Button>
        <Button
          disabled={!canDiscardOrSave}
          color="primary"
          variant="contained"
          startIcon={<MdCheck />}
          onClick={handleClickSave}
        >
          Save Selections
        </Button>
      </Stack>
    </>
  )
}

const FilterModal = ({
  open,
  label,
  labelExtra,
  statFilters,
  groupingFilters,
  numActiveStatFilters,
  numGroupingFilters,
  onSave,
  onClose,
}) => {
  const [filterTab, setFilterTab] = useState('stats')
  const handleChangeTab = useCallback(() => {
    setFilterTab(filterTab === 'stats' ? 'groups' : 'stats')
  }, [filterTab])

  const handleSaveFilters = R.curry((otherFilters, filters) => {
    onSave(R.concat(filters)(otherFilters))
  })

  return (
    <DataGridModal {...{ label, labelExtra, open, onClose }}>
      <Tabs variant="fullWidth" value={filterTab} onChange={handleChangeTab}>
        <Tab
          value="stats"
          label={`Statistics${
            numActiveStatFilters > 0 ? ` (${numActiveStatFilters})` : ''
          }`}
        />
        <Tab
          value="groups"
          label={`Groups${
            numGroupingFilters > 0 ? ` (${numGroupingFilters})` : ''
          }`}
        />
      </Tabs>
      {filterTab === 'stats' ? (
        <StatsFilter
          defaultFilters={statFilters}
          onSave={handleSaveFilters(groupingFilters)}
        />
      ) : filterTab === 'groups' ? (
        <GroupsFilter
          defaultFilters={groupingFilters}
          onSave={handleSaveFilters(statFilters)}
        />
      ) : null}
    </DataGridModal>
  )
}

export default FilterModal
