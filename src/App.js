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
  selectAppBarId,
  selectAppBarData,
  selectLeftAppBarData,
  selectLeftAppBarDisplay,
  selectLeftGroupedAppBar,
  selectLeftOpenPane,
  selectLeftOpenPanesData,
  selectLeftPinPane,
  selectLeftSecondaryOpenPane,
  selectMapboxToken,
  selectMirrorMode,
  selectRightAppBarData,
  selectRightAppBarDisplay,
  selectRightGroupedAppBar,
  selectRightOpenPane,
  selectRightOpenPanesData,
  selectRightPinPane,
  selectRightSecondaryOpenPane,
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
    overflow: 'hidden',
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
    overflowWrap: 'break-word',
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
  const leftAppBarData = useSelector(selectLeftAppBarData)
  const leftBar = useSelector(selectLeftAppBarDisplay)
  const leftGroupedAppBar = useSelector(selectLeftGroupedAppBar)
  const leftOpen = useSelector(selectLeftOpenPane)
  const leftOpenPanesData = useSelector(selectLeftOpenPanesData)
  const leftPin = useSelector(selectLeftPinPane)
  const leftSecondaryOpen = useSelector(selectLeftSecondaryOpenPane)
  const rightAppBarData = useSelector(selectRightAppBarData)
  const rightBar = useSelector(selectRightAppBarDisplay)
  const rightGroupedAppBar = useSelector(selectRightGroupedAppBar)
  const rightOpen = useSelector(selectRightOpenPane)
  const rightOpenPanesData = useSelector(selectRightOpenPanesData)
  const rightPin = useSelector(selectRightPinPane)
  const rightSecondaryOpen = useSelector(selectRightSecondaryOpenPane)
  const mirrorMode = useSelector(selectMirrorMode)
  const sessions = useSelector(selectSessions)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const theme = getTheme(themeId)
  const leftPane = R.assoc(
    'icon',
    R.path([leftOpen, 'icon'], leftAppBarData),
    leftOpenPanesData
  )
  const rightPane = R.assoc(
    'icon',
    R.path([rightOpen, 'icon'], rightAppBarData),
    rightOpenPanesData
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

  const findViewType = (appBarId) =>
    R.pathOr(viewId.MAP, [appBarId, 'type'], appBarData)

  const handlePaneClickAway = useCallback(
    (e) => {
      const xPosition = R.propOr(0, 'x', e)
      const overMin = xPosition > APP_BAR_WIDTH
      const underMax = xPosition < window.innerWidth - APP_BAR_WIDTH
      R.forEach(
        ([side, open, pin, pageClick]) => {
          if (!pin && R.isNotNil(open) && pageClick) {
            dispatch(
              mutateLocal({
                path: ['appBar', 'paneState', side],
                value: {},
                sync: !includesPath(R.values(sync), [
                  'appBar',
                  'paneState',
                  side,
                ]),
              })
            )
          }
        },
        [
          ['left', leftOpen, leftPin, overMin && (!rightBar || underMax)],
          ['right', rightOpen, rightPin, (!leftBar || overMin) && underMax],
        ]
      )
    },
    [dispatch, sync, leftBar, leftOpen, leftPin, rightBar, rightOpen, rightPin]
  )

  const getPinObj = (side) => {
    return {
      pin: side === 'right' ? rightPin : leftPin,
      onPin: () => {
        dispatch(
          mutateLocal({
            path: ['appBar', 'paneState', side, 'pin'],
            value: side === 'right' ? !rightPin : !leftPin,
            sync: !includesPath(R.values(sync), [
              'appBar',
              'paneState',
              side,
              'pin',
            ]),
          })
        )
      },
    }
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
          {leftBar && (
            <AppBar
              appBar={mirrorMode ? rightGroupedAppBar : leftGroupedAppBar}
              open={leftOpen}
              pin={leftPin}
              side="left"
              source={mirrorMode ? 'right' : 'left'}
            />
          )}
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
                <ClickAwayListener onClickAway={handlePaneClickAway}>
                  <Box>
                    {R.map(
                      ([side, open, pane, openPanesData, secondaryOpen]) => {
                        return (
                          open && (
                            <Box key={side} sx={styles.pane}>
                              {renderAppPane({
                                side: side,
                                open: open,
                                pane: pane,
                                openPanesData: openPanesData,
                                secondaryOpen: secondaryOpen,
                                sessionCard: sessionCard,
                                toggleSessionCard: (enabled) =>
                                  setSessionCard(enabled),
                                ...(secondaryOpen === '' && getPinObj(side)),
                              })}
                              {secondaryOpen && (
                                <SecondaryPane
                                  side={side}
                                  open={secondaryOpen}
                                  pane={openPanesData}
                                  primaryPane={open}
                                  {...getPinObj(side)}
                                />
                              )}
                            </Box>
                          )
                        )
                      },
                      [
                        [
                          'left',
                          leftOpen,
                          leftPane,
                          leftOpenPanesData,
                          leftSecondaryOpen,
                        ],
                        [
                          'right',
                          rightOpen,
                          rightPane,
                          rightOpenPanesData,
                          rightSecondaryOpen,
                        ],
                      ]
                    )}
                  </Box>
                </ClickAwayListener>
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
                      {`Current Session: ${sessionName}`}
                    </CardContent>
                    <IconButton onClick={() => setSessionCard(false)}>
                      <MdOutlineClose />
                    </IconButton>
                  </Card>
                )}
              </ErrorBoundary>
            </LocalizationProvider>
          </Box>
          {rightBar && (
            <AppBar
              appBar={mirrorMode ? leftGroupedAppBar : rightGroupedAppBar}
              open={rightOpen}
              pin={rightPin}
              side="right"
              source={mirrorMode ? 'left' : 'right'}
            />
          )}
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
App.propTypes = {
  mapboxToken: PropTypes.string,
}

export default App
