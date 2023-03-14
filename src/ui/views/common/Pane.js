import { IconButton } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import AppSettingsPane from './AppSettingsPane'
import ContextPane from './ContextPane'
import FilterPane from './FilterPane'
import OptionsPane from './OptionsPane'
import SessionPane from './SessionPane'

import { sendCommand } from '../../../data/data'
import { PANE_WIDTH } from '../../../utils/constants'
import { paneId } from '../../../utils/enums'
import Pane from '../../compound/Pane'

import { FetchedIcon } from '../../compound'

const FloatButton = ({ onClick, iconName }) => (
  <IconButton
    color="primary"
    sx={{
      p: 0.5,
      border: '1px solid',
      borderRadius: 1,
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
      iconName="MdSync"
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
      iconName="MdRefresh"
    />
  )
}

const PaneWrapper = ({ open, pane, width, variant, ...props }) => (
  <Pane
    open={!!open}
    name={R.propOr(open, 'name')(pane)}
    iconName={R.propOr('BiError', 'icon', pane)}
    rightButton={
      R.equals(variant, paneId.SESSION) ? (
        <RefreshButton />
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
}

const renderAppPane = ({ open, pane, pin, onPin }) => {
  let { width, variant, ...paneProps } = pane
  // Make `PANE_WIDTH` the default width for the Session pane
  const paneWidth =
    variant === paneId.SESSION && width == null ? PANE_WIDTH : width
  return (
    <PaneWrapper
      {...{ open, variant, pin, onPin }}
      width={paneWidth}
      pane={paneProps}
    >
      {R.cond([
        // Built-in panes
        [R.equals(paneId.APP_SETTINGS), R.always(<AppSettingsPane />)],
        [R.equals(paneId.FILTER), R.always(<FilterPane />)],
        [R.equals(paneId.SESSION), R.always(<SessionPane width={paneWidth} />)],
        // Custom panes
        [R.equals(paneId.OPTIONS), R.always(<OptionsPane />)],
        [R.equals(paneId.CONTEXT), R.always(<ContextPane />)],
      ])(variant)}
    </PaneWrapper>
  )
}

export default renderAppPane
