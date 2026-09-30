import {
  Box,
  FormControlLabel,
  FormGroup,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Switch,
} from '@mui/material'
import PropTypes from 'prop-types'
import { useMemo, useRef } from 'react'
import ReactDraggable from 'react-draggable'
import { MdDragIndicator, MdMoreVert, MdOutlineClose } from 'react-icons/md'
import { useSelector } from 'react-redux'

import { selectMergedDraggables } from '../../data/selectors'
import { useMenu, useMutateStateWithSync } from '../../utils/hooks'
import RippleBox from '../compound/RippleBox'

import { forceArray } from '../../utils'

const styles = {
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    border: '1px outset rgb(128 128 128)',
    borderRadius: 1,
    zIndex: 2001,
  },
  dockedRoot: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
  },
  menuRoot: {
    my: 'auto',
    mr: 1,
  },
  dockedMenuRoot: {
    my: 'auto',
    ml: 'auto',
    flexShrink: 0,
  },
  dragHandle: {
    bgcolor: 'grey.800',
  },
}

export const useDraggable = (id) => {
  const draggables = useSelector(selectMergedDraggables)
  const handleToggleDraggable = useMutateStateWithSync(
    () => ({
      path: ['draggables', 'data', id, 'open'],
      value: !draggables[id]?.open,
    }),
    [draggables]
  )

  const handleToggleHandle = useMutateStateWithSync(
    (event) => ({
      path: ['draggables', 'data', id, 'showDragHandle'],
      value: event.target.checked,
    }),
    []
  )

  const handleToggleDocked = useMutateStateWithSync(
    () => ({
      path: ['draggables', 'data', id, 'docked'],
      value: !draggables[id]?.docked,
    }),
    [draggables]
  )

  return {
    position: draggables[id]?.position,
    hideDrag: draggables[id]?.hideDragOption,
    hideClose: draggables[id]?.hideCloseOption,
    hideDock: draggables[id]?.hideDockOption,
    docked: draggables[id]?.docked ?? false,
    showDragHandle: draggables[id]?.showDragHandle ?? true,
    onClose: handleToggleDraggable,
    onToggleDragHandle: handleToggleHandle,
    onToggleDocked: handleToggleDocked,
  }
}

export const DragHandle = ({ sx = [], slotProps = {} }) => {
  const rootStyle = useMemo(() => [styles.dragHandle, ...forceArray(sx)], [sx])
  return (
    <RippleBox className="drag-handle" sx={rootStyle}>
      <MdDragIndicator size={20} {...slotProps.icon} />
    </RippleBox>
  )
}

const BaseMenuItem = ({ ReactIcon, label, onClick }) => (
  <MenuItem {...{ onClick }}>
    <ReactIcon size={20} style={{ marginRight: '16px' }} />
    {label}
  </MenuItem>
)

const ToggleMenuItem = ({ disabled, label, value, onClick }) => (
  <MenuItem {...{ disabled }}>
    <FormGroup>
      <FormControlLabel
        size="small"
        {...{ label }}
        control={
          <Switch
            sx={{ mr: 1 }}
            size="small"
            checked={value}
            onChange={onClick}
          />
        }
      />
    </FormGroup>
  </MenuItem>
)

export const Draggable = ({
  component = Paper,
  sx = [],
  position,
  hideMenu,
  hideClose,
  hideDrag,
  hideDock,
  docked = false,
  showDragHandle,
  onToggleDragHandle,
  onToggleDocked,
  onClose,
  children,
  slotProps = {},
  ...props
}) => {
  const nodeRef = useRef(null)
  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  const effectiveHideDrag = hideDrag || docked

  const contentStyles = useMemo(
    () => [
      docked ? styles.dockedRoot : styles.root,
      component.type === Paper && { elevation: 7 },
      ...forceArray(slotProps.component?.sx),
      ...forceArray(sx),
    ],
    [docked, component.type, slotProps.component?.sx, sx]
  )
  const showMenu = !hideMenu && !(effectiveHideDrag && hideClose && hideDock)

  const menu = showMenu && (
    <Box
      sx={docked ? styles.dockedMenuRoot : styles.menuRoot}
      {...slotProps.menuRoot}
    >
      <IconButton size="small" onClick={handleOpenMenu}>
        <MdMoreVert />
      </IconButton>
      <Menu
        {...{ anchorEl }}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        // slotProps={{ paper: { sx: { width: '21.5ch' } } }}
        sx={{ p: 0 }}
      >
        {!effectiveHideDrag && (
          <ToggleMenuItem
            key="drag-handle-toggle"
            label="Drag Handle"
            value={showDragHandle}
            onClick={onToggleDragHandle}
          />
        )}
        {!hideDock && (
          <ToggleMenuItem
            key="dock-toggle"
            label="Dock to Status Bar"
            value={docked}
            onClick={onToggleDocked}
          />
        )}
        {!hideClose && (
          <BaseMenuItem
            key="close-draggable"
            label="Close"
            ReactIcon={MdOutlineClose}
            onClick={onClose}
          />
        )}
      </Menu>
    </Box>
  )

  const content = (
    <Box
      ref={nodeRef}
      {...{ component, ...slotProps.component }}
      sx={contentStyles}
    >
      {children}
      {menu}
    </Box>
  )

  if (docked) return content

  return (
    <ReactDraggable
      bounds="parent"
      handle=".drag-handle"
      defaultPosition={position}
      {...{ nodeRef, ...props }}
    >
      {content}
    </ReactDraggable>
  )
}
Draggable.propTypes = {
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  docked: PropTypes.bool,
  hideDock: PropTypes.bool,
  onToggleDocked: PropTypes.func,
  onClose: PropTypes.func,
  children: PropTypes.node,
}
