import './App.css'
import {
  StyledEngineProvider,
  ThemeProvider,
  ClickAwayListener,
  Box,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useCallback, useLayoutEffect, useState } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from './data/local'
import {
  selectAppBarData,
  selectAppBarId,
  selectMapboxToken,
  selectOpenPane,
  selectOpenPanesData,
  selectPinPane,
  selectSecondaryOpenPane,
  selectSessions,
  selectSync,
  selectTheme,
} from './data/selectors'
import { getTheme } from './theme'
import { ErrorBoundary } from './ui/compound'
import AppBar from './ui/views/common/AppBar'
import Loader from './ui/views/common/Loader'
import renderAppPane from './ui/views/common/Pane'
import SecondaryPane from './ui/views/common/SecondaryPane'
import SnackBar from './ui/views/common/SnackBar'
import Dashboard from './ui/views/dashboard/Dashboard'
import Kpi from './ui/views/kpi/Kpi'
import Map from './ui/views/map/Map'
import { includesPath } from './utils'
import { APP_BAR_WIDTH } from './utils/constants'
import { viewId } from './utils/enums'
// import SnackbarsProvider from '@mui/lab/SnackbarsProvider';

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
  sessionCard: {
    cursor: 'move',
    display: 'flex',
    position: 'absolute',
    width: 300,
    zIndex: 5000,
  },
  sessionCardContent: {
    overflow: 'hidden',
    overflowwrap: 'break-word',
  },
  sessionCardPosition: {
    left: 0,
    top: 0,
  },
}

const App = () => {
  const mapboxToken = useSelector(selectMapboxToken)
  const themeId = useSelector(selectTheme)
  const open = useSelector(selectOpenPane)
  const secondaryOpen = useSelector(selectSecondaryOpenPane)
  const sync = useSelector(selectSync)
  const appBarData = useSelector(selectAppBarData)
  const appBarId = useSelector(selectAppBarId)
  const pin = useSelector(selectPinPane)
  const sessions = useSelector(selectSessions)

  const dispatch = useDispatch()

  const theme = getTheme(themeId)
  const pane = R.assoc(
    'icon',
    R.path([open, 'icon'], appBarData),
    useSelector(selectOpenPanesData)
  )
  const renderAppPage = R.cond([
    [R.equals(viewId.MAP), R.always(<Map {...{ mapboxToken }} />)],
    [R.equals(viewId.DASHBOARD), R.always(<Dashboard />)],
    [R.equals(viewId.KPI), R.always(<Kpi />)],
    [R.T, null],
  ])

  const findViewType = (appBarId) =>
    R.pathOr(viewId.MAP, [appBarId, 'type'], appBarData)

  const handlePaneClickAway = useCallback(
    (e) => {
      if (!pin && R.isNotNil(open) && R.propOr(0, 'x', e) > APP_BAR_WIDTH) {
        dispatch(
          mutateLocal({
            path: ['appBar', 'paneState'],
            value: {},
            sync: !includesPath(R.values(sync), ['appBar', 'paneState']),
          })
        )
      }
    },
    [dispatch, open, sync, pin]
  )

  const pinObj = {
    pin,
    onPin: () => {
      dispatch(
        mutateLocal({
          path: ['appBar', 'paneState', 'pin'],
          value: !pin,
          sync: !includesPath(R.values(sync), ['appBar', 'paneState', 'pin']),
        })
      )
    },
  }

  const [sessionCard, setSessionCard] = useState(false)
  const [sessionCardPosition, setSessionCardPosition] = useState(
    styles.sessionCardPosition
  )
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)

  useLayoutEffect(() => {
    const handleWindowResize = () => {
      const height = window.innerHeight
      const yMax = height - 3 * APP_BAR_WIDTH
      const yPosition = R.defaultTo(0)(
        (height * sessionCardPosition.top) / windowHeight
      )
      setSessionCardPosition(
        R.assoc('top', R.clamp(0, yMax, yPosition), sessionCardPosition)
      )
      setWindowHeight(height)
    }
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  })

  const handleSessionCardDragStart = (event) => {
    const cardStyle = window.getComputedStyle(event.target)
    const xOffset = parseInt(cardStyle.getPropertyValue('left')) - event.clientX
    const yOffset = parseInt(cardStyle.getPropertyValue('top')) - event.clientY
    const cardWidth = cardStyle.getPropertyValue('width')
    const cardHeight = cardStyle.getPropertyValue('height')
    event.dataTransfer.setData(
      'text/plain',
      `${xOffset},${yOffset},${cardWidth},${cardHeight}`
    )
  }

  const handleSessionCardDrop = (event) => {
    const eventDataTransfer = event.dataTransfer
      .getData('text/plain')
      .split(',')
    const [xOffset, yOffset, cardWidth, cardHeight] = R.map(
      parseInt,
      eventDataTransfer
    )
    const xMax = window.innerWidth - (1.5 * APP_BAR_WIDTH + cardWidth)
    const yMax = window.innerHeight - (0.5 * APP_BAR_WIDTH + cardHeight)
    const xPosition = xOffset + event.clientX
    const yPosition = yOffset + event.clientY
    setSessionCardPosition({
      left: R.clamp(0, xMax, xPosition),
      top: R.clamp(0, yMax, yPosition),
    })
    event.preventDefault()
  }

  const sessionIdCurrent = `${sessions.session_id}`
  const teamAllSessions = R.pipe(
    R.prop('data'),
    R.values,
    R.find(R.hasPath(['sessions', sessionIdCurrent])),
    R.defaultTo({})
  )(sessions)
  const sessionName = R.path(
    ['sessions', sessionIdCurrent, 'sessionName'],
    teamAllSessions
  )
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <Box sx={styles.root}>
          <SnackBar />
          <AppBar />
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
                    icon: 'md/MdApi',
                    name: 'Sessions Pane',
                    variant: 'session',
                  },
                  sessionCard: sessionCard,
                  toggleSessionCard: (enabled) => setSessionCard(enabled),
                })}
              >
                {renderAppPage(findViewType(appBarId))}
                {open && (
                  <ClickAwayListener onClickAway={handlePaneClickAway}>
                    <Box sx={styles.pane}>
                      {renderAppPane({
                        open,
                        pane,
                        sessionCard: sessionCard,
                        toggleSessionCard: (enabled) => setSessionCard(enabled),
                        ...(secondaryOpen === '' && pinObj),
                      })}
                      {secondaryOpen && <SecondaryPane {...pinObj} />}
                    </Box>
                  </ClickAwayListener>
                )}
                {sessionCard && (
                  <Card
                    draggable
                    onDragStart={handleSessionCardDragStart}
                    style={R.mergeAll([
                      {
                        backgroundColor:
                          theme.palette.mode === 'dark' ? '#132a73' : '#c2eaff',
                      },
                      styles.sessionCard,
                      sessionCardPosition,
                    ])}
                  >
                    <CardContent style={styles.sessionCardContent}>
                      {' '}
                      Current Session: {sessionName}
                    </CardContent>
                    <IconButton onClick={() => setSessionCard(false)}>
                      <MdOutlineClose />
                    </IconButton>
                  </Card>
                )}
              </ErrorBoundary>
            </LocalizationProvider>
          </Box>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
App.propTypes = {
  mapboxToken: PropTypes.string,
}

export default App
