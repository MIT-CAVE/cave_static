import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Fragment, useEffect, useRef, useState } from 'react'
import { AiFillCloseCircle } from 'react-icons/ai'
import {
  MdCancelPresentation,
  MdFilterListAlt,
  MdFormatListNumbered,
  MdVisibilityOff,
  MdVisibility,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import { TransitionGroup } from 'react-transition-group'

import { selectMessages } from '../../../data/selectors'
import {
  clearMessages,
  removeMessage,
} from '../../../data/utilities/messagesSlice'
import {
  MESSAGE_SEVERITY_ORDER,
  MESSAGE_FILTER_OPTIONS,
} from '../../../utils/constants'
import { useMenu } from '../../../utils/hooks'

import { TooltipButton } from '../../compound'

const styles = {
  // column-reverse: control bar is first in DOM (appears at bottom),
  // alerts are second in DOM (appear above the control bar).
  // With the draggable anchored at bottom: 20px the whole panel grows upward.
  root: {
    display: 'flex',
    flexDirection: 'column-reverse',
  },
  alert: { width: '700px' },
  controlBar: {
    bgcolor: 'grey.800',
    p: 0.5,
    gap: 0.5,
    justifyContent: 'flex-end',
  },
  activeButton: {
    border: '2px solid',
    borderColor: 'primary.main',
    color: 'primary.main',
  },
  limitPopoverContent: {
    p: 1.5,
    display: 'flex',
    gap: 1,
    alignItems: 'center',
  },
  limitInput: { width: 80 },
}

const SnackBar = ({ dragHandle }) => {
  const messages = useSelector(selectMessages)
  const dispatch = useDispatch()

  const [filterLevel, setFilterLevel] = useState(null)
  const [limit, setLimit] = useState(null)
  const [limitInput, setLimitInput] = useState('')
  const [isHidden, setIsHidden] = useState(false)

  const {
    anchorEl: filterAnchorEl,
    handleOpenMenu: handleOpenFilter,
    handleCloseMenu: handleCloseFilter,
  } = useMenu()
  const {
    anchorEl: limitAnchorEl,
    handleOpenMenu: handleOpenLimit,
    handleCloseMenu: handleCloseLimit,
  } = useMenu()

  const closingTimers = useRef({})

  useEffect(
    () => () => {
      R.forEach((item) => clearTimeout(item), R.values(closingTimers.current))
    },
    []
  )

  useEffect(() => {
    R.mapObjIndexed((message, messageId) => {
      if (
        R.has('duration', message) &&
        !R.has(messageId, closingTimers.current)
      ) {
        closingTimers.current[messageId] = setTimeout(() => {
          closingTimers.current = R.dissoc(messageId, closingTimers.current)
          dispatch(removeMessage({ messageKey: messageId }))
        }, message.duration * 1000)
      }
    }, messages)
  }, [messages, dispatch])

  const handleClose = R.thunkify((messageKey) => {
    if (R.has(messageKey, closingTimers.current)) {
      clearTimeout(closingTimers.current[messageKey])
      closingTimers.current = R.dissoc(messageKey, closingTimers.current)
    }
    dispatch(removeMessage({ messageKey: messageKey }))
  })

  const handleClear = () => {
    R.forEach((item) => clearTimeout(item), R.values(closingTimers.current))
    closingTimers.current = {}
    dispatch(clearMessages())
  }

  const handleSelectFilter = (value) => () => {
    setFilterLevel(value)
    handleCloseFilter(null)
  }

  const handleApplyLimit = () => {
    const parsed = parseInt(limitInput, 10)
    setLimit(parsed > 0 ? parsed : null)
    handleCloseLimit(null)
  }

  const handleLimitKeyDown = (event) => {
    if (event.key === 'Enter') handleApplyLimit()
  }

  const visibleMessages = isHidden
    ? {}
    : R.pipe(
        R.toPairs,
        R.filter(
          ([, msg]) =>
            filterLevel == null ||
            MESSAGE_SEVERITY_ORDER.indexOf(msg.snackbarType) <=
              MESSAGE_SEVERITY_ORDER.indexOf(filterLevel)
        ),
        R.sortBy(([id]) => parseInt(id)),
        limit != null ? R.takeLast(limit) : R.identity,
        R.fromPairs
      )(messages)

  const closingButton = (maxKey) => (
    <Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose(maxKey)}
      >
        <AiFillCloseCircle fontSize="large" />
      </IconButton>
    </Fragment>
  )

  const caveAlert = (message, messageId) => (
    <Collapse key={messageId}>
      <Alert
        severity={message.snackbarType}
        action={closingButton(messageId)}
        sx={styles.alert}
      >
        <AlertTitle>{message.title}</AlertTitle>
        {message.message}
      </Alert>
    </Collapse>
  )

  return (
    <Box sx={styles.root}>
      {/* First in DOM = bottom of the panel (column-reverse) */}
      <Stack direction="row" sx={styles.controlBar}>
        <Box sx={{ mr: 'auto' }}>{dragHandle}</Box>
        <TooltipButton
          title="Clear all notifications"
          placement="top"
          onClick={handleClear}
        >
          <MdCancelPresentation size={24} />
        </TooltipButton>

        <TooltipButton
          title={`Filter: ${filterLevel ?? 'All'}`}
          placement="top"
          sx={filterLevel != null ? styles.activeButton : []}
          onClick={handleOpenFilter}
        >
          <MdFilterListAlt size={24} />
        </TooltipButton>
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleCloseFilter}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          {MESSAGE_FILTER_OPTIONS.map(({ label, value }) => (
            <MenuItem
              key={label}
              selected={filterLevel === value}
              onClick={handleSelectFilter(value)}
            >
              {label}
            </MenuItem>
          ))}
        </Menu>

        <TooltipButton
          title={limit != null ? `Limit: last ${limit}` : 'Limit notifications'}
          placement="top"
          sx={limit != null ? styles.activeButton : []}
          onClick={(event) => {
            setLimitInput(limit != null ? String(limit) : '')
            handleOpenLimit(event)
          }}
        >
          <MdFormatListNumbered size={24} />
        </TooltipButton>
        <Popover
          open={Boolean(limitAnchorEl)}
          anchorEl={limitAnchorEl}
          onClose={handleCloseLimit}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Box sx={styles.limitPopoverContent}>
            <TextField
              sx={styles.limitInput}
              size="small"
              type="number"
              label="Last N"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              onKeyDown={handleLimitKeyDown}
              autoFocus
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <Button size="small" variant="contained" onClick={handleApplyLimit}>
              Apply
            </Button>
            {limit != null && (
              <Button
                size="small"
                onClick={() => {
                  setLimit(null)
                  handleCloseLimit(null)
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Popover>

        <TooltipButton
          title={isHidden ? 'Show notifications' : 'Hide notifications'}
          placement="top"
          sx={isHidden ? styles.activeButton : []}
          onClick={() => setIsHidden((prev) => !prev)}
        >
          {isHidden ? (
            <MdVisibility size={24} />
          ) : (
            <MdVisibilityOff size={24} />
          )}
        </TooltipButton>
      </Stack>

      {/* Second in DOM = above the control bar (column-reverse) */}
      <TransitionGroup>
        {R.pipe(
          R.mapObjIndexed((message, messageKey) =>
            caveAlert(message, messageKey)
          ),
          R.values
        )(visibleMessages)}
      </TransitionGroup>
    </Box>
  )
}

SnackBar.propTypes = {
  dragHandle: PropTypes.node,
}

export default SnackBar
