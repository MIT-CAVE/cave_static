import { Autocomplete, Stack, TextField, Typography } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Draggable, DragHandle, useDraggable } from '.'

import { sendCommand } from '../../data/data'
import { mutateLocal } from '../../data/local'
import { initialState } from '../../data/local/settingsSlice'
import { selectSessions } from '../../data/selectors'
import { draggableId } from '../../utils/enums'

const styles = {
  root: {
    bgcolor: '#132a73',
    color: 'text.primary',
    border: 1,
    p: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    cursor: 'text',
  },
}

const SessionDraggable = () => {
  const [isEditing, setIsEditing] = useState(false)
  const sessions = useSelector(selectSessions)
  const draggable = useDraggable(draggableId.SESSION)
  const dispatch = useDispatch()

  const handleClickName = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleClickCancel = useCallback(() => {
    setIsEditing(false)
  }, [])

  const sessionIdCurrent = `${sessions.session_id}`

  const sessionStyles = useMemo(
    () => [styles.root, draggable.hideClose && { pr: 0 }],
    [draggable.hideClose]
  )

  const sessionOptions = useMemo(
    () =>
      R.pipe(
        R.values,
        R.chain((team) =>
          R.pipe(R.values, R.map(R.assoc('teamId', team.teamId)))(team.sessions)
        )
      )(sessions.data),
    [sessions.data]
  )

  const currentSession = useMemo(
    () => R.find(R.propEq(sessionIdCurrent, 'sessionId'))(sessionOptions),
    [sessionIdCurrent, sessionOptions]
  )

  // Select session
  const onSessionChange = (event, newSession) => {
    console.log({ newSession })
    dispatch(
      mutateLocal({
        path: [],
        value: {
          settings: initialState,
        },
        sync: false,
      })
    )
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'join',
          session_command_data: {
            session_id: newSession.sessionId,
          },
        },
      })
    )
    setIsEditing(false)
  }

  console.log({ sessionIdCurrent, sessions })

  return (
    <Draggable
      // cancel={'.MuiButtonBase-root'}
      component={Stack}
      slotProps={{
        component: {
          spacing: 1,
          direction: 'row',
          sx: styles.component,
        },
      }}
      sx={sessionStyles}
      hideMenu={isEditing}
      {...draggable}
    >
      {draggable.showDragHandle && !isEditing && <DragHandle />}
      {isEditing ? (
        <Autocomplete
          size="small"
          fullWidth
          autoSelect
          disableClearable
          value={currentSession}
          options={sessionOptions}
          sx={{ minWidth: '280px' }}
          renderInput={(params) => (
            <TextField
              focused
              autoFocus
              fullWidth
              variant="standard"
              label="You are viewing"
              {...params}
            />
          )}
          groupBy={(option) => sessions.data[option.teamId].teamName}
          getOptionLabel={R.prop('sessionName')}
          onBlur={handleClickCancel}
          onChange={onSessionChange}
        />
      ) : (
        <Typography sx={styles.label} onClick={handleClickName}>
          You are viewing: <strong>{currentSession?.sessionName}</strong>
        </Typography>
      )}
    </Draggable>
  )
}

export default SessionDraggable
