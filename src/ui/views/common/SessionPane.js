import {
  Collapse,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  TextField,
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
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import {
  selectTeams,
  selectSessionsByTeam,
  selectCurrentSession,
} from '../../../data/selectors'

const ListTeamHeader = ({ teamObj, id }) => {
  const dispatch = useDispatch()

  return (
    <ListSubheader>
      <Grid container>
        <Grid item xs={10}>
          {R.prop('team__name', teamObj)}
        </Grid>
        {R.prop('team__count_sessions', teamObj) <
        R.prop('team__limit_sessions', teamObj) ? (
          <Grid item>
            <IconButton
              onClick={() =>
                dispatch(
                  sendCommand({
                    command: 'session_management',
                    data: {
                      session_command: 'create',
                      session_command_data: {
                        session_name: 'new_name_here',
                        team_id: id,
                      },
                    },
                  })
                )
              }
            >
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
}) => {
  const currentSession = useSelector(selectCurrentSession)
  const isExpanded = expanded === R.prop('session__id', session)
  return (
    <>
      <ListItem
        selected={R.prop('session__id', session) === currentSession}
        secondaryAction={
          <IconButton
            css={{ cursor: 'pointer' }}
            onClick={() =>
              isExpanded
                ? setExpanded(-1)
                : setExpanded(R.prop('session__id', session))
            }
          >
            {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
          </IconButton>
        }
      >
        <ListItemButton
          key={R.prop('session__id', session)}
          onClick={() => switchSession(R.prop('session__id', session))}
        >
          <ListItemText primary={R.prop('session__name', session)} />
        </ListItemButton>
      </ListItem>
      <Collapse
        in={expanded === R.prop('session__id', session)}
        timeout="auto"
        unmountOnExit
      >
        <Grid container spacing={0} style={{ textAlign: 'center' }}>
          <Grid item xs={4}>
            <IconButton
              onClick={() =>
                onEdit(
                  R.prop('session__id', session),
                  -1,
                  R.prop('session__name', session)
                )
              }
            >
              <MdEdit />
            </IconButton>
          </Grid>
          <Grid item xs={4}>
            <IconButton>
              <MdCopyAll />
            </IconButton>
          </Grid>
          <Grid item xs={4}>
            <IconButton>
              <MdDeleteForever />
            </IconButton>
          </Grid>
        </Grid>
      </Collapse>
    </>
  )
}

const SessionPane = ({ ...props }) => {
  const dispatch = useDispatch()
  const teams = useSelector(selectTeams)
  const sessionsByTeam = useSelector(selectSessionsByTeam)
  const [expanded, setExpanded] = useState(-1)
  const [editing, setEditing] = useState({ team: -1, session: -1 })
  const [inputValue, setInputValue] = useState('')

  const onEdit = useCallback((id, team, text = '') => {
    setEditing({ team: team, session: id })
    setInputValue(text)
  }, [])

  const switchSession = useCallback(
    (id) => {
      //TODO: add session switching functionality
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
  //TODO: Add refresh button
  return (
    <>
      {R.values(
        R.mapObjIndexed((value, id) => (
          <List key={id}>
            <ListTeamHeader teamObj={value} id={id} />
            {R.pipe(
              R.prop(id),
              R.values,
              R.map((session) =>
                R.prop('session__id', session) ===
                R.prop('session', editing) ? (
                  <ListItem key={R.prop('session__id', session)}>
                    <TextField
                      fullWidth
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                    />
                  </ListItem>
                ) : (
                  <ListItemSession
                    key={R.prop('session__id', session)}
                    session={session}
                    expanded={expanded}
                    onEdit={onEdit}
                    setExpanded={setExpanded}
                    switchSession={switchSession}
                  />
                )
              )
            )(sessionsByTeam)}
          </List>
        ))(teams)
      )}
    </>
  )
}

export default SessionPane
