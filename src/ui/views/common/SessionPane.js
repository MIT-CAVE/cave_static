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
  Stack,
  Typography,
  Tooltip,
  Autocomplete,
  TextField,
} from '@mui/material'
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
} from '@mui/x-data-grid'
import * as R from 'ramda'
import { useEffect, useState, Fragment } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import { initialState } from '../../../data/local/settingsSlice'
import {
  selectSessionsByTeam,
  selectSortedTeams,
  selectSessions,
  selectSessionDraggable,
} from '../../../data/selectors'
import { PANE_WIDTH } from '../../../utils/constants'
import { draggableId } from '../../../utils/enums'
import { useMenu, useMutateState } from '../../../utils/hooks'

import { FetchedIcon, TextInput } from '../../compound'

import { forceArray, getFreeName } from '../../../utils'

const ActionItems = ({ items = [], disabled }) => {
  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()
  const [hiddenItems, visibleItems] = R.partition(R.propOr(true, 'hidden'))(
    items
  )
  return (
    <>
      {visibleItems.map(
        ({ label, iconName, onClick, disabled: disabledAction }) => (
          <Tooltip
            key={label.toLocaleLowerCase()}
            title={label}
            PopperProps={{ sx: { zIndex: 2002 } }}
            enterDelay={300}
            leaveDelay={300}
          >
            {/* A `span` wrapper to acommodate disabled actions */}
            <span>
              <IconButton
                disabled={disabled || disabledAction}
                {...{ onClick }}
              >
                <FetchedIcon {...{ iconName }} />
              </IconButton>
            </span>
          </Tooltip>
        )
      )}
      {R.isNotEmpty(hiddenItems) && (
        <>
          <IconButton {...{ disabled }} onClick={handleOpenMenu}>
            <FetchedIcon iconName="md/MdMoreVert" />
          </IconButton>
          <Menu
            id="long-menu"
            MenuListProps={{
              'aria-labelledby': 'long-button',
            }}
            {...{ anchorEl }}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            sx={{ zIndex: 2002 }}
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
                  onClick()
                  handleCloseMenu()
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
  subtitleExtra,
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
      sx={[
        { position: 'relative' },
        selected && {
          border: 1,
          bgcolor: '#132a73',
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.06))',
        },
        ...forceArray(sx),
      ]}
      elevation={selected ? 12 : 1}
      {...{ disabled, ...props }}
    >
      <CardArea>
        <CardHeader
          sx={[{ pb: 1 }, ...forceArray(cardHeaderSx)]}
          action={!selectable && <CardItems {...{ disabled }} />}
          subheader={
            <>
              <Typography {...subheaderTypographyProps} component="span">
                {subtitle}
              </Typography>
              {subtitleExtra && (
                <Typography
                  {...subheaderTypographyProps}
                  component="span"
                  fontWeight={600}
                  color="primary"
                >
                  {subtitleExtra}
                </Typography>
              )}
            </>
          }
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
  teamOptions,
  sx,
  ...props
}) => {
  const [inputValues, setInputValues] = useState({
    name: sessionName,
    description: sessionDescription,
    ...(teamOptions &&
      teamOptions.length > 0 && { team: teamOptions[0].label }),
  })
  return (
    <Card elevation={18} {...{ sx, ...props }}>
      <CardHeader
        sx={[{ pb: 1 }, ...forceArray(cardHeaderSx)]}
        {...{ title }}
        subheader={
          <>
            {teamOptions && teamOptions.length > 0 && (
              <Autocomplete
                autoSelect
                fullWidth
                value={inputValues.team}
                sx={{ mt: 3 }}
                enabled
                disablePortal
                options={R.pluck('label', teamOptions)}
                renderInput={(params) => (
                  // The placeholder in the API serves as a label in the context of the MUI component.
                  <TextField fullWidth label={'Team'} {...params} />
                )}
                onChange={(_, value) => {
                  setInputValues(R.assoc('team', value)(inputValues))
                }}
              />
            )}
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
          </>
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
          minRows={2}
          onChange={(value) => {
            setInputValues(R.assoc('description', value)(inputValues))
          }}
        />
      </CardContent>
      <CardActions
        disableSpacing
        sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0 }}
      >
        <Stack direction="row" spacing={1} paddingBottom={0.75}>
          <Button
            aria-label="confirm changes"
            onClick={() => {
              onClickConfirm(
                inputValues.name,
                inputValues.description,
                teamOptions &&
                  R.pipe(
                    R.find((option) => option.label === inputValues.team),
                    R.prop('value')
                  )(teamOptions)
              )
            }}
            // color="success"
            variant="contained"
            endIcon={<FetchedIcon iconName="md/MdCheck" size={24} />}
          >
            Confirm
          </Button>
          <Button
            aria-label="cancel"
            onClick={onClickCancel}
            color="error"
            variant="contained"
            startIcon={<FetchedIcon iconName="md/MdOutlineCancel" />}
          >
            Cancel
          </Button>
        </Stack>
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
  // `editable`, `duplicable` and `removable` must be
  // explicitly defined and assigned a boolean value to
  // be displayed on the card, whether they are hidden
  // in menu items or disabled. Otherwise, they are
  // removed from the available actions.
  const stdActionItems = [
    editable != null
      ? {
          label: 'Edit session',
          iconName: 'md/MdEdit',
          hidden: hideEdit,
          onClick: onClickEdit,
          disabled: !editable,
        }
      : null,
    duplicable != null
      ? {
          label: 'Duplicate session',
          iconName: 'md/MdCopyAll',
          hidden: hideDuplicate,
          onClick: onClickDuplicate,
          disabled: !duplicable,
        }
      : null,
    removable != null
      ? {
          label: 'Delete session',
          iconName: 'io/IoMdCloseCircleOutline',
          hidden: hideRemove,
          onClick: onClickRemove,
          disabled: selected || !removable,
        }
      : null,
  ]
  return (
    <ListItemCard
      {...{ disabled, selected, selectable, sx, onClick }}
      title={teamName}
      subtitle={sessionName}
      subtitleExtra={selected ? ' (current)' : ''}
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
    cardHeaderSx={[{ px: 1, py: 2 }, ...forceArray(sx)]}
    titleTypographyProps={{ variant: 'h6' }}
    subheaderTypographyProps={{ variant: 'subtitle' }}
    {...{ title, subtitle, actionItems, ...props }}
  />
)

const CustomToolbar = ({ onClickCreateHandler }) => {
  const onClick = () => onClickCreateHandler()
  return (
    <GridToolbarContainer>
      <GridToolbarFilterButton />

      <Tooltip
        key={'Create a new session'.toLocaleLowerCase()}
        title="Create a new session"
        PopperProps={{ sx: { zIndex: 2002 } }}
        enterDelay={300}
        leaveDelay={300}
      >
        {/* A `span` wrapper to acommodate disabled actions */}
        <span>
          <IconButton {...{ onClick }}>
            <FetchedIcon {...{ iconName: 'md/MdOutlineAddBox' }} />
          </IconButton>
        </span>
      </Tooltip>
    </GridToolbarContainer>
  )
}

const CustomDataGridRow = ({ ...props }) => {
  const {
    currentAction,
    index,
    onClickCancelHandler,
    onClickConfirmCreateHandler,
    onClickConfirmDuplicateHandler,
    onClickConfirmEditHandler,
    onClickDuplicateHandler,
    onClickEditHandler,
    onClickHandler,
    onClickRemoveHandler,
    sessionDescription,
    sessionId,
    sessionIdCurrent,
    sessionName,
    sessionsByTeam,
    teamCountSessions,
    teamId,
    teamLimitSessions,
    teamName,
    teams,
  } = props.row

  const selected = sessionId === sessionIdCurrent
  return (
    <Fragment key={`${teamId}-${sessionName}`}>
      {props.index === 0 && currentAction.command === 'create' && (
        <ListItemSessionCardInput
          key="create-session-form"
          title="Create session"
          sessionName={getFreeName(
            'New session',
            R.pipe(R.values, R.pluck('sessionName'))(sessionsByTeam[teamId])
          )}
          sessionDescription=""
          onClickConfirm={onClickConfirmCreateHandler}
          onClickCancel={onClickCancelHandler}
          teamOptions={R.map(
            (team) => ({ label: team.name, value: team.id }),
            teams
          )}
        />
      )}
      {sessionId === currentAction.sessionId &&
      currentAction.index >= 0 &&
      currentAction.command === 'edit' ? (
        <ListItemSessionCardInput
          key={sessionId}
          title="Edit session"
          {...{ sessionName, sessionDescription }}
          onClickConfirm={onClickConfirmEditHandler}
          onClickCancel={onClickCancelHandler}
        />
      ) : (
        <ListItemSessionCard
          teamName={teamName}
          key={sessionId}
          // When creating, duplicating, editing or deleting a session,
          // all actions are blocked for any other session
          disabled={currentAction.command != null}
          sx={{ my: 1 }}
          {...{ sessionName, selected }}
          sessionDescription={sessionDescription || 'No description available.'}
          selectable={!selected && currentAction.sessionId == null}
          editable
          duplicable={+teamCountSessions < +teamLimitSessions}
          removable
          onClick={() => onClickHandler(sessionId)}
          onClickDuplicate={() =>
            onClickDuplicateHandler(teamId, sessionId, index)
          }
          onClickEdit={() => onClickEditHandler(sessionId, index)}
          onClickRemove={() => onClickRemoveHandler(teamId, sessionId)}
        />
      )}
      {/* Render a duplicate session if applicable */}
      {currentAction.index === index &&
        currentAction.command === 'duplicate' && (
          <ListItemSessionCardInput
            key={`${currentAction.sessionId}-duplicate`}
            title="Duplicate session"
            sessionName={getFreeName(
              sessionName,
              R.pipe(R.values, R.pluck('sessionName'))(sessionsByTeam[teamId])
            )}
            sessionDescription={getFreeName(
              sessionDescription,
              R.pipe(R.values, R.pluck('sessionName'))(sessionsByTeam[teamId])
            )}
            onClickConfirm={onClickConfirmDuplicateHandler}
            onClickCancel={onClickCancelHandler}
          />
        )}
    </Fragment>
  )
}

const SessionPane = ({ width }) => {
  const [currentAction, setCurrentAction] = useState({})
  const [openDialogDelete, setOpenDialogDelete] = useState(false)

  const sessionDraggable = useSelector(selectSessionDraggable)
  const teams = useSelector(selectSortedTeams)
  const sessions = useSelector(selectSessions)
  const sessionsByTeam = useSelector(selectSessionsByTeam)
  const dispatch = useDispatch()

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
            session_id: sessionId,
          },
        },
      })
    )
  }
  // Edit session
  const onClickEditHandler = (sessionId, index) => {
    // Here, `index` detects where the click originated from to set
    // the proper location of the component that will be edited in place
    setCurrentAction({ command: 'edit', sessionId, index })
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
  const onClickCreateHandler = () => {
    setCurrentAction({ command: 'create' })
  }
  const onClickConfirmCreateHandler = (name, description, teamId) => {
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'create',
          session_command_data: {
            session_name: name,
            session_description: description,
            team_id: teamId,
          },
        },
      })
    )
    dispatch(
      mutateLocal({
        path: [],
        value: {
          settings: initialState,
        },
        sync: false,
      })
    )
    setCurrentAction({})
  }
  // Duplicate session
  const onClickDuplicateHandler = (teamId, sessionId, index) => {
    setCurrentAction({ command: 'duplicate', teamId, sessionId, index })
  }
  const onClickConfirmDuplicateHandler = (name, description) => {
    dispatch(
      sendCommand({
        command: 'session_management',
        data: {
          session_command: 'clone',
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

  const handleToggleDraggable = useMutateState(
    () => ({
      path: ['draggables', draggableId.SESSION, 'open'],
      value: !sessionDraggable.open,
      sync: false,
    }),
    [draggableId.SESSION, sessionDraggable.open]
  )

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
        height: (theme) => `calc(100% - ${theme.spacing(2.5)})`,
        position: 'absolute',
        ...(width && {
          width: (theme) => `calc(${PANE_WIDTH}px - ${theme.spacing(5)})`,
        }),
      }}
    >
      {/* Current session view */}
      <UnstyledHeader
        title="Current Session:"
        titleTypographyProps={{ variant: 'h5' }}
        actionItems={[
          {
            label: 'Drag Session Name',
            iconName: sessionDraggable.open
              ? 'md/MdOutlineCloseFullscreen'
              : 'md/MdOutlineOpenInNew',
            hidden: false,
            onClick: handleToggleDraggable,
            disabled: false,
          },
        ]}
      />
      {/* You are in the session: */}
      {currentAction.sessionId === sessionIdCurrent &&
      currentAction.command === 'edit' &&
      currentAction.index < 0 ? (
        <ListItemSessionCardInput
          disabled={currentAction.command != null}
          title="Edit session"
          {...{ sessionName, sessionDescription }}
          onClickConfirm={onClickConfirmEditHandler}
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
          duplicable={
            +teamCurrent.teamCountSessions < +teamCurrent.teamLimitSessions
          }
          hideEdit={false}
          hideDuplicate={false}
          hideRemove={false}
          onClickEdit={() => onClickEditHandler(sessionIdCurrent, -1)}
          onClickDuplicate={() =>
            onClickDuplicateHandler(teamCurrent.teamId, sessionIdCurrent, -1)
          }
        />
      )}

      <UnstyledHeader
        title="Sessions:"
        titleTypographyProps={{ variant: 'h5' }}
        sx={{ py: 3 }}
      />
      <DataGrid
        sx={{
          '.MuiDataGrid-virtualScrollerRenderZone': {
            width: '97%',
          },
        }}
        rows={R.flatten(
          R.values(
            R.mapObjIndexed(
              ({ teamName, teamId, teamCountSessions, teamLimitSessions }) =>
                R.values(
                  R.mapObjIndexed(
                    (
                      { sessionId, sessionName, sessionDescription },
                      index
                    ) => ({
                      currentAction,
                      id: `${index}-${teamId}`,
                      index,
                      onClickCancelHandler,
                      onClickConfirmCreateHandler,
                      onClickConfirmDuplicateHandler,
                      onClickConfirmEditHandler,
                      onClickDuplicateHandler,
                      onClickEditHandler,
                      onClickHandler,
                      onClickRemoveHandler,
                      sessionDescription,
                      sessionId,
                      sessionIdCurrent,
                      sessionName,
                      sessionsByTeam,
                      teamCountSessions,
                      teamId,
                      teamLimitSessions,
                      teamName,
                      teams,
                    }),
                    sessionsByTeam[teamId]
                  )
                ),
              sessions.data
            )
          )
        )}
        columns={[
          { field: 'sessionName', headerName: 'Session' },
          { field: 'teamName', headerName: 'Team' },
        ]}
        slots={{
          row: CustomDataGridRow,
          toolbar: CustomToolbar,
        }}
        slotProps={{
          toolbar: { onClickCreateHandler },
          basePopper: {
            sx: {
              zIndex: 2001,
            },
          },
        }}
      />
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
              color="error"
              variant="contained"
            >
              Delete
            </Button>
            <Button
              onClick={() => {
                setOpenDialogDelete(false)
                setCurrentAction({})
              }}
              autoFocus
              variant="contained"
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}

export default SessionPane
