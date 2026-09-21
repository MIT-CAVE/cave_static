import { Autocomplete, Stack, TextField, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../data/data'
import { mutateLocal } from '../../data/local'
import { initialState } from '../../data/local/settingsSlice'
import { selectSessions } from '../../data/selectors'

const styles = {
  label: {
    cursor: 'text',
  },
  stackedLabel: {
    cursor: 'text',
    gap: 0.5,
  },
  viewingLabel: {
    lineHeight: 1.2,
  },
  sessionName: {
    lineHeight: 1.2,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
}

const SessionDraggableContent = ({ docked = false, onEditingChange }) => {
  const [isEditing, setIsEditingState] = useState(false)
  const sessions = useSelector(selectSessions)
  const dispatch = useDispatch()

  const setIsEditing = useCallback(
    (value) => {
      setIsEditingState(value)
      onEditingChange?.(value)
    },
    [onEditingChange]
  )

  const handleClickName = useCallback(() => {
    setIsEditing(true)
  }, [setIsEditing])

  const handleClickCancel = useCallback(() => {
    setIsEditing(false)
  }, [setIsEditing])

  const sessionIdCurrent = `${sessions.session_id}`

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

  return isEditing ? (
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
  ) : docked ? (
    <Stack sx={styles.stackedLabel} onClick={handleClickName}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={styles.viewingLabel}
      >
        You are viewing
      </Typography>
      <Typography variant="body2" sx={styles.sessionName}>
        {currentSession?.sessionName}
      </Typography>
    </Stack>
  ) : (
    <Typography sx={styles.label} onClick={handleClickName}>
      You are viewing: <strong>{currentSession?.sessionName}</strong>
    </Typography>
  )
}
SessionDraggableContent.propTypes = {
  docked: PropTypes.bool,
  onEditingChange: PropTypes.func,
}

export default SessionDraggableContent
