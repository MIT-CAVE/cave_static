import { Card, CardContent } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import { selectLocalDraggables, selectSessions } from '../../../data/selectors'
import { draggableId } from '../../../utils/enums'
import Draggable from '../../compound/Draggable'
import GlobalOutputsPad from '../../compound/GlobalOutputsPad'

const styles = {
  session: {
    display: 'flex',
    width: 'fit-content',
    maxWidth: '300px',
    pr: 3,
    bgcolor: '#132a73',
    overflow: 'hidden',
    overflowWrap: 'break-word',
  },
}

const Draggables = () => {
  const sessions = useSelector(selectSessions)
  const draggables = useSelector(selectLocalDraggables)
  const dispatch = useDispatch()

  const sessionIdCurrent = `${sessions.session_id}`
  const teamAllSessions = R.pipe(
    R.prop('data'),
    R.values,
    R.find(R.hasPath(['sessions', sessionIdCurrent])),
    R.defaultTo({})
  )(sessions)
  const sessionName = R.path(
    ['sessions', sessionIdCurrent, 'sessionName'],
    teamAllSessions
  )

  // Request session info if we have none
  useEffect(() => {
    if (!R.path([draggableId.SESSION, 'open'])(draggables)) return
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'refresh',
        },
      })
    )
  }, [dispatch, draggables])

  const handleToggleDraggable = useCallback(
    (id) => () => {
      dispatch(
        mutateLocal({
          path: ['draggables', id, 'open'],
          value: !R.pathOr(false, [id, 'open'])(draggables),
          sync: false,
        })
      )
    },
    [dispatch, draggables]
  )

  return (
    // Either we specify a z-index for each Pad or
    // we sort them from lowest to highest priority
    <>
      {R.path([draggableId.GLOBAL_OUTPUTS, 'open'])(draggables) && (
        <Draggable
          sx={styles.globalOutputs}
          onClose={handleToggleDraggable(draggableId.GLOBAL_OUTPUTS)}
        >
          <GlobalOutputsPad />
        </Draggable>
      )}
      {R.path([draggableId.TIME_CONTROL, 'open'])(draggables) && (
        <Draggable onClose={handleToggleDraggable(draggableId.TIME_CONTROL)}>
          {/* TODO */}
        </Draggable>
      )}
      {R.path([draggableId.SESSION, 'open'])(draggables) && (
        <Draggable
          component={Card}
          sx={styles.session}
          onClose={handleToggleDraggable(draggableId.SESSION)}
        >
          <CardContent style={styles.content}>
            {`Current Session: ${sessionName}`}
          </CardContent>
        </Draggable>
      )}
    </>
  )
}

export default Draggables
