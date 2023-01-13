import {
  Button,
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogActions,
  IconButton,
  MenuItem,
  Menu,
  Typography,
  Tooltip,
} from '@mui/material'
import * as R from 'ramda'
import { useEffect, useState, Fragment } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import {
  selectSessionsByTeam,
  selectSortedTeams,
  selectSessions,
} from '../../../data/selectors'
import { PANE_WIDTH } from '../../../utils/constants'

import { FetchedIcon, TextInput } from '../../compound'

import { forceArray, getFreeName } from '../../../utils'

const ActionItems = ({ items = [], disabled }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const onClickHandler = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const onCloseHandler = () => {
    setAnchorEl(null)
  }
  const [hiddenItems, visibleItems] = R.partition(R.propOr(true, 'hidden'))(
    items
  )
  return (
    <>
      {visibleItems.map(
        ({ label, iconName, onClick, disabled: disabledAction }, index) => (
          <Tooltip title={label} enterDelay={300} leaveDelay={300}>
            <IconButton
              key={index}
              disabled={disabled || disabledAction}
              {...{ onClick }}
            >
              <FetchedIcon {...{ iconName }} />
            </IconButton>
          </Tooltip>
        )
      )}
      {!R.isEmpty(hiddenItems) && (
        <>
          <IconButton
            {...{ disabled }}
            onClick={(event) => {
              event.stopPropagation()
              onClickHandler(event)
            }}
          >
            <FetchedIcon iconName="MdMoreVert" />
          </IconButton>
          <Menu
            id="long-menu"
            MenuListProps={{
              'aria-labelledby': 'long-button',
            }}
            {...{ anchorEl, open }}
            onClose={onCloseHandler}
            PaperProps={{
              style: {
                // maxHeight: ITEM_HEIGHT * 4.5,
                width: '20ch',
              },
            }}
          >
            {hiddenItems.map(({ label, iconName, onClick, disabled }) => (
              <MenuItem
                {...{ disabled }}
                key={label.toLocaleLowerCase()}
                onClick={() => {
                  console.log(label)
                  onClick()
                  onCloseHandler()
                }}
              >
                <FetchedIcon
                  {...{ iconName }}
                  size={20}
                  style={{ marginRight: '12px' }}
                />
                {label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </>
  )
}

const ListItemCard = ({
  disabled,
  selected,
  selectable,
  title,
  titleTypographyProps,
  subtitle,
  subheaderTypographyProps = { variant: 'h6' },
  description,
  actionItems = [],
  cardHeaderSx = [],
  sx = [],
  onClick,
  ...props
}) => {
  const CardArea = selectable
    ? ({ ...props }) => <CardActionArea {...{ onClick, ...props }} />
    : Fragment
  const CardItems = (itemProps) => (
    <ActionItems items={R.reject(R.isNil)(actionItems)} {...itemProps} />
  )
  return (
    <Card
      sx={[{ position: 'relative' }, ...forceArray(sx)]}
      elevation={selected ? 12 : 1}
      {...{ disabled, ...props }}
    >
      <CardArea>
        <CardHeader
          sx={[{ pb: 1 }, ...forceArray(cardHeaderSx)]}
          action={!selectable && <CardItems {...{ disabled }} />}
          subheader={subtitle}
          {...{ title, titleTypographyProps, subheaderTypographyProps }}
        />
        {description && (
          <CardContent>
            <Typography sx={{ pt: 0 }} variant="body1" color="text.secondary">
              {description}
            </Typography>
          </CardContent>
        )}
      </CardArea>
      {selectable && (
        <Box sx={{ position: 'absolute', top: '12px', right: '8px' }}>
          <CardItems {...{ disabled }} />
        </Box>
      )}
    </Card>
  )
}

const ListItemSessionCardInput = ({
  title,
  sessionName,
  sessionDescription,
  onClickConfirm,
  onClickCancel,
  cardHeaderSx,
  sx,
  ...props
}) => {
  const [inputValues, setInputValues] = useState({
    name: sessionName,
    description: sessionDescription,
  })
  return (
    <Card elevation={18} {...{ sx, ...props }}>
      <CardHeader
        sx={[{ pb: 1 }, ...forceArray(cardHeaderSx)]}
        {...{ title }}
        subheader={
          <TextInput
            enabled
            controlled
            sx={{ mt: 3 }}
            value={inputValues.name}
            label="Session name"
            onChange={(value) => {
              setInputValues(R.assoc('name', value)(inputValues))
            }}
          />
        }
      />
      <CardContent>
        <TextInput
          enabled
          controlled
          multiline
          value={inputValues.description}
          label="Session description"
          maxRows={6}
          onChange={(value) => {
            setInputValues(R.assoc('description', value)(inputValues))
          }}
        />
      </CardContent>
      <CardActions
        disableSpacing
        sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0 }}
      >
        <IconButton
          aria-label="confirm changes"
          onClick={() => {
            onClickConfirm(inputValues.name, inputValues.description)
          }}
        >
          <FetchedIcon iconName="MdCheck" size={24} />
        </IconButton>
        <IconButton aria-label="cancel" onClick={onClickCancel}>
          <FetchedIcon iconName="MdOutlineCancel" size={24} />
        </IconButton>
      </CardActions>
    </Card>
  )
}

const ListItemSessionCard = ({
  disabled,
  selected = false,
  sessionName,
  sessionDescription,
  teamName,
  selectable,
  editable,
  duplicable,
  removable,
  hideEdit,
  hideDuplicate,
  hideRemove,
  extraActionItems = [],
  sx,
  onClick,
  onClickEdit,
  onClickDuplicate,
  onClickRemove,
}) => {
  const stdActionItems = [
    {
      label: 'Edit session',
      iconName: 'MdEdit',
      hidden: hideEdit,
      onClick: onClickEdit,
      disabled: !editable,
    },
    {
      label: 'Duplicate session',
      iconName: 'MdCopyAll',
      hidden: hideDuplicate,
      onClick: onClickDuplicate,
      disabled: !duplicable,
    },
    {
      label: 'Delete session',
      iconName: 'IoMdCloseCircleOutline',
      hidden: hideRemove,
      onClick: onClickRemove,
      disabled: selected || !removable,
    },
  ]
  return (
    <ListItemCard
      {...{ disabled, selected, selectable, sx, onClick }}
      title={teamName}
      subtitle={`${sessionName}${selected ? ' (current)' : ''}`}
      description={sessionDescription}
      actionItems={[...stdActionItems, ...extraActionItems]}
    />
  )
}

const UnstyledHeader = ({
  title,
  subtitle,
  actionItems,
  sx = [],
  ...props
}) => (
  <ListItemCard
    elevation={0}
    cardHeaderSx={[{ px: 0, py: 2 }, ...forceArray(sx)]}
    titleTypographyProps={{ variant: 'h6' }}
    subheaderTypographyProps={{ variant: 'subtitle' }}
    {...{ title, subtitle, actionItems, ...props }}
  />
)

const SessionPane = ({ width }) => {
  const dispatch = useDispatch()
  const teams = useSelector(selectSortedTeams)
  const sessions = useSelector(selectSessions)
  const sessionsByTeam = useSelector(selectSessionsByTeam)
  const [currentAction, setCurrentAction] = useState({})
  const [openDialogDelete, setOpenDialogDelete] = useState(false)

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

  // Select session
  const onClickHandler = (sessionId) => {
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'join',
          session_command_data: {
            session_id: sessionId,
          },
        },
      })
    )
  }
  // Edit session
  const onClickEditHandler = (sessionId, source) => {
    // `source` detects where the click originated from to set
    // the proper location of the component to be edited in place
    setCurrentAction({ command: 'edit', sessionId, source })
  }
  const onClickConfirmEditHandler = (name, description) => {
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'edit',
          session_command_data: {
            session_name: name,
            session_description: description,
            session_id: currentAction.sessionId,
          },
        },
      })
    )
    setCurrentAction({})
  }
  // Create session
  const onClickCreateHandler = (teamId) => {
    setCurrentAction({ command: 'create', teamId })
  }
  const onClickConfirmCreateHandler = (name, description) => {
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'create',
          session_command_data: {
            session_name: name,
            session_description: description,
            team_id: currentAction.teamId,
          },
        },
      })
    )
    setCurrentAction({})
  }
  // Duplicate session
  const onClickDuplicateHandler = (teamId, sessionId) => {
    setCurrentAction({ command: 'duplicate', teamId, sessionId })
  }
  const onClickConfirmDuplicateHandler = (name, description) => {
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'copy',
          session_command_data: {
            session_name: name,
            session_description: description,
            session_id: currentAction.sessionId,
          },
        },
      })
    )
    setCurrentAction({})
  }
  // Delete session
  const onClickRemoveHandler = (teamId, sessionId) => {
    // Here, teamId is not required by sendCommand,
    // but it's useful to display the Dialog text
    setOpenDialogDelete(true)
    setCurrentAction({ command: 'delete', teamId, sessionId })
  }
  const onClickConfirmRemoveHandler = () => {
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'delete',
          session_command_data: {
            session_id: currentAction.sessionId,
          },
        },
      })
    )
    setOpenDialogDelete(false)
  }

  // Cancel action (shared by all commands)
  const onClickCancelHandler = () => {
    setCurrentAction({})
  }

  const sessionIdCurrent = `${sessions.session_id}` // Intentional conversion to String
  const teamAllSessions = R.pipe(
    R.prop('data'),
    R.values,
    R.find(R.hasPath(['sessions', sessionIdCurrent])),
    R.defaultTo({})
  )(sessions)
  if (R.isEmpty(teamAllSessions)) return null

  const { sessions: teamSessions, ...teamCurrent } = teamAllSessions
  const { sessionName, sessionDescription } = teamSessions[sessionIdCurrent]

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        // position: 'relative',
        ...(width && {
          width: (theme) => `calc(${PANE_WIDTH}px - ${theme.spacing(5)})`,
        }),
      }}
    >
      {/* Current session view */}
      <UnstyledHeader title="Your current session:" />
      {/* You are in the session: */}
      {currentAction.sessionId === sessionIdCurrent &&
      currentAction.command === 'edit' &&
      currentAction.source === 'top-card' ? (
        <ListItemSessionCardInput
          disabled={currentAction.command != null}
          title="Edit session"
          {...{ sessionName, sessionDescription }}
          onClickConfirm={() => onClickConfirmEditHandler(sessionIdCurrent)}
          onClickCancel={onClickCancelHandler}
        />
      ) : (
        <ListItemSessionCard
          disabled={currentAction.command != null}
          selected
          {...{ sessionName }}
          sessionDescription={sessionDescription || 'No description available.'}
          teamName={teamCurrent.teamName}
          editable
          duplicable
          hideEdit={false}
          hideDuplicate={false}
          hideRemove={false}
          onClickEdit={() => onClickEditHandler(sessionIdCurrent, 'top-card')}
          onClickDuplicate={() =>
            onClickDuplicateHandler(teamCurrent.teamId, sessionIdCurrent)
          }
        />
      )}

      <UnstyledHeader
        title="Teams and sessions"
        titleTypographyProps={{ variant: 'h5' }}
        sx={{ py: 3 }}
      />
      <Box
        sx={{
          p: 1.5,
          pt: 0,
          overflow: 'auto',
          flex: 1,
          // scrollbarGutter: 'stable both-edges',
        }}
      >
        {teams.map(
          ({
            name: teamName,
            id: teamId,
            teamCountSessions,
            teamLimitSessions,
          }) => {
            // Place any new (`create` or `duplicate`) session at the top of the team group
            const displayNewSessionInput =
              currentAction.teamId === teamId &&
              (currentAction.command === 'create' ||
                currentAction.command === 'duplicate')

            return (
              <Fragment key={teamName.toLocaleLowerCase()}>
                {/* Team header */}
                <UnstyledHeader
                  disabled={
                    currentAction.command != null ||
                    +teamCountSessions >= +teamLimitSessions // `>` is a sanity check
                  }
                  title={teamName}
                  subtitle="Team"
                  sx={{ pr: 1 }}
                  actionItems={[
                    {
                      label: 'Create a new session',
                      iconName: 'MdOutlineAddBox',
                      hidden: false,
                      onClick: () => onClickCreateHandler(teamId),
                    },
                  ]}
                />
                {displayNewSessionInput &&
                  (currentAction.command === 'create' ? (
                    <ListItemSessionCardInput
                      key="new-session-input"
                      title="Create session"
                      sessionName={getFreeName(
                        'New session',
                        R.pipe(
                          R.values,
                          R.pluck('sessionName')
                        )(sessionsByTeam[teamId])
                      )}
                      sessionDescription=""
                      onClickConfirm={onClickConfirmCreateHandler}
                      onClickCancel={onClickCancelHandler}
                    />
                  ) : (
                    <ListItemSessionCardInput
                      key={`${currentAction.sessionId}-duplicate`}
                      title="Duplicate session"
                      sessionName={getFreeName(
                        R.path([
                          teamId,
                          currentAction.sessionId,
                          'sessionName',
                        ])(sessionsByTeam), // <- Name of the session in the current pending action
                        R.pipe(
                          R.values,
                          R.pluck('sessionName')
                        )(sessionsByTeam[teamId])
                      )}
                      sessionDescription={R.path([
                        teamId,
                        currentAction.sessionId,
                        'sessionDescription',
                      ])(sessionsByTeam)} // <- Session description in the current pending action
                      {...{ sessionDescription }}
                      onClickConfirm={onClickConfirmDuplicateHandler}
                      onClickCancel={onClickCancelHandler}
                    />
                  ))}
                {R.values(sessionsByTeam[teamId]).map(
                  ({ sessionId, sessionName, sessionDescription }) => {
                    const selected = sessionId === sessionIdCurrent
                    return (
                      <>
                        {sessionId !== currentAction.sessionId ||
                        // Required to display an item linked to
                        // a create, duplicate or delete action
                        currentAction.command === 'create' ||
                        currentAction.command === 'duplicate' ||
                        currentAction.command === 'delete' ? (
                          <ListItemSessionCard
                            key={sessionId}
                            // When creating, duplicating, editing or deleting a session,
                            // all actions are blocked for any other session
                            disabled={currentAction.command != null}
                            sx={{ my: 1 }}
                            {...{ sessionName, selected }}
                            sessionDescription={
                              sessionDescription || 'No description available.'
                            }
                            selectable={
                              !selected && currentAction.sessionId == null
                            }
                            editable
                            duplicable={+teamCountSessions < +teamLimitSessions}
                            removable
                            onClick={() => onClickHandler(sessionId)}
                            onClickDuplicate={() =>
                              onClickDuplicateHandler(teamId, sessionId)
                            }
                            onClickEdit={() => onClickEditHandler(sessionId)}
                            onClickRemove={() =>
                              onClickRemoveHandler(teamId, sessionId)
                            }
                          />
                        ) : currentAction.command === 'edit' &&
                          currentAction.source !== 'top-card' ? (
                          <ListItemSessionCardInput
                            key={sessionId}
                            title="Edit session"
                            {...{ sessionName, sessionDescription }}
                            onClickConfirm={onClickConfirmEditHandler}
                            onClickCancel={onClickCancelHandler}
                          />
                        ) : null}
                      </>
                    )
                  }
                )}
              </Fragment>
            )
          }
        )}
        {currentAction.command === 'delete' && (
          <Dialog
            open={openDialogDelete}
            onClose={() => {
              setOpenDialogDelete(false)
              setCurrentAction({})
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              {`Delete '${R.path([
                currentAction.teamId,
                currentAction.sessionId,
                'sessionName',
              ])(sessionsByTeam)}' from your team '${R.path([
                'data',
                currentAction.teamId,
                'teamName',
              ])(sessions)}'? This cannot be undone.`}
            </DialogTitle>
            <DialogActions>
              <Button
                onClick={() => {
                  onClickConfirmRemoveHandler()
                  setCurrentAction({})
                }}
              >
                Delete
              </Button>
              <Button
                onClick={() => {
                  setOpenDialogDelete(false)
                  setCurrentAction({})
                }}
                autoFocus
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Box>
  )
}

export default SessionPane
