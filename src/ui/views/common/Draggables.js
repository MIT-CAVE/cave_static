import { ButtonGroup, CardContent } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import TimeControl from './TimeControl'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectGlobalOutputProps,
  selectMergedDraggables,
  selectSessions,
  selectSync,
} from '../../../data/selectors'
import { draggableId } from '../../../utils/enums'
import Draggable from '../../compound/Draggable'
import GlobalOutputsPad from '../../compound/GlobalOutputsPad'

import { includesPath } from '../../../utils'

const styles = {
  session: {
    display: 'flex',
    width: 'fit-content',
    maxWidth: '300px',
    pr: 3,
    bgcolor: '#132a73',
    color: 'text.primary',
    border: 1,
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
  const draggables = useSelector(selectMergedDraggables)
  const props = useSelector(selectGlobalOutputProps)
  const sync = useSelector(selectSync)
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

  const handleToggleDraggable = useCallback(
    (id) => () => {
      const path = ['draggables', 'data', id, 'open']
      dispatch(
        mutateLocal({
          path,
          value: !R.pathOr(false, [id, 'open'])(draggables),
          sync: !includesPath(R.values(sync), path),
        })
      )
    },
    [dispatch, draggables, sync]
  )

  return (
    // Either we specify a z-index for each Pad or
    // we sort them from lowest to highest priority
    <>
      {anyDraggableGlobalOutput &&
        draggables[draggableId.GLOBAL_OUTPUTS]?.open && (
          <Draggable
            // sx={styles.globalOutputs}
            position={draggables[draggableId.GLOBAL_OUTPUTS].position}
            onClose={handleToggleDraggable(draggableId.GLOBAL_OUTPUTS)}
            cancel={'.MuiButtonBase-root'}
          >
            <GlobalOutputsPad />
          </Draggable>
        )}
      {draggables[draggableId.TIME]?.open && (
        <Draggable
          sx={styles.time}
          onClose={handleToggleDraggable(draggableId.TIME)}
          position={draggables[draggableId.TIME].position}
          cancel={'.MuiButtonBase-root, .MuiFormControl-root, .MuiSlider-thumb'}
        >
          <TimeControl />
        </Draggable>
      )}
      {draggables[draggableId.SESSION]?.open && (
        <Draggable
          component={ButtonGroup}
          sx={styles.session}
          position={draggables[draggableId.SESSION].position}
          onClose={handleToggleDraggable(draggableId.SESSION)}
          cancel={'.MuiButtonBase-root'}
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
