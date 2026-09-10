import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useMemo, useRef, useState } from 'react'
import { GiEmptyChessboard } from 'react-icons/gi'
import { IoSquareSharp } from 'react-icons/io5'
import {
  MdArrowDropDown,
  MdArrowDropUp,
  MdClose,
  MdSearch,
} from 'react-icons/md'

import FetchedIcon from './FetchedIcon'

import { forceArray, getContrastText } from '../../utils'

const DEFAULT_SIZE = '18px'

const styles = {
  triggerRoot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '56px',
    maxHeight: '56px',
    height: '56px',
    px: 1.5,
    py: 0.5,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    cursor: 'pointer',
    bgcolor: 'background.paper',
    boxSizing: 'border-box',
    overflow: 'hidden',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:hover': {
      borderColor: 'text.secondary',
    },
  },
  triggerOpen: {
    borderColor: 'primary.main',
    boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
  },
  triggerDisabled: {
    cursor: 'default',
    opacity: 0.5,
    '&:hover': {
      borderColor: 'divider',
    },
  },
  triggerContent: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    mr: 1,
  },
  triggerChips: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 0.75,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  placeholder: {
    color: 'text.secondary',
    fontSize: '0.9rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  moreChip: {
    fontWeight: 600,
    fontSize: '0.75rem',
    bgcolor: 'action.selected',
    flexShrink: 0,
  },
  adornments: {
    flexShrink: 0,
    ml: 0.5,
  },
  iconBtn: {
    p: 0.5,
  },
  popoverPaper: {
    mt: 0.5,
    borderRadius: 1.5,
    boxShadow: 4,
    border: 1,
    borderColor: 'divider',
    overflow: 'hidden',
    bgcolor: 'background.paper',
  },
  popoverContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 440,
    minWidth: 300,
  },
  searchBox: {
    p: 1.25,
    borderBottom: 1,
    borderColor: 'divider',
    bgcolor: 'action.hover',
  },
  selectedSection: {
    px: 1.25,
    py: 1,
    borderBottom: 1,
    borderColor: 'divider',
    bgcolor: 'action.hover',
  },
  sectionHeader: {
    mb: 0.75,
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: '0.75rem',
    color: 'text.secondary',
    letterSpacing: '0.05em',
  },
  headerBtn: {
    py: 0,
    px: 0.75,
    minWidth: 'auto',
    fontSize: '0.72rem',
    textTransform: 'none',
  },
  selectedChipsBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 0.5,
    maxHeight: 100,
    overflowY: 'auto',
    py: 0.25,
  },
  optionsSection: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    overflow: 'hidden',
    px: 1.25,
    py: 1,
  },
  optionsList: {
    flexGrow: 1,
    overflowY: 'auto',
    maxHeight: 210,
    p: 0,
  },
  optionButton: {
    py: 0.25,
    px: 0.75,
    borderRadius: 1,
  },
  optionIcon: {
    minWidth: 32,
  },
  marker: {
    verticalAlign: 'middle',
    margin: '0 6px 0 2px',
    flexShrink: 0,
  },
  emptyState: {
    p: 2,
    textAlign: 'center',
    color: 'text.secondary',
    fontSize: '0.85rem',
  },
  getChip: ({ activeColor, contrastText }) => ({
    bgcolor: activeColor,
    flexShrink: 0,
    '.MuiChip-label, .MuiChip-deleteIcon': {
      color: contrastText,
      opacity: 0.7,
    },
  }),
}

const ComboboxMultiBase = ({
  disabled,
  readOnly,
  placeholder,
  options = [],
  indexedOptions = {},
  value = [],
  numVisibleTags = 1,
  fullWidth = true,
  sx = [],
  getActiveAttrs = R.identity,
  getBaseAttrs = R.identity,
  onChange,
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  const selectedKeys = useMemo(() => forceArray(value), [value])

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const query = search.toLowerCase()
    return options.filter((key) => {
      const opt = indexedOptions[key]
      const label = opt?.name ?? key
      return String(label).toLowerCase().includes(query)
    })
  }, [indexedOptions, options, search])

  const allFilteredSelected = useMemo(() => {
    if (filteredOptions.length === 0) return false
    return filteredOptions.every((key) => selectedKeys.includes(key))
  }, [filteredOptions, selectedKeys])

  const handleToggle = useCallback(
    (key) => {
      if (disabled || readOnly) return
      const next = R.ifElse(
        R.includes(key),
        R.without([key]),
        R.append(key)
      )(selectedKeys)
      onChange(next)
    },
    [disabled, onChange, readOnly, selectedKeys]
  )

  const handleRemove = useCallback(
    (key) => {
      if (disabled || readOnly) return
      onChange(R.without([key], selectedKeys))
    },
    [disabled, onChange, readOnly, selectedKeys]
  )

  const handleClearAll = useCallback(() => {
    if (disabled || readOnly) return
    onChange([])
  }, [disabled, onChange, readOnly])

  const handleSelectFiltered = useCallback(() => {
    if (disabled || readOnly || filteredOptions.length === 0) return
    onChange(R.uniq(R.concat(selectedKeys, filteredOptions)))
  }, [disabled, filteredOptions, onChange, readOnly, selectedKeys])

  const handleDeselectFiltered = useCallback(() => {
    if (disabled || readOnly || filteredOptions.length === 0) return
    onChange(R.without(filteredOptions, selectedKeys))
  }, [disabled, filteredOptions, onChange, readOnly, selectedKeys])

  const effectiveLimit = Math.max(0, Number(numVisibleTags ?? 1))

  return (
    <>
      <Box
        ref={containerRef}
        onClick={() => {
          if (!disabled && !readOnly) setOpen((prev) => !prev)
        }}
        sx={[
          styles.triggerRoot,
          open && styles.triggerOpen,
          (disabled || readOnly) && styles.triggerDisabled,
          fullWidth && { width: '100%' },
          ...forceArray(sx),
        ]}
      >
        <Box sx={styles.triggerContent}>
          {selectedKeys.length === 0 ? (
            <Typography sx={styles.placeholder}>
              {placeholder || 'Select options...'}
            </Typography>
          ) : (
            <Box sx={styles.triggerChips}>
              {selectedKeys.slice(0, effectiveLimit).map((key) => {
                const opt = indexedOptions[key] ?? {}
                const { activeIcon, activeColor, activeSize, activeName } =
                  getActiveAttrs(opt)
                const contrastText = getContrastText(activeColor)
                return (
                  <Chip
                    key={key}
                    size="small"
                    label={activeName ?? opt.name ?? key}
                    {...(activeIcon && {
                      icon: (
                        <FetchedIcon
                          iconName={activeIcon}
                          color={contrastText}
                          size={activeSize ?? DEFAULT_SIZE}
                        />
                      ),
                    })}
                    sx={styles.getChip({ activeColor, contrastText })}
                    onDelete={
                      disabled || readOnly
                        ? undefined
                        : (e) => {
                            e.stopPropagation()
                            handleRemove(key)
                          }
                    }
                  />
                )
              })}
              {selectedKeys.length > effectiveLimit && (
                <Chip
                  size="small"
                  label={`+${selectedKeys.length - effectiveLimit} more`}
                  sx={styles.moreChip}
                />
              )}
            </Box>
          )}
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.25}
          sx={styles.adornments}
        >
          {selectedKeys.length > 0 && !(disabled || readOnly) && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleClearAll()
              }}
              title="Clear all"
              sx={styles.iconBtn}
            >
              <MdClose size={16} />
            </IconButton>
          )}
          <IconButton size="small" tabIndex={-1} sx={styles.iconBtn}>
            {open ? <MdArrowDropUp size={22} /> : <MdArrowDropDown size={22} />}
          </IconButton>
        </Stack>
      </Box>

      <Popover
        open={open && Boolean(containerRef.current)}
        anchorEl={containerRef.current}
        onClose={() => {
          setOpen(false)
          setSearch('')
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: [
              styles.popoverPaper,
              {
                width: containerRef.current
                  ? Math.max(containerRef.current.offsetWidth, 320)
                  : 320,
              },
            ],
          },
        }}
      >
        <Box sx={styles.popoverContainer}>
          {/* 1. Search Bar */}
          <Box sx={styles.searchBox}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="Search options..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdSearch size={18} />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearch('')}
                        edge="end"
                      >
                        <MdClose size={16} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.85rem' },
                },
              }}
            />
          </Box>

          {/* 2. Selected Chips Section */}
          {selectedKeys.length > 0 && (
            <Box sx={styles.selectedSection}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={styles.sectionHeader}
              >
                <Typography variant="caption" sx={styles.sectionTitle}>
                  {`SELECTED (${selectedKeys.length})`}
                </Typography>
                <Button
                  size="small"
                  color="primary"
                  onClick={handleClearAll}
                  sx={styles.headerBtn}
                >
                  Clear all
                </Button>
              </Stack>
              <Box sx={styles.selectedChipsBox}>
                {selectedKeys.map((key) => {
                  const opt = indexedOptions[key] ?? {}
                  const { activeIcon, activeColor, activeSize, activeName } =
                    getActiveAttrs(opt)
                  const contrastText = getContrastText(activeColor)
                  return (
                    <Chip
                      key={key}
                      size="small"
                      label={activeName ?? opt.name ?? key}
                      {...(activeIcon && {
                        icon: (
                          <FetchedIcon
                            iconName={activeIcon}
                            color={contrastText}
                            size={activeSize ?? DEFAULT_SIZE}
                          />
                        ),
                      })}
                      sx={styles.getChip({ activeColor, contrastText })}
                      onDelete={() => handleRemove(key)}
                    />
                  )
                })}
              </Box>
            </Box>
          )}

          {/* 3. Options List Section */}
          <Box sx={styles.optionsSection}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={styles.sectionHeader}
            >
              <Typography variant="caption" sx={styles.sectionTitle}>
                {`OPTIONS (${filteredOptions.length})`}
              </Typography>
              {filteredOptions.length > 0 && (
                <Button
                  size="small"
                  color="primary"
                  onClick={
                    allFilteredSelected
                      ? handleDeselectFiltered
                      : handleSelectFiltered
                  }
                  sx={styles.headerBtn}
                >
                  {allFilteredSelected
                    ? 'Deselect filtered'
                    : 'Select all filtered'}
                </Button>
              )}
            </Stack>
            <List dense sx={styles.optionsList}>
              {filteredOptions.length === 0 ? (
                <Box sx={styles.emptyState}>No matching options found</Box>
              ) : (
                filteredOptions.map((key) => {
                  const opt = indexedOptions[key] ?? {}
                  const isChecked = selectedKeys.includes(key)
                  const { activeIcon, activeColor, activeSize, activeName } =
                    getActiveAttrs(opt)
                  const {
                    icon: baseIcon,
                    color: baseColor,
                    size: baseSize,
                    name: baseName,
                  } = getBaseAttrs(opt)
                  const currentLabel = isChecked
                    ? (activeName ?? baseName ?? key)
                    : (baseName ?? key)
                  const currentIcon = isChecked ? activeIcon : baseIcon
                  const currentColor = isChecked ? activeColor : baseColor
                  const currentSize = isChecked ? activeSize : baseSize
                  return (
                    <ListItem key={key} disablePadding>
                      <ListItemButton
                        dense
                        disabled={opt.enabled === false}
                        onClick={() => handleToggle(key)}
                        sx={styles.optionButton}
                      >
                        <ListItemIcon sx={styles.optionIcon}>
                          <Checkbox
                            edge="start"
                            checked={isChecked}
                            tabIndex={-1}
                            disableRipple
                            size="small"
                          />
                        </ListItemIcon>
                        {currentIcon ? (
                          <FetchedIcon
                            iconName={currentIcon}
                            color={currentColor}
                            size={currentSize ?? DEFAULT_SIZE}
                            style={styles.marker}
                          />
                        ) : currentColor ? (
                          <IoSquareSharp
                            color={currentColor}
                            size={currentSize ?? DEFAULT_SIZE}
                            style={styles.marker}
                          />
                        ) : currentSize ? (
                          <GiEmptyChessboard
                            size={currentSize ?? DEFAULT_SIZE}
                            style={styles.marker}
                          />
                        ) : null}
                        <ListItemText
                          primary={currentLabel}
                          primaryTypographyProps={{
                            noWrap: true,
                            variant: 'body2',
                            fontSize: '0.85rem',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })
              )}
            </List>
          </Box>
        </Box>
      </Popover>
    </>
  )
}

ComboboxMultiBase.propTypes = {
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.array,
  indexedOptions: PropTypes.object,
  value: PropTypes.array,
  numVisibleTags: PropTypes.number,
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

export default ComboboxMultiBase
