import {
  Collapse,
  Dialog,
  DialogTitle,
  DialogActions,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material'
import * as R from 'ramda'
import { useEffect, useCallback, useState } from 'react'
import {
  MdExpandLess,
  MdExpandMore,
  MdEdit,
  MdCopyAll,
  MdDeleteForever,
  MdAddToPhotos,
  MdCheck,
  MdClose,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import {
  selectTeams,
  selectSessionsByTeam,
  selectCurrentSession,
} from '../../../data/selectors'

const ListTeamHeader = ({ teamObj, id, onAdd }) => {
  return (
    <ListSubheader>
      <Grid container>
        <Grid item xs={10}>
          {R.prop('teamName', teamObj)}
        </Grid>
        {R.prop('teamCountSessions', teamObj) <
        R.prop('teamLimitSessions', teamObj) ? (
          <Grid item>
            <IconButton onClick={() => onAdd(id)}>
              <MdAddToPhotos />
            </IconButton>
          </Grid>
        ) : (
          []
        )}
      </Grid>
    </ListSubheader>
  )
}

const ListItemSession = ({
  session,
  switchSession,
  expanded,
  setExpanded,
  onEdit,
  onCopy,
  teamId,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const currentSession = useSelector(selectCurrentSession)
  const isExpanded = expanded === R.prop('sessionId', session)
  const dispatch = useDispatch()

  return (
    <>
      <ListItem
        selected={parseInt(R.prop('sessionId', session)) === currentSession}
        secondaryAction={
          <IconButton
            css={{ cursor: 'pointer' }}
            onClick={() =>
              isExpanded
                ? setExpanded(-1)
                : setExpanded(R.prop('sessionId', session))
            }
          >
            {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
          </IconButton>
        }
      >
        <ListItemButton
          key={R.prop('sessionId', session)}
          onClick={() => switchSession(R.prop('sessionId', session))}
        >
          <ListItemText primary={R.prop('sessionName', session)} />
        </ListItemButton>
      </ListItem>
      <Collapse
        in={expanded === R.prop('sessionId', session)}
        timeout="auto"
        unmountOnExit
      >
        <Grid container spacing={0} style={{ textAlign: 'center' }}>
          <Grid item xs={4}>
            <IconButton
              onClick={() =>
                onEdit(
                  R.prop('sessionId', session),
                  -1,
                  R.prop('sessionName', session)
                )
              }
            >
              <MdEdit />
            </IconButton>
          </Grid>
          <Grid item xs={4}>
            <IconButton
              onClick={() =>
                onCopy(
                  R.prop('sessionId', session),
                  teamId,
                  R.prop('sessionName', session)
                )
              }
            >
              <MdCopyAll />
            </IconButton>
          </Grid>
          <Grid item xs={4}>
            <IconButton onClick={() => setConfirmOpen(true)}>
              <MdDeleteForever />
            </IconButton>
          </Grid>
        </Grid>
      </Collapse>
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {`Delete ${R.prop('sessionName', session)}? This cannot be undone.`}
        </DialogTitle>
        <DialogActions>
          <Button
            onClick={() => {
              dispatch(
                sendCommand({
                  command: 'session_management',
                  data: {
                    session_command: 'delete',
                    session_command_data: {
                      session_id: R.prop('sessionId', session),
                    },
                  },
                })
              )
              setConfirmOpen(false)
            }}
          >
            Delete
          </Button>
          <Button
            onClick={() => {
              setConfirmOpen(false)
            }}
            autoFocus
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const SessionPane = ({ ...props }) => {
  const dispatch = useDispatch()
  const teams = useSelector(selectTeams)
  const sessionsByTeam = useSelector(selectSessionsByTeam)
  const [expanded, setExpanded] = useState(-1)
  const [editing, setEditing] = useState({ team: -1, session: -1, copy: -1 })
  const [inputValue, setInputValue] = useState('')

  const onEdit = useCallback((id, team, text = '') => {
    setEditing({ team: team, session: id, copy: -1 })
    setInputValue(text)
  }, [])

  const onCopy = useCallback((id, team, text = '') => {
    setEditing({ team: team, session: -1, copy: id })
    setInputValue(`Copy of ${text}`)
    setExpanded(-1)
  }, [])

  const onAdd = useCallback((team) => {
    setEditing({ team: team, session: -1, copy: -1 })
    setInputValue(`New Session`)
    setExpanded(-1)
  }, [])

  const switchSession = useCallback(
    (id) => {
      dispatch(
        sendCommand({
          command: 'session_management',
          data: {
            session_command: 'join',
            session_command_data: {
              session_id: id,
            },
          },
        })
      )
    },
    [dispatch]
  )

  // Request session info if we have none
  useEffect(() => {
    if (R.isEmpty(teams)) {
      dispatch(
        sendCommand({
          command: 'session_management',
          data: {
            session_command: 'refresh',
          },
        })
      )
    }
  }, [dispatch, teams])

  return (
    <div>
      {R.values(
        R.mapObjIndexed((value, id) => (
          <List key={id}>
            <ListTeamHeader teamObj={value} id={id} onAdd={onAdd} />
            {R.pipe(
              R.prop(id),
              R.values,
              R.map((session) =>
                R.prop('sessionId', session) === R.prop('session', editing) ? (
                  <ListItem key={R.prop('sessionId', session)}>
                    <TextField
                      fullWidth
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => {
                                dispatch(
                                  sendCommand({
                                    command: 'session_management',
                                    data: {
                                      session_command: 'edit',
                                      session_command_data: {
                                        session_name: inputValue,
                                        session_id: R.prop(
                                          'sessionId',
                                          session
                                        ),
                                      },
                                    },
                                  })
                                )
                                setEditing({ team: -1, session: -1, copy: -1 })
                                setInputValue('')
                              }}
                            >
                              <MdCheck />
                            </IconButton>
                            <IconButton
                              onClick={() => {
                                setEditing({ team: -1, session: -1, copy: -1 })
                                setInputValue('')
                              }}
                            >
                              <MdClose />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </ListItem>
                ) : (
                  <ListItemSession
                    key={R.prop('sessionId', session)}
                    session={session}
                    expanded={expanded}
                    onEdit={onEdit}
                    onCopy={onCopy}
                    teamId={id}
                    setExpanded={setExpanded}
                    switchSession={switchSession}
                  />
                )
              )
            )(sessionsByTeam)}
            {R.prop('team', editing) === id && (
              <ListItem key={id}>
                <TextField
                  fullWidth
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => {
                            R.prop('copy', editing) !== -1
                              ? dispatch(
                                  sendCommand({
                                    command: 'session_management',
                                    data: {
                                      session_command: 'copy',
                                      session_command_data: {
                                        session_name: inputValue,
                                        session_id: R.prop('copy', editing),
                                      },
                                    },
                                  })
                                )
                              : dispatch(
                                  sendCommand({
                                    command: 'session_management',
                                    data: {
                                      session_command: 'create',
                                      session_command_data: {
                                        session_name: inputValue,
                                        team_id: id,
                                      },
                                    },
                                  })
                                )
                            setEditing({ team: -1, session: -1, copy: -1 })
                            setInputValue('')
                          }}
                        >
                          <MdCheck />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setEditing({ team: -1, session: -1, copy: -1 })
                            setInputValue('')
                          }}
                        >
                          <MdClose />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </ListItem>
            )}
          </List>
        ))(teams)
      )}
    </div>
  )
}

export default SessionPane
