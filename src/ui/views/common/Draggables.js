import {
  Box,
  ButtonGroup,
  CardContent,
  IconButton,
  ToggleButton,
  Slider,
} from '@mui/material'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo } from 'react'
import {
  MdOutlinePlayArrow,
  MdArrowBack,
  MdStop,
  MdArrowForward,
  MdFastForward,
  MdFastRewind,
  MdOutlineRefresh,
} from 'react-icons/md'
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
import Select from '../../compound/Select'

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
    width: '500px',
    pr: 3,
    bgcolor: 'white',
    button: {
      width: '42px',
    },
    height: '150px',
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
          onClose={handleToggleDraggable(draggableId.TIME)}
          sx={styles.time}
          component={Box}
        >
          <Slider></Slider>
          <div style={styles.buttons}>
            <TimeButtons />
            <IconButton sx={styles.icon}>
              <MdOutlinePlayArrow />
            </IconButton>
            <div>
              <IconButton sx={styles.icon}>
                <MdFastRewind />
              </IconButton>
              <IconButton sx={styles.icon}>
                <MdArrowBack />
              </IconButton>
              <IconButton sx={styles.icon}>
                <MdStop />
              </IconButton>
              <IconButton sx={styles.icon}>
                <MdArrowForward />
              </IconButton>
              <IconButton sx={styles.icon}>
                <MdFastForward />
              </IconButton>
            </div>
            <ToggleButton sx={styles.icon}>
              <MdOutlineRefresh />
            </ToggleButton>
            <Select
              sx={styles.icon}
              optionsList={[
                { value: '0.5', label: '0.5x', iconName: '' },
                { value: '0.75', label: '0.75x', iconName: '' },
                { value: '1', label: 'Normal', iconName: '' },
                { value: '1.25', label: '1.25x', iconName: '' },
                { value: '1.5', label: '1.5x', iconName: '' },
                { value: '2', label: '2x', iconName: '' },
              ]}
            />
          </div>
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
