import {
  Box,
  Button,
  Checkbox,
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

  const handleAddItem = useCallback(
    (key) => {
      if (disabled || readOnly) return
      const next = R.append(key, selectedKeys)
      setLeftChecked(R.without([key], leftChecked))
      onChange(next)
    },
    [disabled, leftChecked, onChange, readOnly, selectedKeys]
  )

  const handleRemoveItem = useCallback(
    (key) => {
      if (disabled || readOnly) return
      const next = R.without([key], selectedKeys)
      setRightChecked(R.without([key], rightChecked))
      onChange(next)
    },
    [disabled, onChange, readOnly, rightChecked, selectedKeys]
  )

  const handleTransferRight = useCallback(() => {
    if (disabled || readOnly) return
    const toMove = leftChecked.length > 0 ? leftChecked : filteredAvailable
    if (toMove.length === 0) return
    const next = R.uniq(R.concat(selectedKeys, toMove))
    setLeftChecked([])
    onChange(next)
  }, [
    disabled,
    filteredAvailable,
    leftChecked,
    onChange,
    readOnly,
    selectedKeys,
  ])

  const handleTransferLeft = useCallback(() => {
    if (disabled || readOnly) return
    const toRemove = rightChecked.length > 0 ? rightChecked : filteredSelected
    if (toRemove.length === 0) return
    const next = R.without(toRemove, selectedKeys)
    setRightChecked([])
    onChange(next)
  }, [
    disabled,
    filteredSelected,
    onChange,
    readOnly,
    rightChecked,
    selectedKeys,
  ])

  const handleSelectAll = useCallback(() => {
    if (disabled || readOnly || availableKeys.length === 0) return
    const toAdd = leftSearch ? filteredAvailable : availableKeys
    const next = R.uniq(R.concat(selectedKeys, toAdd))
    setLeftChecked([])
    onChange(next)
  }, [
    availableKeys,
    disabled,
    filteredAvailable,
    leftSearch,
    onChange,
    readOnly,
    selectedKeys,
  ])

  const handleClearAll = useCallback(() => {
    if (disabled || readOnly || selectedKeys.length === 0) return
    const toRemove = rightSearch ? filteredSelected : selectedKeys
    const next = R.without(toRemove, selectedKeys)
    setRightChecked([])
    onChange(next)
  }, [
    disabled,
    filteredSelected,
    onChange,
    readOnly,
    rightSearch,
    selectedKeys,
  ])

  return (
    <Box
      sx={[
        styles.root,
        { height },
        fullWidth && { width: '100%' },
        ...forceArray(sx),
      ]}
    >
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
          {!(disabled || readOnly) && availableKeys.length > 0 && (
            <Button
              size="small"
              color="primary"
              onClick={handleSelectAll}
              sx={{ py: 0, px: 0.75, minWidth: 'auto', fontSize: '0.7rem' }}
            >
              Select all
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
                    !(disabled || readOnly) && (
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
              disabled={disabled || readOnly || availableKeys.length === 0}
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
                disabled ||
                readOnly ||
                (leftChecked.length === 0 && filteredAvailable.length === 0)
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
                disabled ||
                readOnly ||
                (rightChecked.length === 0 && filteredSelected.length === 0)
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
              disabled={disabled || readOnly || selectedKeys.length === 0}
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
          {!(disabled || readOnly) && selectedKeys.length > 0 && (
            <Button
              size="small"
              color="primary"
              onClick={handleClearAll}
              sx={{ py: 0, px: 0.75, minWidth: 'auto', fontSize: '0.7rem' }}
            >
              Clear all
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
                    !(disabled || readOnly) && (
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
                    disabled={disabled || readOnly}
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
  )
}

DualListBase.propTypes = {
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
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
