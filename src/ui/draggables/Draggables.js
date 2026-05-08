import * as R from 'ramda'
import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import GlobalOutputsDraggable from './GlobalOutputsDraggable'
import NotificationsDraggable, {
  NotificationsUnhide,
} from './NotificationsDraggable'
import SessionDraggable from './SessionDraggable'
import TimeDraggable from './TimeDraggable'

import { sendCommand } from '../../data/data'
import { mutateLocal } from '../../data/local'
import {
  selectGlobalOutputProps,
  selectMergedDraggables,
  selectMessages,
} from '../../data/selectors'
import { draggableId } from '../../utils/enums'

const Draggables = () => {
  const draggables = useSelector(selectMergedDraggables)
  const props = useSelector(selectGlobalOutputProps)
  const messages = useSelector(selectMessages)
  const dispatch = useDispatch()

  const messageCountRef = useRef(0)
  const messageCount = R.keys(messages).length
  const notifOpen = draggables[draggableId.NOTIFICATIONS]?.open

  // Auto-open on new messages; auto-close when all messages are gone
  useEffect(() => {
    if (messageCount > messageCountRef.current && !notifOpen) {
      dispatch(
        mutateLocal({
          path: ['draggables', 'data', draggableId.NOTIFICATIONS, 'open'],
          value: true,
        })
      )
    } else if (messageCount === 0 && notifOpen) {
      dispatch(
        mutateLocal({
          path: ['draggables', 'data', draggableId.NOTIFICATIONS, 'open'],
          value: false,
        })
      )
    }
    messageCountRef.current = messageCount
  }, [messageCount, notifOpen, dispatch])

  const anyDraggableGlobalOutput = useMemo(
    () => R.pipe(R.values, R.any(R.prop('draggable')))(props),
    [props]
  )

  // Request session info if we have none
  useEffect(() => {
    if (!draggables[draggableId.SESSION]?.open) return
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'refresh',
        },
      })
    )
  }, [dispatch, draggables])

  return (
    // Either we specify a z-index for each Pad or
    // we sort them from lowest to highest priority
    <>
      {anyDraggableGlobalOutput &&
        draggables[draggableId.GLOBAL_OUTPUTS]?.open && (
          <GlobalOutputsDraggable />
        )}
      {draggables[draggableId.TIME]?.open && <TimeDraggable />}
      {draggables[draggableId.SESSION]?.open && <SessionDraggable />}
      {notifOpen ? (
        <NotificationsDraggable />
      ) : (
        messageCount > 0 && <NotificationsUnhide />
      )}
    </>
  )
}

export default Draggables
