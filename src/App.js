import './App.css'
import {
  StyledEngineProvider,
  ThemeProvider,
  ClickAwayListener,
  Box,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from './data/local'
import {
  selectAppBarData,
  selectMapboxToken,
  selectOpenPane,
  selectOpenPanesData,
  selectSecondaryOpenPane,
  selectSync,
  selectTheme,
  selectView,
} from './data/selectors'
import { getTheme } from './theme'
import AppBar from './ui/views/common/AppBar'
import Loader from './ui/views/common/Loader'
import renderAppPane from './ui/views/common/Pane'
import SecondaryPane from './ui/views/common/SecondaryPane'
import Dashboard from './ui/views/dashboard/Dashboard'
import Kpi from './ui/views/kpi/Kpi'
import Map from './ui/views/map/Map'
import { includesPath } from './utils'
import { APP_BAR_WIDTH } from './utils/constants'
import { viewId } from './utils/enums'

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    bgcolor: 'background.paper',
  },
  page: {
    label: 'workspace',
    position: 'relative',
    flex: '1 1 auto',
  },
  pane: {
    display: 'flex',
    position: 'absolute',
    height: '100vh',
    top: 0,
  },
}

const App = () => {
  const mapboxToken = useSelector(selectMapboxToken)
  const themeId = useSelector(selectTheme)
  const selectedView = useSelector(selectView)
  const open = useSelector(selectOpenPane)
  const secondaryOpen = useSelector(selectSecondaryOpenPane)
  const sync = useSelector(selectSync)
  const appBarData = useSelector(selectAppBarData)

  const dispatch = useDispatch()
  const theme = getTheme(themeId)
  const pane = R.assoc(
    'icon',
    R.path([open, 'icon'], appBarData),
    useSelector(selectOpenPanesData)
  )
  const renderAppPage = R.cond([
    [
      R.equals(viewId.MAP),
      R.always(mapboxToken ? <Map {...{ mapboxToken }} /> : null),
    ],
    [R.equals(viewId.DASHBOARD), R.always(<Dashboard />)],
    [R.equals(viewId.KPI), R.always(<Kpi />)],
    [R.T, null],
  ])

  const handlePaneClickAway = useCallback(
    (e) => {
      if (!R.isNil(open) && R.propOr(0, 'x', e) > APP_BAR_WIDTH) {
        dispatch(
          mutateLocal({
            path: ['appBar', 'paneState'],
            value: {},
            sync: !includesPath(R.values(sync), ['appBar', 'paneState']),
          })
        )
      }
    },
    [dispatch, open, sync]
  )

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <Box sx={styles.root}>
          <Loader />
          <AppBar />
          <Box sx={styles.page}>
            {renderAppPage(selectedView)}
            {open && (
              <ClickAwayListener onClickAway={handlePaneClickAway}>
                <Box sx={styles.pane}>
                  {renderAppPane({ open, pane })}
                  {secondaryOpen && <SecondaryPane />}
                </Box>
              </ClickAwayListener>
            )}
          </Box>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
App.propTypes = { mapboxToken: PropTypes.string }

export default App
