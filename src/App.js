import './App.css'
import {
  StyledEngineProvider,
  ThemeProvider,
  Box,
  createTheme,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import * as R from 'ramda'
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from './data/local'
import {
  selectCurrentPage,
  selectAppBarData,
  selectDemoMode,
  selectDemoViews,
  selectSync,
  selectDemoSettings,
} from './data/selectors'
import { ErrorBoundary } from './ui/compound'
import Loader from './ui/views/common/Loader'
import { AppModal } from './ui/views/common/Modal'
import renderAppPane from './ui/views/common/Pane'
import { LeftAppBar, RightAppBar, Panes } from './ui/views/common/renderAppBar'
import SessionCard from './ui/views/common/SessionCard'
import SnackBar from './ui/views/common/SnackBar'
import Dashboard from './ui/views/dashboard/Dashboard'
import { includesPath } from './utils'
import { APP_BAR_WIDTH } from './utils/constants'
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
  pane: {
    display: 'flex',
    position: 'absolute',
    height: '100vh',
    top: 0,
  },
}

const App = () => {
  const dispatch = useDispatch()
  const currentPage = useSelector(selectCurrentPage)
  const appBarData = useSelector(selectAppBarData)
  const appBarViews = useSelector(selectDemoViews)
  const demoMode = useSelector(selectDemoMode)
  const demoSettings = useSelector(selectDemoSettings)
  const sync = useSelector(selectSync)

  const demoTimeout = useRef(-1)

  useEffect(() => {
    if (demoMode && demoTimeout.current === -1) {
      const nextViewIndex =
        (R.findIndex(R.equals(currentPage), appBarViews) + 1) %
        R.length(appBarViews)
      demoTimeout.current = setTimeout(() => {
        demoTimeout.current = -1
        dispatch(
          mutateLocal({
            path: ['appBar', 'data', 'currentPage'],
            value: appBarViews[isNaN(nextViewIndex) ? 0 : nextViewIndex],
            sync: !includesPath(R.values(sync), [
              'appBar',
              'data',
              'currentPage',
            ]),
          })
        )
      }, R.pathOr(15, [currentPage, 'displayTime'], demoSettings) * 1000)
    } else if (demoTimeout.current !== -1 && !demoMode) {
      clearTimeout(demoTimeout.current)
      demoTimeout.current = -1
    }
    return () => {
      if (demoTimeout.current !== -1) {
        clearTimeout(demoTimeout.current)
        demoTimeout.current = -1
      }
    }
  }, [
    appBarData,
    currentPage,
    appBarViews,
    demoMode,
    demoSettings,
    dispatch,
    sync,
  ])

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

  const SessionPane = (
    <Box sx={styles.pane}>
      {renderAppPane({
        side: 'left',
        open: 'session',
        pane: {
          icon: 'md/MdApi',
          name: 'Sessions Pane',
          variant: 'session',
        },
        sessionCard: sessionCard,
        toggleSessionCard: (enabled) => setSessionCard(enabled),
      })}
    </Box>
  )

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider
        theme={createTheme({
          palette: {
            mode: 'dark',
            greyscale: {
              main: '#f2f4f9',
              light: '#99a0b4',
              dark: '#373b47',
              contrastText: '#000000',
            },
            background: {
              paper: '#4a4a4a',
            },
          },
          typography: {
            fontFamily: 'inherit',
          },
        })}
      >
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
              <ErrorBoundary fallback={SessionPane}>
                <Dashboard />
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

export default App
