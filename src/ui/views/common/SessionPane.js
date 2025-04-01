import {
  Button,
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
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

import BaseModal from './BaseModal'

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
import { useMenu, useMutateState, useModal } from '../../../utils/hooks'

import { FetchedIcon, TextInput } from '../../compound'

import { forceArray, getFreeName } from '../../../utils'

const SESSION_CARD_LARGE_HEIGHT = 470
const SESSION_CARD_SMALL_HEIGHT = 400
const SESSION_CARD_HEIGHT = 150
const SESSION_CARD_MARGIN = 8

const ACTION_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  DUPLICATE: 'duplicate',
}

const ConfirmCancelButtons = ({
  confirmText = 'Confirm',
  onCancel,
  onConfirm,
  cancelRed = true,
}) => {
  return (
    <>
      <Button
        aria-label="confirm changes"
        onClick={onConfirm}
        color={cancelRed ? 'primary' : 'error'}
        variant="contained"
        endIcon={<FetchedIcon iconName="md/MdCheck" size={24} />}
      >
        {confirmText}
      </Button>
      <Button
        aria-label="cancel"
        onClick={onCancel}
        color={cancelRed ? 'error' : 'primary'}
        variant="contained"
        startIcon={<FetchedIcon iconName="md/MdOutlineCancel" />}
      >
        Cancel
      </Button>
    </>
  )
}

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
            enterDelay={300}
            leaveDelay={300}
            slotProps={{
              popper: { sx: { zIndex: 2002 } },
            }}
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
            {...{ anchorEl }}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            sx={{ zIndex: 2002 }}
            slotProps={{
              list: {
                'aria-labelledby': 'long-button',
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
    <Card
      elevation={18}
      {...{
        sx: {
          ...sx,
          my: `${SESSION_CARD_MARGIN}px`,
        },
        ...props,
      }}
    >
      <CardHeader
        sx={[{ pb: 1 }, ...forceArray(cardHeaderSx)]}
        {...{ title }}
        subheader={
          <>
            {teamOptions && teamOptions.length > 0 && (
              <Autocomplete
                fullWidth
                autoSelect
                disablePortal
                sx={{ mt: 3 }}
                value={inputValues.team}
                options={R.pluck('label', teamOptions)}
                renderInput={(params) => (
                  // The placeholder in the API serves as a label in the context of the MUI component.
                  <TextField fullWidth label={'Team'} {...params} />
                )}
                onChange={(_, value) =>
                  setInputValues(R.assoc('team', value, inputValues))
                }
              />
            )}
            <TextInput
              controlled
              sx={{ mt: 3 }}
              label="Session name"
              value={inputValues.name}
              onChange={(value) =>
                setInputValues(R.assoc('name', value, inputValues))
              }
            />
          </>
        }
      />
      <CardContent>
        <TextInput
          multiline
          controlled
          rows={6}
          label="Session description"
          value={inputValues.description}
          onChange={(value) =>
            setInputValues(R.assoc('description', value, inputValues))
          }
        />
      </CardContent>
      <CardActions
        disableSpacing
        sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0 }}
      >
        <Stack direction="row" spacing={1} paddingBottom={0.75}>
          <ConfirmCancelButtons
            onConfirm={() =>
              onClickConfirm(
                inputValues.name,
                inputValues.description,
                teamOptions &&
                  R.pipe(
                    R.find((option) => option.label === inputValues.team),
                    R.prop('value')
                  )(teamOptions)
              )
            }
            onCancel={onClickCancel}
          />
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
  // stdActions: {
  //     name: 'edit' | 'duplicate' | 'remove' | 'reset',
  //     onClick: function,
  //     hidden: boolean, // undefined and true have the same effect
  //     disabled: boolean, // undefined and false have the same effect
  // }[]
  stdActions = [],
  extraActionItems = [],
  sx,
  onClick,
}) => {
  const stdActionInfo = {
    edit: {
      iconName: 'md/MdEdit',
    },
    duplicate: {
      iconName: 'md/MdCopyAll',
    },
    remove: {
      iconName: 'io/IoMdCloseCircleOutline',
    },
    reset: {
      iconName: 'md/MdRefresh',
    },
  }

  const generateActionLabel = (action) =>
    `${action.name.charAt(0).toUpperCase()}${action.name.slice(1)}`

  const stdActionItems = R.map(
    (action) => ({
      label: generateActionLabel(action),
      ...R.prop(action.name, stdActionInfo),
      ...action,
    }),
    stdActions
  )

  return (
    <ListItemCard
      {...{
        disabled,
        selected,
        selectable,
        sx: { ...sx, height: SESSION_CARD_HEIGHT },
        onClick,
      }}
      title={teamName}
      subtitle={sessionName}
      subtitleExtra={selected ? ' (current)' : ''}
      description={sessionDescription || 'No description available.'}
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
        enterDelay={300}
        leaveDelay={300}
        slotProps={{
          popper: { sx: { zIndex: 2002 } },
        }}
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
    onClickHandler,
    onClickEditHandler,
    onClickDuplicateHandler,
    onClickRemoveHandler,
    onClickResetHandler,
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
      {index === ACTION_TYPES.CREATE ? (
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
          sx={{ height: SESSION_CARD_LARGE_HEIGHT }}
        />
      ) : index === ACTION_TYPES.DUPLICATE ? (
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
          sx={{ height: SESSION_CARD_SMALL_HEIGHT }}
        />
      ) : index === ACTION_TYPES.EDIT ? (
        <ListItemSessionCardInput
          key={sessionId}
          title="Edit session"
          {...{ sessionName, sessionDescription }}
          onClickConfirm={onClickConfirmEditHandler}
          onClickCancel={onClickCancelHandler}
        />
      ) : (
        <ListItemSessionCard
          {...{ sessionName, selected, sessionDescription, teamName }}
          // When creating, duplicating, editing or deleting a session,
          // all actions are blocked for any other session
          disabled={currentAction.command != null}
          selectable={!selected && currentAction.sessionId == null}
          stdActions={[
            {
              name: 'edit',
              onClick: () => onClickEditHandler(sessionId, index),
            },
            {
              name: 'duplicate',
              onClick: () => onClickDuplicateHandler(teamId, sessionId, index),
              disabled: +teamCountSessions >= +teamLimitSessions,
            },
            {
              name: 'remove',
              onClick: () => onClickRemoveHandler(teamId, sessionId),
              disabled: selected,
            },
            {
              name: 'reset',
              onClick: () => onClickResetHandler(sessionId),
              disabled: !selected,
            },
          ]}
          sx={{
            height: SESSION_CARD_SMALL_HEIGHT,
            my: `${SESSION_CARD_MARGIN}px`,
          }}
          onClick={() => onClickHandler(sessionId)}
        />
      )}
    </Fragment>
  )
}

const ActionModal = ({ open, label, confirmText, onConfirm, onCancel }) => {
  return (
    <BaseModal
      open={open}
      label={label}
      slotProps={{
        root: { sx: { zIndex: 2001 } },
        paper: { sx: { zIndex: 2001, height: 'auto', width: '500px' } },
      }}
      onClose={onCancel}
    >
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={1}
        paddingY={2}
      >
        <ConfirmCancelButtons
          confirmText={confirmText}
          onConfirm={onConfirm}
          onCancel={onCancel}
          cancelRed={false}
        />
      </Stack>
    </BaseModal>
  )
}

const SessionPane = ({ width }) => {
  const dispatch = useDispatch()
  const {
    modalOpen: resetModalOpen,
    handleOpenModal: handleOpenResetModal,
    handleCloseModal: handleCloseResetModal,
  } = useModal()
  const {
    modalOpen: deleteModalOpen,
    handleOpenModal: handleOpenDeleteModal,
    handleCloseModal: handleCloseDeleteModal,
  } = useModal()

  const [currentAction, setCurrentAction] = useState({})

  const sessionDraggable = useSelector(selectSessionDraggable)
  const teams = useSelector(selectSortedTeams)
  const sessions = useSelector(selectSessions)
  const sessionsByTeam = useSelector(selectSessionsByTeam)

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
    setCurrentAction({ command: 'delete', teamId, sessionId })
    handleOpenDeleteModal()
  }

  const onCancelRemove = () => {
    setCurrentAction({})
    handleCloseDeleteModal()
  }

  const onConfirmRemove = () => {
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
    handleCloseDeleteModal()
  }

  // Reset session
  const onClickResetHandler = (teamId, sessionId) => {
    setCurrentAction({ command: 'reset', teamId, sessionId })
    handleOpenResetModal()
  }

  const onCancelReset = () => {
    setCurrentAction({})
    handleCloseResetModal()
  }

  const onConfirmReset = () => {
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          api_command: 'init',
        },
      })
    )
    setCurrentAction({})
    handleCloseResetModal()
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

  const rows = R.flatten(
    R.values(
      R.map(
        ({
          sessions,
          teamName,
          teamId,
          teamCountSessions,
          teamLimitSessions,
        }) =>
          R.values(
            R.mapObjIndexed(
              ({ sessionId, sessionName, sessionDescription }, index) => ({
                id: `${index}-${teamId}`,
                currentAction,
                index,
                onClickCancelHandler,
                onClickConfirmCreateHandler,
                onClickConfirmDuplicateHandler,
                onClickConfirmEditHandler,
                onClickHandler,
                onClickEditHandler,
                onClickDuplicateHandler,
                onClickRemoveHandler,
                onClickResetHandler,
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
              sessions
            )
          ),
        sessions.data
      )
    )
  )

  if (currentAction.command === 'create') {
    rows.unshift({
      ...rows[0],
      id: `0-${rows[0].teamId}`,
      index: ACTION_TYPES.CREATE,
    })
  } else if (currentAction.command === 'duplicate') {
    const idx = rows.findIndex(
      (row) => row.sessionId === currentAction.sessionId.toString()
    )
    rows.splice(idx + 1, 0, {
      ...rows[idx],
      id: `${idx + 1}-${rows[idx].teamId}-duplicate`,
      index: ACTION_TYPES.DUPLICATE,
    })
  } else if (currentAction.index >= 0 && currentAction.command === 'edit') {
    const idx = rows.findIndex(
      (row) => row.sessionId === currentAction.sessionId
    )
    rows[idx] = {
      ...rows[idx],
      index: ACTION_TYPES.EDIT,
    }
  }

  return (
    <>
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
            {...{ sessionName, sessionDescription }}
            teamName={teamCurrent.teamName}
            stdActions={[
              {
                name: 'edit',
                onClick: () => onClickEditHandler(sessionIdCurrent, -1),
                hidden: false,
              },
              {
                name: 'duplicate',
                onClick: () =>
                  onClickDuplicateHandler(
                    teamCurrent.teamId,
                    sessionIdCurrent,
                    -1
                  ),
                hidden: false,
                disabled:
                  +teamCurrent.teamCountSessions >=
                  +teamCurrent.teamLimitSessions,
              },
              {
                name: 'reset',
                onClick: onClickResetHandler,
                hidden: false,
              },
            ]}
          />
        )}

        <UnstyledHeader
          title="Sessions:"
          titleTypographyProps={{ variant: 'h5' }}
          sx={{ py: 3 }}
        />
        <DataGrid
          disableVirtualization
          sx={{
            '.MuiDataGrid-virtualScrollerRenderZone': {
              width: '97%',
            },
          }}
          getRowHeight={(params) => {
            const index = params.model.index
            return (
              (index === ACTION_TYPES.CREATE
                ? SESSION_CARD_LARGE_HEIGHT
                : R.includes(index, R.values(ACTION_TYPES))
                  ? SESSION_CARD_SMALL_HEIGHT
                  : SESSION_CARD_HEIGHT) +
              SESSION_CARD_MARGIN * 2
            )
          }}
          rows={rows}
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
      </Box>
      <ActionModal
        open={deleteModalOpen}
        label={`Delete '${R.path([
          currentAction.teamId,
          currentAction.sessionId,
          'sessionName',
        ])(sessionsByTeam)}' from your team '${R.path([
          'data',
          currentAction.teamId,
          'teamName',
        ])(sessions)}'? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={onConfirmRemove}
        onCancel={onCancelRemove}
      />
      <ActionModal
        open={resetModalOpen}
        label="Reset Session?"
        confirmText="Reset"
        onConfirm={onConfirmReset}
        onCancel={onCancelReset}
      />
    </>
  )
}

export default SessionPane
