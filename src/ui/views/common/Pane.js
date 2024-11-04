import { IconButton, Stack, Button } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import AppSettingsPane from './AppSettingsPane'
import BaseModal from './BaseModal'
import OptionsPane from './OptionsPane'
import SessionPane from './SessionPane'

import { sendCommand } from '../../../data/data'
import { PANE_WIDTH } from '../../../utils/constants'
import { paneId } from '../../../utils/enums'
import { useFilter } from '../../../utils/hooks'
import Pane from '../../compound/Pane'

import { FetchedIcon } from '../../compound'

const FloatButton = ({ onClick, iconName }) => (
  <IconButton
    color="primary"
    sx={{
      p: 0.5,
      border: '1px solid',
      borderRadius: 1,
      marginLeft: 1,
      minHeight: '24px',
      pointerEvents: '',
    }}
    {...{ onClick }}
  >
    <FetchedIcon {...{ iconName }} />
  </IconButton>
)

const SyncButton = ({ open, pane }) => {
  const dispatch = useDispatch()
  return (
    <FloatButton
      iconName="md/MdSync"
      onClick={() => {
        if (!pane) return null
        dispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'panes',
              data_path: ['data', open],
              data_value: pane,
              mutation_type: 'mutate',
              api_command: R.prop('teamSyncCommand', pane),
              api_command_keys: R.prop('teamSyncCommandKeys', pane),
              team_sync: true,
            },
          })
        )
      }}
    />
  )
}

const RefreshButton = () => {
  const dispatch = useDispatch()
  return (
    <FloatButton
      onClick={() =>
        dispatch(
          sendCommand({
            command: 'session_management',
            data: {
              session_command: 'refresh',
            },
          })
        )
      }
      iconName="md/MdRefresh"
    />
  )
}

const ResetButton = () => {
  const dispatch = useDispatch()
  const { filterOpen, handleOpenFilter, handleCloseFilter } = useFilter()

  const reset = () => {
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          api_command: 'reset',
        },
      })
    )
  }

  return (
    <>
      <FloatButton onClick={handleOpenFilter} iconName="md/MdUndo" />
      <BaseModal
        open={filterOpen}
        label="Reset Session?"
        slotProps={{
          root: { sx: { zIndex: 2001 } },
          paper: { sx: { zIndex: 2001, height: 'auto', width: '500px' } },
        }}
        onClose={handleCloseFilter}
      >
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          alignItems="center"
        >
          <Button variant="outlined" onClick={handleCloseFilter}>
            No
          </Button>
          <Button variant="contained" onClick={reset}>
            Yes
          </Button>
        </Stack>
      </BaseModal>
    </>
  )
}

const PaneWrapper = ({ open, pane, side, width, variant, ...props }) => (
  <Pane
    open={!!open}
    name={R.propOr(open, 'name')(pane)}
    iconName={R.propOr('bi/BiError', 'icon', pane)}
    side={side}
    style={R.equals(variant, paneId.SESSION) ? { zIndex: 2001 } : []}
    rightButton={
      R.equals(variant, paneId.SESSION) ? (
        <>
          <ResetButton />
          <RefreshButton />
        </>
      ) : (
        pane.teamSync && <SyncButton {...{ open, pane }} />
      )
    }
    {...{ width, ...props }}
  />
)
PaneWrapper.propTypes = {
  open: PropTypes.string,
  pane: PropTypes.object,
  side: PropTypes.oneOf(['left', 'right']),
}

const renderAppPane = ({ open, openPanesData, pane, side, pin, onPin }) => {
  let { width, variant, ...paneProps } = pane
  // Make `PANE_WIDTH` the default width for the Session pane
  const paneWidth =
    variant === paneId.SESSION && width == null ? PANE_WIDTH : width
  return (
    <PaneWrapper
      {...{ open, variant, side, pin, onPin }}
      width={paneWidth}
      pane={paneProps}
    >
      {R.cond([
        // Built-in panes
        [R.equals(paneId.APP_SETTINGS), R.always(<AppSettingsPane />)],
        [R.equals(paneId.SESSION), R.always(<SessionPane width={paneWidth} />)],
        // Custom panes
        [
          // R.equals(paneId.OPTIONS),
          R.T,
          R.always(<OptionsPane open={open} pane={openPanesData} />),
        ],
      ])(variant)}
    </PaneWrapper>
  )
}

export default renderAppPane
