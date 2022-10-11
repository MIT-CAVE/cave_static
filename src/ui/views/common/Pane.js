/** @jsxImportSource @emotion/react */
import { Button } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'
import { FaSync } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import AppSettingsPane from './AppSettingsPane'
import ContextPane from './ContextPane'
import FilterPane from './FilterPane'
import OptionsPane from './OptionsPane'

import { fetchData } from '../../../data/data'
import { paneId } from '../../../utils/enums'
import Pane from '../../compound/Pane'

const SyncButton = ({ open, pane }) => {
  const dispatch = useDispatch()
  return (
    <Button
      variant="outlined"
      color="greyscale"
      css={{
        minHeight: '30px',
        opacity: '',
        pointerEvents: '',
      }}
      onClick={() => {
        if (!pane) return null
        dispatch(
          fetchData({
            url: `${window.location.ancestorOrigins[0]}/mutate_session/`,
            fetchMethod: 'POST',
            body: {
              data_name: 'appBar',
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
    >
      <FaSync />
    </Button>
  )
}

const PaneWrapper = ({ open, pane, ...props }) => (
  <Pane
    open={!!open}
    name={R.propOr(open, 'name')(pane)}
    iconName={R.propOr('BiError', 'icon', pane)}
    rightButton={pane.teamSync && <SyncButton {...{ open, pane }} />}
    width={R.prop('width')(pane)}
    {...props}
  />
)
PaneWrapper.propTypes = {
  open: PropTypes.object,
  pane: PropTypes.object,
}

const renderAppPane = ({ open, pane }) => (
  <PaneWrapper {...{ open, pane }}>
    {R.cond([
      // Built-in panes
      [R.equals(paneId.APP_SETTINGS), R.always(<AppSettingsPane />)],
      [R.equals(paneId.FILTER), R.always(<FilterPane />)],
      // Custom panes
      [R.equals(paneId.OPTIONS), R.always(<OptionsPane />)],
      [R.equals(paneId.CONTEXT), R.always(<ContextPane />)],
    ])(pane.variant)}
  </PaneWrapper>
)

export default renderAppPane
