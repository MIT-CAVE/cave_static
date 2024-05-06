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
import { useEffect, useRef } from 'react'
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
import Draggables from './ui/views/common/Draggables'
import Loader from './ui/views/common/Loader'
import { AppModal } from './ui/views/common/Modal'
import renderAppPane from './ui/views/common/Pane'
import { LeftAppBar, RightAppBar, Panes } from './ui/views/common/renderAppBar'
import SnackBar from './ui/views/common/SnackBar'
import Dashboard from './ui/views/dashboard/Dashboard'
import { includesPath } from './utils'
import { paneId } from './utils/enums'
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
      demoTimeout.current = setTimeout(
        () => {
          demoTimeout.current = -1
          dispatch(
            mutateLocal({
              path: ['pages', 'currentPage'],
              value: appBarViews[isNaN(nextViewIndex) ? 0 : nextViewIndex],
              sync: !includesPath(R.values(sync), ['pages', 'currentPage']),
            })
          )
        },
        R.pathOr(15, [currentPage, 'displayTime'], demoSettings) * 1000
      )
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

  // TODO: Handle when Session pane is not defined
  const SessionPane = (
    <Box sx={styles.pane}>
      {renderAppPane({
        side: 'left',
        open: paneId.SESSION,
        pane: {
          icon: 'md/MdApi',
          name: 'Sessions Pane',
          variant: paneId.SESSION,
        },
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
          mixins: {
            MuiDataGrid: {
              containerBackground: '#4a4a4a',
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
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={styles.page}>
              <Loader />
              <ErrorBoundary fallback={SessionPane}>
                <Dashboard />
                <Panes />
                <AppModal />
              </ErrorBoundary>
            </Box>
            <Draggables />
          </LocalizationProvider>
          <RightAppBar />
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

export default App
