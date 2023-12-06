import { Card, CardContent } from '@mui/material'
import * as R from 'ramda'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import { selectLocalDraggables, selectSessions } from '../../../data/selectors'
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
      {R.path(['globalOutputs', 'open'])(draggables) && (
        <Draggable
          sx={styles.globalOutputs}
          onClose={handleToggleDraggable('globalOutputs')}
        >
          <GlobalOutputsPad />
        </Draggable>
      )}
      {R.path(['timeControl', 'open'])(draggables) && (
        <Draggable>{/* TODO */}</Draggable>
      )}
      {R.path(['session', 'open'])(draggables) && (
        <Draggable
          component={Card}
          sx={styles.session}
          onClose={handleToggleDraggable('session')}
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
