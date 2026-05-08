import { Badge, Box } from '@mui/material'
import * as R from 'ramda'
import { MdNotifications } from 'react-icons/md'
import { useSelector } from 'react-redux'

import { Draggable, DragHandle, useDraggable } from '.'

import { selectMessages } from '../../data/selectors'
import { draggableId } from '../../utils/enums'
import { TooltipButton } from '../compound'
import SnackBar from '../views/common/SnackBar'

const SEVERITY_ORDER = ['error', 'warning', 'info', 'success']
const SEVERITY_ABBREV = { error: 'E', warning: 'W', info: 'I', success: 'S' }

const getMostCriticalLevel = (messages) =>
  R.reduce(
    (acc, msg) =>
      SEVERITY_ORDER.indexOf(msg.snackbarType) < SEVERITY_ORDER.indexOf(acc)
        ? msg.snackbarType
        : acc,
    'success',
    R.values(messages)
  )

const styles = {
  // Override the default Draggable top:0/left:0 so the panel anchors at the
  // bottom-right corner. ReactDraggable applies transform: translate(dx, dy)
  // on top of this natural position, so dragging still works correctly.
  // With bottom: 20px the panel grows upward as new notifications are added.
  root: {
    top: 'unset',
    left: 'unset',
    bottom: '80px',
    right: '60px',
    border: 'none',
    bgcolor: 'transparent',
  },
  dragHandle: {
    p: 0.75,
    border: '1px outset rgb(128 128 128)',
    bgcolor: 'background.paper',
    borderRadius: 0,
    cursor: 'grab',
  },
  unhideBox: {
    position: 'fixed',
    bottom: '80px',
    right: '60px',
    zIndex: 2001,
  },
}

export const NotificationsUnhide = () => {
  const messages = useSelector(selectMessages)
  const draggable = useDraggable(draggableId.NOTIFICATIONS)

  const mostCriticalLevel = getMostCriticalLevel(messages)
  const hasMessages = !R.isEmpty(messages)

  return (
    <Box sx={styles.unhideBox}>
      <Badge
        badgeContent={hasMessages ? SEVERITY_ABBREV[mostCriticalLevel] : null}
        color={mostCriticalLevel}
        invisible={!hasMessages}
      >
        <TooltipButton
          title="Show notifications"
          placement="left"
          onClick={draggable.onClose}
        >
          <MdNotifications size={24} />
        </TooltipButton>
      </Badge>
    </Box>
  )
}

const NotificationsDraggable = () => {
  const draggable = useDraggable(draggableId.NOTIFICATIONS)

  // hideDrag + hideClose → showMenu becomes false, so the three-dot menu is
  // not rendered. All controls live in the SnackBar control bar instead.
  return (
    <Draggable
      component="div"
      sx={styles.root}
      hideDrag={true}
      hideClose={true}
      bounds={false}
      position={draggable.position}
      showDragHandle={true}
      onClose={draggable.onClose}
      onToggleDragHandle={draggable.onToggleDragHandle}
    >
      <SnackBar
        dragHandle={
          <DragHandle
            sx={styles.dragHandle}
            slotProps={{ icon: { size: 24 } }}
          />
        }
      />
    </Draggable>
  )
}

export default NotificationsDraggable
