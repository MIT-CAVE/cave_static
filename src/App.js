import './App.css'
import { StyledEngineProvider, ThemeProvider, Box } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import {
  selectAppBarId,
  selectAppBarData,
  selectMapboxToken,
  selectTheme,
} from './data/selectors'
import { getTheme } from './theme'
import { ErrorBoundary } from './ui/compound'
import Loader from './ui/views/common/Loader'
import AppModal from './ui/views/common/Modal'
import renderAppPane from './ui/views/common/Pane'
import { LeftAppBar, RightAppBar, Panes } from './ui/views/common/renderAppBar'
import SessionCard from './ui/views/common/SessionCard'
import SnackBar from './ui/views/common/SnackBar'
import Dashboard from './ui/views/dashboard/Dashboard'
import Kpi from './ui/views/kpi/Kpi'
import { MapPage } from './ui/views/map/Map'
import { APP_BAR_WIDTH } from './utils/constants'
import { viewId } from './utils/enums'
// import SnackbarsProvider from '@mui/lab/SnackbarsProvider';

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    bgcolor: 'background.paper',
    overflow: 'hidden',
  },
  page: {
    label: 'workspace',
    position: 'relative',
    flex: '1 1 auto',
  },
  sessionCardPosition: {
    left: 0,
    top: 0,
  },
}

const App = () => {
  const mapboxToken = useSelector(selectMapboxToken)
  const themeId = useSelector(selectTheme)
  const appBarId = useSelector(selectAppBarId)
  const appBarData = useSelector(selectAppBarData)

  const theme = getTheme(themeId)
  const renderAppPage = R.cond([
    [
      R.equals(viewId.MAP),
      R.always(<MapPage {...{ mapboxToken }} mapId={appBarId} />),
    ],
    [R.equals(viewId.DASHBOARD), R.always(<Dashboard />)],
    [R.equals(viewId.KPI), R.always(<Kpi />)],
    [R.T, null],
  ])

  const findViewType = (appBarId) =>
    R.pathOr(viewId.MAP, [appBarId, 'type'], appBarData)

  const [sessionCard, setSessionCard] = useState(false)
  const [sessionCardPosition, setSessionCardPosition] = useState(
    styles.sessionCardPosition
  )

  const handleSessionCardDrop = (event) => {
    const eventDataTransfer = event.dataTransfer
      .getData('text/plain')
      .split(',')
    const [xOffset, yOffset, cardWidth, cardHeight] = R.map(
      parseInt,
      eventDataTransfer
    )
    const xMax = window.innerWidth - (2 * APP_BAR_WIDTH + cardWidth)
    const yMax = window.innerHeight - (0.5 * APP_BAR_WIDTH + cardHeight)
    const xPosition = xOffset + event.clientX
    const yPosition = yOffset + event.clientY
    setSessionCardPosition({
      left: R.clamp(0, xMax, xPosition),
      top: R.clamp(0, yMax, yPosition),
    })
    event.preventDefault()
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <Box sx={styles.root}>
          <SnackBar />
          <LeftAppBar />
          <Box
            sx={styles.page}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleSessionCardDrop}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Loader />
              <ErrorBoundary
                fallback={renderAppPane({
                  open: 'session',
                  pane: {
                    icon: 'MdApi',
                    name: 'Sessions Pane',
                    variant: 'session',
                  },
                  sessionCard: sessionCard,
                  toggleSessionCard: (enabled) => setSessionCard(enabled),
                })}
              >
                {renderAppPage(findViewType(appBarId))}
                <Panes
                  sessionCard={sessionCard}
                  setSessionCard={setSessionCard}
                />
                <SessionCard
                  enabled={sessionCard}
                  setEnabled={setSessionCard}
                  position={sessionCardPosition}
                  setPosition={setSessionCardPosition}
                />
                <AppModal />
              </ErrorBoundary>
            </LocalizationProvider>
          </Box>
          <RightAppBar />
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
App.propTypes = {
  mapboxToken: PropTypes.string,
}

export default App
