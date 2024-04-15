import { ButtonGroup, CardContent } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import TimeButtons from './TimeButtons'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectGlobalOutputProps,
  selectLocalDraggables,
  selectSessions,
} from '../../../data/selectors'
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
  time: {
    // width: '400px',
    bgcolor: 'background.paper',
  },
  icon: {
    color: 'black',
  },
  buttons: {
    display: 'flex',
    alignItems: 'center',
  },
}

const Draggables = () => {
  const sessions = useSelector(selectSessions)
  const draggables = useSelector(selectLocalDraggables)
  const props = useSelector(selectGlobalOutputProps)
  const dispatch = useDispatch()

  const anyDraggableGlobalOutput = useMemo(
    () => R.pipe(R.values, R.any(R.prop('draggable')))(props),
    [props]
  )

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
      {anyDraggableGlobalOutput &&
        R.path([draggableId.GLOBAL_OUTPUTS, 'open'])(draggables) && (
          <Draggable
            sx={styles.globalOutputs}
            onClose={handleToggleDraggable(draggableId.GLOBAL_OUTPUTS)}
          >
            <GlobalOutputsPad />
          </Draggable>
        )}
      {R.path([draggableId.TIME, 'open'])(draggables) && (
        <Draggable
          sx={styles.time}
          onClose={handleToggleDraggable(draggableId.TIME)}
        >
          <TimeButtons />
        </Draggable>
      )}
      {R.path([draggableId.SESSION, 'open'])(draggables) && (
        <Draggable
          component={ButtonGroup}
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
