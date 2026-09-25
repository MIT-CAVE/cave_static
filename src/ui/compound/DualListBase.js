import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'
import { GiEmptyChessboard } from 'react-icons/gi'
import { IoSquareSharp } from 'react-icons/io5'
import {
  MdClose,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdSearch,
} from 'react-icons/md'

import FetchedIcon from './FetchedIcon'

import { forceArray, getContrastText } from '../../utils'

const DEFAULT_SIZE = '18px'
const DEFAULT_HEIGHT = 240

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 1,
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  listCard: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    overflow: 'hidden',
  },
  header: {
    px: 1.5,
    py: 0.75,
    bgcolor: 'action.hover',
    borderBottom: 1,
    borderColor: 'divider',
  },
  searchBox: {
    p: 0.5,
    borderBottom: 1,
    borderColor: 'divider',
  },
  listContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    p: 0,
    m: 0,
  },
  listItemButton: {
    py: 0.25,
    px: 1,
  },
  listItemIcon: {
    minWidth: 32,
  },
  transferButtons: {
    alignSelf: 'center',
    px: 0.25,
  },
  emptyState: {
    p: 2,
    textAlign: 'center',
    color: 'text.secondary',
    fontSize: '0.85rem',
  },
  marker: {
    verticalAlign: 'middle',
    margin: '0 6px 0 2px',
  },
}

const DualListBase = ({
  disabled,
  readOnly,
  options = [],
  indexedOptions = {},
  value = [],
  availableTitle = 'Available',
  selectedTitle = 'Selected',
  height = DEFAULT_HEIGHT,
  helperText,
  fullWidth = true,
  sx = [],
  getActiveAttrs = R.identity,
  getBaseAttrs = R.identity,
  onChange,
}) => {
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')
  const [leftChecked, setLeftChecked] = useState([])
  const [rightChecked, setRightChecked] = useState([])

  const selectedKeys = useMemo(() => forceArray(value), [value])

  const availableKeys = useMemo(
    () => R.difference(options, selectedKeys),
    [options, selectedKeys]
  )

  const filteredAvailable = useMemo(() => {
    if (!leftSearch) return availableKeys
    const query = leftSearch.toLowerCase()
    return availableKeys.filter((key) => {
      const opt = indexedOptions[key]
      const label = opt?.name ?? key
      return String(label).toLowerCase().includes(query)
    })
  }, [availableKeys, indexedOptions, leftSearch])

  const filteredSelected = useMemo(() => {
    if (!rightSearch) return selectedKeys
    const query = rightSearch.toLowerCase()
    return selectedKeys.filter((key) => {
      const opt = indexedOptions[key]
      const { activeName } = getActiveAttrs(opt)
      const label = activeName ?? opt?.name ?? key
      return String(label).toLowerCase().includes(query)
    })
  }, [getActiveAttrs, indexedOptions, rightSearch, selectedKeys])

  // Disabled options are frozen on whichever side they sit
  const isEnabled = useCallback(
    (key) => indexedOptions[key]?.enabled !== false,
    [indexedOptions]
  )

  const enabledAvailable = useMemo(
    () => availableKeys.filter(isEnabled),
    [availableKeys, isEnabled]
  )
  const enabledSelected = useMemo(
    () => selectedKeys.filter(isEnabled),
    [selectedKeys, isEnabled]
  )

  // Rows the header toggles and checked-transfer buttons operate on
  const selectableAvailable = useMemo(
    () => filteredAvailable.filter(isEnabled),
    [filteredAvailable, isEnabled]
  )
  const selectableSelected = useMemo(
    () => filteredSelected.filter(isEnabled),
    [filteredSelected, isEnabled]
  )
  const visibleLeftChecked = useMemo(
    () => selectableAvailable.filter((key) => leftChecked.includes(key)),
    [leftChecked, selectableAvailable]
  )
  const visibleRightChecked = useMemo(
    () => selectableSelected.filter((key) => rightChecked.includes(key)),
    [rightChecked, selectableSelected]
  )
  const allLeftChecked =
    selectableAvailable.length > 0 &&
    visibleLeftChecked.length === selectableAvailable.length
  const allRightChecked =
    selectableSelected.length > 0 &&
    visibleRightChecked.length === selectableSelected.length

  const handleToggleLeft = useCallback(
    (key) => {
      if (disabled || readOnly) return
      setLeftChecked(
        R.ifElse(R.includes(key), R.without([key]), R.append(key))(leftChecked)
      )
    },
    [disabled, leftChecked, readOnly]
  )

  const handleToggleRight = useCallback(
    (key) => {
      if (disabled || readOnly) return
      setRightChecked(
        R.ifElse(R.includes(key), R.without([key]), R.append(key))(rightChecked)
      )
    },
    [disabled, readOnly, rightChecked]
  )

  const handleToggleAllLeft = useCallback(() => {
    if (disabled || readOnly || selectableAvailable.length === 0) return
    setLeftChecked(
      allLeftChecked
        ? R.without(selectableAvailable, leftChecked)
        : R.uniq(R.concat(leftChecked, selectableAvailable))
    )
  }, [allLeftChecked, disabled, leftChecked, readOnly, selectableAvailable])

  const handleToggleAllRight = useCallback(() => {
    if (disabled || readOnly || selectableSelected.length === 0) return
    setRightChecked(
      allRightChecked
        ? R.without(selectableSelected, rightChecked)
        : R.uniq(R.concat(rightChecked, selectableSelected))
    )
  }, [allRightChecked, disabled, readOnly, rightChecked, selectableSelected])

  const handleAddItem = useCallback(
    (key) => {
      if (disabled || readOnly || !isEnabled(key)) return
      const next = R.append(key, selectedKeys)
      setLeftChecked(R.without([key], leftChecked))
      onChange(next)
    },
    [disabled, isEnabled, leftChecked, onChange, readOnly, selectedKeys]
  )

  const handleRemoveItem = useCallback(
    (key) => {
      if (disabled || readOnly || !isEnabled(key)) return
      const next = R.without([key], selectedKeys)
      setRightChecked(R.without([key], rightChecked))
      onChange(next)
    },
    [disabled, isEnabled, onChange, readOnly, rightChecked, selectedKeys]
  )

  // Only checked rows that are currently visible get moved
  const handleTransferRight = useCallback(() => {
    if (disabled || readOnly || visibleLeftChecked.length === 0) return
    const next = R.uniq(R.concat(selectedKeys, visibleLeftChecked))
    setLeftChecked(R.without(visibleLeftChecked, leftChecked))
    onChange(next)
  }, [
    disabled,
    leftChecked,
    onChange,
    readOnly,
    selectedKeys,
    visibleLeftChecked,
  ])

  const handleTransferLeft = useCallback(() => {
    if (disabled || readOnly || visibleRightChecked.length === 0) return
    const next = R.without(visibleRightChecked, selectedKeys)
    setRightChecked(R.without(visibleRightChecked, rightChecked))
    onChange(next)
  }, [
    disabled,
    onChange,
    readOnly,
    rightChecked,
    selectedKeys,
    visibleRightChecked,
  ])

  const handleSelectAll = useCallback(() => {
    if (disabled || readOnly) return
    const toAdd = (leftSearch ? filteredAvailable : availableKeys).filter(
      isEnabled
    )
    if (toAdd.length === 0) return
    const next = R.uniq(R.concat(selectedKeys, toAdd))
    setLeftChecked(R.without(toAdd, leftChecked))
    onChange(next)
  }, [
    availableKeys,
    disabled,
    filteredAvailable,
    isEnabled,
    leftChecked,
    leftSearch,
    onChange,
    readOnly,
    selectedKeys,
  ])

  const handleClearAll = useCallback(() => {
    if (disabled || readOnly) return
    const toRemove = (rightSearch ? filteredSelected : selectedKeys).filter(
      isEnabled
    )
    if (toRemove.length === 0) return
    const next = R.without(toRemove, selectedKeys)
    setRightChecked(R.without(toRemove, rightChecked))
    onChange(next)
  }, [
    disabled,
    filteredSelected,
    isEnabled,
    onChange,
    readOnly,
    rightChecked,
    rightSearch,
    selectedKeys,
  ])

  return (
    <FormControl sx={[fullWidth && { width: '100%' }, ...forceArray(sx)]}>
      <Box sx={[styles.root, { height }]}>
        {/* Available List Box */}
        <Paper elevation={0} sx={styles.listCard}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={styles.header}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, fontSize: '0.8rem' }}
            >
              {`${availableTitle} (${filteredAvailable.length})`}
            </Typography>
            {!(disabled || readOnly) && selectableAvailable.length > 0 && (
              <Button
                size="small"
                color="primary"
                onClick={handleToggleAllLeft}
                sx={{ py: 0, px: 0.75, minWidth: 'auto', fontSize: '0.7rem' }}
              >
                {`${allLeftChecked ? 'Deselect' : 'Select'} ${leftSearch ? 'filtered' : 'all'}`}
              </Button>
            )}
          </Stack>
          <Box sx={styles.searchBox}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search available..."
              value={leftSearch}
              disabled={disabled}
              onChange={(e) => setLeftSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdSearch size={16} />
                    </InputAdornment>
                  ),
                  endAdornment: leftSearch && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setLeftSearch('')}
                        edge="end"
                      >
                        <MdClose size={14} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.8rem', height: 28 },
                },
              }}
            />
          </Box>
          <List dense sx={styles.listContainer}>
            {filteredAvailable.length === 0 ? (
              <Box sx={styles.emptyState}>
                {availableKeys.length === 0
                  ? 'All items selected'
                  : 'No matching items'}
              </Box>
            ) : (
              filteredAvailable.map((key) => {
                const opt = indexedOptions[key] ?? {}
                const { icon, color, size, name } = getBaseAttrs(opt)
                const label = name ?? opt.name ?? key
                const isChecked = leftChecked.includes(key)
                return (
                  <ListItem
                    key={key}
                    disablePadding
                    secondaryAction={
                      !(disabled || readOnly) &&
                      opt.enabled !== false && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleAddItem(key)}
                          title="Add item"
                          sx={{ mr: 0.5 }}
                        >
                          <MdKeyboardArrowRight size={18} />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemButton
                      dense
                      disabled={disabled || readOnly || opt.enabled === false}
                      onClick={() => handleToggleLeft(key)}
                      onDoubleClick={() => handleAddItem(key)}
                      sx={styles.listItemButton}
                    >
                      <ListItemIcon sx={styles.listItemIcon}>
                        <Checkbox
                          edge="start"
                          checked={isChecked}
                          tabIndex={-1}
                          disableRipple
                          size="small"
                        />
                      </ListItemIcon>
                      {icon ? (
                        <FetchedIcon
                          iconName={icon}
                          color={color}
                          size={size ?? DEFAULT_SIZE}
                          style={styles.marker}
                        />
                      ) : color ? (
                        <IoSquareSharp
                          color={color}
                          size={size ?? DEFAULT_SIZE}
                          style={styles.marker}
                        />
                      ) : size ? (
                        <GiEmptyChessboard
                          size={size ?? DEFAULT_SIZE}
                          style={styles.marker}
                        />
                      ) : null}
                      <ListItemText
                        primary={label}
                        primaryTypographyProps={{
                          noWrap: true,
                          variant: 'body2',
                          fontSize: '0.82rem',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })
            )}
          </List>
        </Paper>

        {/* Transfer Action Controls */}
        <Stack
          spacing={0.5}
          justifyContent="center"
          alignItems="center"
          sx={styles.transferButtons}
        >
          <Tooltip title="Move all to selected" placement="top">
            <span>
              <IconButton
                size="small"
                disabled={disabled || readOnly || enabledAvailable.length === 0}
                onClick={handleSelectAll}
              >
                <MdKeyboardDoubleArrowRight size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move checked to selected" placement="top">
            <span>
              <IconButton
                size="small"
                disabled={
                  disabled || readOnly || visibleLeftChecked.length === 0
                }
                onClick={handleTransferRight}
              >
                <MdKeyboardArrowRight size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move checked to available" placement="bottom">
            <span>
              <IconButton
                size="small"
                disabled={
                  disabled || readOnly || visibleRightChecked.length === 0
                }
                onClick={handleTransferLeft}
              >
                <MdKeyboardArrowLeft size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Remove all selected" placement="bottom">
            <span>
              <IconButton
                size="small"
                disabled={disabled || readOnly || enabledSelected.length === 0}
                onClick={handleClearAll}
              >
                <MdKeyboardDoubleArrowLeft size={18} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {/* Selected List Box */}
        <Paper elevation={0} sx={styles.listCard}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={styles.header}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, fontSize: '0.8rem' }}
            >
              {`${selectedTitle} (${filteredSelected.length})`}
            </Typography>
            {!(disabled || readOnly) && selectableSelected.length > 0 && (
              <Button
                size="small"
                color="primary"
                onClick={handleToggleAllRight}
                sx={{ py: 0, px: 0.75, minWidth: 'auto', fontSize: '0.7rem' }}
              >
                {`${allRightChecked ? 'Deselect' : 'Select'} ${rightSearch ? 'filtered' : 'all'}`}
              </Button>
            )}
          </Stack>
          <Box sx={styles.searchBox}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search selected..."
              value={rightSearch}
              disabled={disabled}
              onChange={(e) => setRightSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdSearch size={16} />
                    </InputAdornment>
                  ),
                  endAdornment: rightSearch && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setRightSearch('')}
                        edge="end"
                      >
                        <MdClose size={14} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.8rem', height: 28 },
                },
              }}
            />
          </Box>
          <List dense sx={styles.listContainer}>
            {filteredSelected.length === 0 ? (
              <Box sx={styles.emptyState}>
                {selectedKeys.length === 0
                  ? 'No items selected'
                  : 'No matching items'}
              </Box>
            ) : (
              filteredSelected.map((key) => {
                const opt = indexedOptions[key] ?? {}
                const { activeIcon, activeColor, activeSize, activeName } =
                  getActiveAttrs(opt)
                const contrastText = getContrastText(activeColor)
                const label = activeName ?? opt.name ?? key
                const isChecked = rightChecked.includes(key)
                return (
                  <ListItem
                    key={key}
                    disablePadding
                    secondaryAction={
                      !(disabled || readOnly) &&
                      opt.enabled !== false && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveItem(key)}
                          title="Remove item"
                          sx={{ mr: 0.5 }}
                        >
                          <MdClose size={16} />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemButton
                      dense
                      disabled={disabled || readOnly || opt.enabled === false}
                      onClick={() => handleToggleRight(key)}
                      onDoubleClick={() => handleRemoveItem(key)}
                      sx={styles.listItemButton}
                    >
                      <ListItemIcon sx={styles.listItemIcon}>
                        <Checkbox
                          edge="start"
                          checked={isChecked}
                          tabIndex={-1}
                          disableRipple
                          size="small"
                        />
                      </ListItemIcon>
                      {activeIcon ? (
                        <FetchedIcon
                          iconName={activeIcon}
                          color={activeColor ?? contrastText}
                          size={activeSize ?? DEFAULT_SIZE}
                          style={styles.marker}
                        />
                      ) : activeColor ? (
                        <IoSquareSharp
                          color={activeColor}
                          size={activeSize ?? DEFAULT_SIZE}
                          style={styles.marker}
                        />
                      ) : activeSize ? (
                        <GiEmptyChessboard
                          size={activeSize ?? DEFAULT_SIZE}
                          style={styles.marker}
                        />
                      ) : null}
                      <ListItemText
                        primary={label}
                        primaryTypographyProps={{
                          noWrap: true,
                          variant: 'body2',
                          fontSize: '0.82rem',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })
            )}
          </List>
        </Paper>
      </Box>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  )
}

DualListBase.propTypes = {
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  helperText: PropTypes.string,
  options: PropTypes.array,
  indexedOptions: PropTypes.object,
  value: PropTypes.array,
  availableTitle: PropTypes.string,
  selectedTitle: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fullWidth: PropTypes.bool,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  getActiveAttrs: PropTypes.func,
  getBaseAttrs: PropTypes.func,
  onChange: PropTypes.func,
}

export default DualListBase
