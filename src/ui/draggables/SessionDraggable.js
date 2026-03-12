import { ButtonGroup, CardContent } from '@mui/material'
import * as R from 'ramda'
import { memo, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { Draggable, DragHandle, useDraggable } from '.'

import { selectSessions } from '../../data/selectors'
import { draggableId } from '../../utils/enums'

const styles = {
  root: {
    display: 'flex',
    width: 'fit-content',
    // maxWidth: '300px',
    // pr: 1,
    // bgcolor: 'rgb(0 0 0 / .9)',
    bgcolor: '#132a73',
    color: 'text.primary',
    border: 1,
    overflow: 'hidden',
    overflowWrap: 'break-word',
  },
  dragHandle: {
    mr: 1,
  },
}

const SessionDraggable = () => {
  const sessions = useSelector(selectSessions)
  const draggable = useDraggable(draggableId.SESSION)

  const sessionIdCurrent = `${sessions.session_id}`
  const teamAllSessions = useMemo(
    () =>
      R.pipe(
        R.prop('data'),
        R.values,
        R.find(R.hasPath(['sessions', sessionIdCurrent])),
        R.defaultTo({})
      )(sessions),
    [sessionIdCurrent, sessions]
  )
  const sessionName = teamAllSessions.sessions?.[sessionIdCurrent].sessionName

  const sessionStyles = useMemo(
    () => [styles.root, draggable.hideClose && { pr: 0 }],
    [draggable.hideClose]
  )

  return (
    <Draggable
      // cancel={'.MuiButtonBase-root'}
      component={ButtonGroup}
      sx={sessionStyles}
      {...draggable}
    >
      <CardContent>
        {draggable.showDragHandle && <DragHandle sx={styles.dragHandle} />}
        You are viewing: <strong>{sessionName}</strong>
      </CardContent>
    </Draggable>
  )
}

export default memo(SessionDraggable)
