import { Card, CardContent, IconButton } from '@mui/material'
import * as R from 'ramda'
import { useCallback } from 'react'
import Draggable from 'react-draggable'
import { MdOutlineClose } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import { selectLocalDraggables, selectSessions } from '../../../data/selectors'

const styles = {
  root: {
    display: 'flex',
    width: 300,
    bgcolor: '#132a73',
    cursor: 'move',
    zIndex: 5000,
  },
  content: {
    overflow: 'hidden',
    overflowWrap: 'break-word',
  },
  position: {
    position: 'absolute',
    top: 0,
    left: 0,
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
    <>
      {R.path(['session', 'open'])(draggables) && (
        <Draggable bounds="parent">
          <Card sx={[styles.root, styles.position]}>
            <CardContent style={styles.content}>
              {`Current Session: ${sessionName}`}
            </CardContent>
            <IconButton onClick={handleToggleDraggable('session')}>
              <MdOutlineClose />
            </IconButton>
          </Card>
        </Draggable>
      )}
      {R.path(['globalOutputs', 'open'])(draggables) && (
        <Draggable bounds="parent">{/* TODO */}</Draggable>
      )}
      {R.path(['timeControl', 'open'])(draggables) && (
        <Draggable bounds="parent">{/* TODO */}</Draggable>
      )}
    </>
  )
}

export default Draggables
