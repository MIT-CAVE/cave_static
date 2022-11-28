import {
  Collapse,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
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
import { selectTeams, selectSessionsByTeam } from '../../../data/selectors'

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

const ListItemSession = ({ session, switchSession, expanded, setExpanded }) => {
  return (
    <>
      <ListItem
        selected={true}
        secondaryAction={
          <IconButton css={{ cursor: 'pointer' }}>
            {expanded === R.prop('session__id', session) ? (
              <MdExpandLess onClick={() => setExpanded(-1)} />
            ) : (
              <MdExpandMore
                onClick={() => setExpanded(R.prop('session__id', session))}
              />
            )}
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
            <IconButton>
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
              R.map((session) => (
                <ListItemSession
                  session={session}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  switchSession={switchSession}
                />
              ))
            )(sessionsByTeam)}
          </List>
        ))(teams)
      )}
    </>
  )
}

export default SessionPane
